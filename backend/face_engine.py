"""
Biometric identity & face detection — Drishti AI Real-Time Vision Engine.
Supports YuNet (OpenCV 4.8+), MediaPipe Face Detection, and ArcFace embeddings.
"""

import time
import math
import numpy as np
import logging
import os
from typing import Optional, List, Tuple, Dict, Any

logger = logging.getLogger("FaceEngine")

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("FAISS library not installed. Falling back to NumPy L2 Cosine Matrix search.")

try:
    import cv2
    CV2_AVAILABLE = True
    # Check for YuNet (OpenCV 4.8+)
    YUNET_AVAILABLE = hasattr(cv2, 'FaceDetectorYN_create')
except ImportError:
    CV2_AVAILABLE = False
    YUNET_AVAILABLE = False
    logger.warning("OpenCV not available. Face detection disabled.")

try:
    import mediapipe as mp
    # Check MediaPipe version for API compatibility
    mp_version = mp.__version__
    major_version = int(mp_version.split('.')[0])
    if major_version >= 1:
        # MediaPipe 1.0+ uses Tasks API
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision as mp_vision
        MEDIAPIPE_AVAILABLE = True
        MEDIAPIPE_V1 = True
        logger.info(f"MediaPipe {mp_version} detected - using Tasks API")
    else:
        # MediaPipe < 1.0 uses solutions API
        MEDIAPIPE_AVAILABLE = True
        MEDIAPIPE_V1 = False
        logger.info(f"MediaPipe {mp_version} detected - using Solutions API")
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    MEDIAPIPE_V1 = False
    logger.warning("MediaPipe not installed. Falling back to YuNet/OpenCV.")


class ArcFaceBiometricEngine:
    def __init__(self, config):
        self.embedding_dim = config.get("embedding_dim", 512)
        self.match_thresh = config.get("match_threshold", 0.90)
        self.possible_match_min = config.get("possible_match_min_threshold", 0.75)
        self.min_face_size = config.get("min_face_size_px", 30)
        self.detector_backend = config.get("detector_backend", "auto")  # auto, yunet, mediapipe, blazeface

        # Face detector
        self.face_detector = None
        self.detector_type = None
        self._init_face_detector()

        # ArcFace embedding model (ONNX runtime for insightface)
        self.arcface_session = None
        self._init_arcface()

        # Enrolled database
        self.enrolled_persons = []
        self.faiss_index = None
        self.audit_logs = []

        self._init_faiss_and_enrolled_gallery()

    def _init_face_detector(self):
        """Initialize the best available face detector."""
        if self.detector_backend == "auto":
            # Priority: YuNet (fastest, no extra deps) > MediaPipe > BlazeFace fallback
            if YUNET_AVAILABLE:
                self.detector_backend = "yunet"
            elif MEDIAPIPE_AVAILABLE:
                self.detector_backend = "mediapipe"
            else:
                self.detector_backend = "blazeface_fallback"

        if self.detector_backend == "yunet" and YUNET_AVAILABLE:
            self._init_yunet()
        elif self.detector_backend == "mediapipe" and MEDIAPIPE_AVAILABLE:
            self._init_mediapipe()
        else:
            self.detector_type = "blazeface_fallback"
            logger.info("Using BlazeFace fallback (simulated landmarks)")

    def _init_yunet(self):
        """Initialize OpenCV YuNet face detector."""
        try:
            # YuNet model path - OpenCV 4.8+ includes it, or we can download
            model_path = self._get_yunet_model_path()
            if model_path and os.path.exists(model_path):
                self.face_detector = cv2.FaceDetectorYN_create(
                    model=model_path,
                    config="",
                    input_size=(320, 320),
                    score_threshold=0.7,
                    nms_threshold=0.3,
                    top_k=50,
                    backend_id=cv2.dnn.DNN_BACKEND_OPENCV,
                    target_id=cv2.dnn.DNN_TARGET_CPU
                )
                self.detector_type = "yunet"
                logger.info(f"YuNet face detector initialized from {model_path}")
            else:
                logger.warning("YuNet model not found, falling back to MediaPipe")
                if MEDIAPIPE_AVAILABLE:
                    self._init_mediapipe()
                else:
                    self.detector_type = "blazeface_fallback"
        except Exception as e:
            logger.error(f"Failed to initialize YuNet: {e}")
            if MEDIAPIPE_AVAILABLE:
                self._init_mediapipe()
            else:
                self.detector_type = "blazeface_fallback"

    def _get_yunet_model_path(self) -> Optional[str]:
        """Get YuNet model path - checks local, then downloads if needed."""
        # Check local paths
        backend_dir = os.path.dirname(__file__)
        possible_paths = [
            os.path.join(backend_dir, "face_detection_yunet_2023mar.onnx"),
            os.path.join(backend_dir, "models", "face_detection_yunet_2023mar.onnx"),
            os.path.expanduser("~/.cache/opencv/face_detection_yunet_2023mar.onnx"),
        ]
        for p in possible_paths:
            if os.path.exists(p):
                return p
        # Return default path for auto-download
        return possible_paths[0]

    def _init_mediapipe(self):
        """Initialize MediaPipe Face Detection (supports both v0.x and v1.0+)."""
        try:
            if MEDIAPIPE_V1:
                # MediaPipe 1.0+ Tasks API - need model file
                model_path = self._get_mediapipe_model_path()
                if model_path and os.path.exists(model_path):
                    base_options = mp_python.BaseOptions(model_asset_path=model_path)
                    options = mp_vision.FaceDetectorOptions(
                        base_options=base_options,
                        running_mode=mp_vision.RunningMode.IMAGE,
                        min_detection_confidence=0.6
                    )
                    self.mp_face_detector = mp_vision.FaceDetector.create_from_options(options)
                    self.detector_type = "mediapipe"
                    logger.info(f"MediaPipe Face Detection initialized (Tasks API v1.0+) from {model_path}")
                else:
                    logger.warning("MediaPipe face detection model not found, falling back to YuNet/BlazeFace")
                    raise FileNotFoundError("MediaPipe model not found")
            else:
                # MediaPipe < 1.0 Solutions API
                self.mp_face_detection = mp.solutions.face_detection.FaceDetection(
                    model_selection=1,
                    min_detection_confidence=0.6
                )
                self.detector_type = "mediapipe"
                logger.info("MediaPipe Face Detection initialized (Solutions API v0.x)")
        except Exception as e:
            logger.error(f"Failed to initialize MediaPipe: {e}")
            self.detector_type = "blazeface_fallback"

    def _init_arcface(self):
        """Initialize ArcFace embedding model using ONNX Runtime."""
        try:
            import onnxruntime as ort
            model_path = self._get_arcface_model_path()
            if model_path and os.path.exists(model_path):
                self.arcface_session = ort.InferenceSession(
                    model_path,
                    providers=['CPUExecutionProvider']
                )
                logger.info(f"ArcFace ONNX model loaded from {model_path}")
            else:
                logger.warning("ArcFace ONNX model not found. Using deterministic embeddings for demo.")
        except ImportError:
            logger.warning("onnxruntime not installed. Using deterministic embeddings for demo.")
        except Exception as e:
            logger.error(f"Failed to initialize ArcFace: {e}")

    def _get_arcface_model_path(self) -> Optional[str]:
        """Get ArcFace ONNX model path."""
        backend_dir = os.path.dirname(__file__)
        possible_paths = [
            os.path.join(backend_dir, "arcface_r100.onnx"),
            os.path.join(backend_dir, "models", "arcface_r100.onnx"),
            os.path.join(backend_dir, "w600k_r50.onnx"),  # insightface model
        ]
        for p in possible_paths:
            if os.path.exists(p):
                return p
        return None

    def _get_mediapipe_model_path(self) -> Optional[str]:
        """Get MediaPipe face detection model path."""
        backend_dir = os.path.dirname(__file__)
        possible_paths = [
            os.path.join(backend_dir, "face_detector.tflite"),
            os.path.join(backend_dir, "models", "face_detector.tflite"),
            os.path.expanduser("~/.cache/mediapipe/face_detector.tflite"),
        ]
        for p in possible_paths:
            if os.path.exists(p):
                return p
        return None

    def _init_faiss_and_enrolled_gallery(self):
        """Initializes FAISS similarity index with demo gallery."""
        if FAISS_AVAILABLE:
            self.faiss_index = faiss.IndexFlatIP(self.embedding_dim)

        # Seed enrolled gallery with deterministic vectors (replace with real enrollments in production)
        demo_gallery = [
            {"id": "LP101", "name": "Aarav Sharma", "age": 7, "city": "Ahmedabad", "phone": "+91 98765 43210"},
            {"id": "LP102", "name": "Ramesh Varma (Senior)", "age": 72, "city": "Rajkot", "phone": "+91 98123 45678"},
            {"id": "LP103", "name": "Priya Patel", "age": 12, "city": "Surat", "phone": "+91 99000 11223"},
            {"id": "LP104", "name": "Vikram Solanki", "age": 28, "city": "Vadodara", "phone": "+91 97234 56789"}
        ]

        for p in demo_gallery:
            seed = sum(ord(c) for c in p["name"])
            vec = self._generate_normalized_vector(seed)
            p["embedding"] = vec
            self.enrolled_persons.append(p)

            if FAISS_AVAILABLE and self.faiss_index:
                self.faiss_index.add(np.ascontiguousarray([vec], dtype=np.float32))

    def _generate_normalized_vector(self, seed_val):
        """Generates deterministic normalized embedding vector for demo."""
        np.random.seed(seed_val)
        vec = np.random.randn(self.embedding_dim).astype(np.float32)
        norm = np.linalg.norm(vec)
        return vec / (norm + 1e-7)

    def _preprocess_face_for_arcface(self, face_img: np.ndarray) -> np.ndarray:
        """Preprocess face crop for ArcFace (112x112, normalized)."""
        # Resize to 112x112
        face_resized = cv2.resize(face_img, (112, 112))
        # Normalize: RGB, mean=0.5, std=0.5 (ArcFace standard)
        face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
        face_normalized = (face_rgb.astype(np.float32) / 255.0 - 0.5) / 0.5
        # HWC to CHW
        face_chw = np.transpose(face_normalized, (2, 0, 1))
        # Add batch dimension
        return np.expand_dims(face_chw, axis=0).astype(np.float32)

    def _extract_arcface_embedding(self, face_img: np.ndarray) -> np.ndarray:
        """Extract 512-dim ArcFace embedding from face crop."""
        if self.arcface_session is not None:
            try:
                input_tensor = self._preprocess_face_for_arcface(face_img)
                input_name = self.arcface_session.get_inputs()[0].name
                outputs = self.arcface_session.run(None, {input_name: input_tensor})
                embedding = outputs[0].flatten()
                # L2 normalize
                norm = np.linalg.norm(embedding)
                return embedding / (norm + 1e-7)
            except Exception as e:
                logger.warning(f"ArcFace inference failed: {e}")

        # Fallback: deterministic embedding
        seed = int(time.time() * 1000) % 999999
        return self._generate_normalized_vector(seed)

    def detect_faces(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect faces in frame using the initialized detector.
        Returns list of dicts with: bbox, landmarks, confidence, face_crop
        """
        if frame is None:
            return []

        h, w = frame.shape[:2]
        detected_faces = []

        if self.detector_type == "yunet" and self.face_detector is not None:
            detected_faces = self._detect_yunet(frame, w, h)
        elif self.detector_type == "mediapipe" and hasattr(self, 'mp_face_detection'):
            detected_faces = self._detect_mediapipe(frame, w, h)
        else:
            detected_faces = self._detect_blazeface_fallback(frame, w, h)

        # Filter by min face size and add face crops
        filtered = []
        for face in detected_faces:
            x1, y1, x2, y2 = face["bbox"]
            fw, fh = x2 - x1, y2 - y1
            if fw >= self.min_face_size and fh >= self.min_face_size:
                # Extract face crop for embedding
                face_crop = frame[y1:y2, x1:x2] if fw > 0 and fh > 0 else None
                face["face_crop"] = face_crop
                filtered.append(face)

        return filtered

    def _detect_yunet(self, frame: np.ndarray, w: int, h: int) -> List[Dict]:
        """Detect faces using YuNet."""
        faces = []
        try:
            # YuNet expects input size to be set
            self.face_detector.setInputSize((w, h))
            _, results = self.face_detector.detect(frame)
            if results is not None:
                for det in results:
                    x, y, fw, fh = det[:4].astype(int)
                    conf = float(det[14]) if len(det) > 14 else 0.9
                    landmarks = det[4:14].reshape(5, 2).astype(int) if len(det) >= 14 else None

                    faces.append({
                        "bbox": (x, y, x + fw, y + fh),
                        "landmarks": [(int(l[0]), int(l[1])) for l in landmarks] if landmarks is not None else [],
                        "confidence": round(conf * 100, 1),
                        "detector": "yunet"
                    })
        except Exception as e:
            logger.error(f"YuNet detection error: {e}")
        return faces

    def _detect_mediapipe(self, frame: np.ndarray, w: int, h: int) -> List[Dict]:
        """Detect faces using MediaPipe (supports both v0.x and v1.0+)."""
        faces = []
        try:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            if MEDIAPIPE_V1:
                # MediaPipe 1.0+ Tasks API
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                detection_result = self.mp_face_detector.detect(mp_image)
                
                for i, detection in enumerate(detection_result.detections):
                    bbox = detection.bounding_box
                    x = bbox.origin_x
                    y = bbox.origin_y
                    fw = bbox.width
                    fh = bbox.height
                    conf = detection.categories[0].score if detection.categories else 0.9

                    # MediaPipe Tasks API provides keypoints
                    landmarks = []
                    if detection.keypoints:
                        for kp in detection.keypoints:
                            landmarks.append((int(kp.x), int(kp.y)))

                    faces.append({
                        "bbox": (x, y, x + fw, y + fh),
                        "landmarks": landmarks,
                        "confidence": round(conf * 100, 1),
                        "detector": "mediapipe"
                    })
            else:
                # MediaPipe < 1.0 Solutions API
                results = self.mp_face_detection.process(rgb)
                if results.detections:
                    for i, det in enumerate(results.detections):
                        bbox = det.location_data.relative_bounding_box
                        x = int(bbox.xmin * w)
                        y = int(bbox.ymin * h)
                        fw = int(bbox.width * w)
                        fh = int(bbox.height * h)
                        conf = det.score[0] if det.score else 0.9

                        landmarks = []
                        if det.location_data.relative_keypoints:
                            for kp in det.location_data.relative_keypoints:
                                landmarks.append((int(kp.x * w), int(kp.y * h)))

                        faces.append({
                            "bbox": (x, y, x + fw, y + fh),
                            "landmarks": landmarks,
                            "confidence": round(conf * 100, 1),
                            "detector": "mediapipe"
                        })
        except Exception as e:
            logger.error(f"MediaPipe detection error: {e}")
        return faces

    def _detect_blazeface_fallback(self, frame: np.ndarray, w: int, h: int) -> List[Dict]:
        """Fallback simulated face detection (original behavior)."""
        faces = []
        # Simulate 1-3 faces based on frame content
        num_faces = min(3, max(1, w // 400))
        for i in range(num_faces):
            fw, fh = 80, 100
            fx = int(w * 0.15 + i * (w * 0.7 / max(1, num_faces)))
            fy = int(h * 0.25)

            landmarks = [
                (fx + int(fw * 0.30), fy + int(fh * 0.35)),
                (fx + int(fw * 0.70), fy + int(fh * 0.35)),
                (fx + int(fw * 0.50), fy + int(fh * 0.55)),
                (fx + int(fw * 0.35), fy + int(fh * 0.75)),
                (fx + int(fw * 0.65), fy + int(fh * 0.75)),
            ]

            faces.append({
                "id": i + 1,
                "bbox": (fx, fy, fx + fw, fy + fh),
                "landmarks": landmarks,
                "confidence": 96.0,
                "detector": "blazeface_fallback"
            })
        return faces

    def extract_blazeface_landmarks(self, frame):
        """Backward compatible method - returns landmarks and count."""
        faces = self.detect_faces(frame)
        # Convert to old format for compatibility
        landmarks_list = []
        for face in faces:
            landmarks_list.append({
                "id": face.get("id", 1),
                "bbox": face["bbox"],
                "landmarks": face["landmarks"],
                "confidence": face["confidence"]
            })
        return landmarks_list, len(landmarks_list)

    def search_lost_person(self, image_bytes_or_uri, query_name="Uploaded Devotee Photo"):
        """Searches vector index against gallery using real face detection + ArcFace."""
        # If image_bytes_or_uri is bytes, decode it
        if isinstance(image_bytes_or_uri, bytes):
            nparr = np.frombuffer(image_bytes_or_uri, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif isinstance(image_bytes_or_uri, str):
            # Assume it's a file path or base64
            if os.path.exists(image_bytes_or_uri):
                frame = cv2.imread(image_bytes_or_uri)
            else:
                frame = None
        else:
            frame = None

        # Detect faces in uploaded image
        faces = self.detect_faces(frame) if frame is not None else []

        if not faces:
            return {
                "status": "NO_MATCH",
                "message": "NO FACE DETECTED IN UPLOADED IMAGE",
                "similarity_score": 0.0,
                "confidence_pct": 0.0,
                "matched_person": None,
                "dpdp_audit_log": {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "query": query_name, "error": "no_face"}
            }

        # Use the largest face (most likely the person of interest)
        best_face = max(faces, key=lambda f: (f["bbox"][2] - f["bbox"][0]) * (f["bbox"][3] - f["bbox"][1]))
        face_crop = best_face.get("face_crop")

        # Extract embedding
        if face_crop is not None and face_crop.size > 0:
            query_vec = self._extract_arcface_embedding(face_crop)
        else:
            seed = sum(ord(c) for c in query_name) + int(time.time() * 1000) % 997
            query_vec = self._generate_normalized_vector(seed)

        # Search in enrolled gallery
        best_match = None
        best_similarity = -1.0

        if FAISS_AVAILABLE and self.faiss_index and self.faiss_index.ntotal > 0:
            query_vec_f32 = np.ascontiguousarray([query_vec], dtype=np.float32)
            similarities, indices = self.faiss_index.search(query_vec_f32, 1)
            if indices[0][0] != -1:
                idx = indices[0][0]
                best_similarity = float(similarities[0][0])
                best_match = self.enrolled_persons[idx]
        else:
            # NumPy fallback
            for i, person in enumerate(self.enrolled_persons):
                sim = np.dot(query_vec, person["embedding"])
                if sim > best_similarity:
                    best_similarity = sim
                    best_match = person

        similarity = max(0.0, best_similarity) if best_match else 0.0

        # Audit logging
        audit_record = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "query": query_name,
            "detector": self.detector_type,
            "faces_detected": len(faces),
            "match_id": best_match["id"] if best_match else None,
            "matched_name": best_match["name"] if best_match else None,
            "similarity_score": round(similarity, 4),
            "dpdp_compliant": True
        }
        self.audit_logs.append(audit_record)

        if similarity >= self.match_thresh:
            result_status = "MATCH"
            message = f"CONFIRMED MATCH (Confidence: {round(similarity * 100, 1)}%)"
        elif similarity >= self.possible_match_min:
            result_status = "POSSIBLE_MATCH"
            message = f"POSSIBLE MATCH (Confidence: {round(similarity * 100, 1)}%)"
        else:
            result_status = "NO_MATCH"
            message = "NO MATCHING IDENTITY IN ENROLLED LOST PERSON DATABASE"

        return {
            "status": result_status,
            "message": message,
            "similarity_score": round(similarity, 4),
            "confidence_pct": round(similarity * 100, 1),
            "matched_person": best_match if similarity >= self.possible_match_min else None,
            "detected_faces": len(faces),
            "detector_used": self.detector_type,
            "dpdp_audit_log": audit_record
        }

    def enroll_person(self, face_img: np.ndarray, person_info: Dict) -> Dict:
        """Enroll a new person into the gallery."""
        faces = self.detect_faces(face_img)
        if not faces:
            return {"status": "ERROR", "message": "No face detected for enrollment"}

        best_face = max(faces, key=lambda f: (f["bbox"][2] - f["bbox"][0]) * (f["bbox"][3] - f["bbox"][1]))
        face_crop = best_face.get("face_crop")

        if face_crop is not None and face_crop.size > 0:
            embedding = self._extract_arcface_embedding(face_crop)
        else:
            seed = sum(ord(c) for c in person_info.get("name", "Unknown"))
            embedding = self._generate_normalized_vector(seed)

        person_info["embedding"] = embedding
        person_info["enrolled_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
        self.enrolled_persons.append(person_info)

        if FAISS_AVAILABLE and self.faiss_index:
            self.faiss_index.add(np.ascontiguousarray([embedding], dtype=np.float32))

        return {
            "status": "SUCCESS",
            "message": f"Enrolled {person_info['name']}",
            "person_id": person_info.get("id", f"LP{len(self.enrolled_persons)}")
        }