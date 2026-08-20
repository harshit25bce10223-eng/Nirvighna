"""
Biometric identity & face detection.
"""

import time
import math
import numpy as np
import logging

logger = logging.getLogger("FaceEngine")

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("FAISS library not installed. Falling back to NumPy L2 Cosine Matrix search.")


class ArcFaceBiometricEngine:
    def __init__(self, config):
        self.embedding_dim = config.get("embedding_dim", 512)
        self.match_thresh = config.get("match_threshold", 0.90)
        self.possible_match_min = config.get("possible_match_min_threshold", 0.75)
        self.min_face_size = config.get("min_face_size_px", 30)

        # Enrolled database
        self.enrolled_persons = []
        self.faiss_index = None
        self.audit_logs = []

        self._init_faiss_and_enrolled_gallery()

    def _init_faiss_and_enrolled_gallery(self):
        """Initializes FAISS similarity index."""
        if FAISS_AVAILABLE:
            self.faiss_index = faiss.IndexFlatIP(self.embedding_dim)  # Inner product for cosine similarity

        # Seed enrolled gallery
        demo_gallery = [
            {"id": "LP101", "name": "Aarav Sharma", "age": 7, "city": "Ahmedabad", "phone": "+91 98765 43210"},
            {"id": "LP102", "name": "Ramesh Varma (Senior)", "age": 72, "city": "Rajkot", "phone": "+91 98123 45678"},
            {"id": "LP103", "name": "Priya Patel", "age": 12, "city": "Surat", "phone": "+91 99000 11223"},
            {"id": "LP104", "name": "Vikram Solanki", "age": 28, "city": "Vadodara", "phone": "+91 97234 56789"}
        ]

        for p in demo_gallery:
            # Generate deterministic vector
            seed = sum(ord(c) for c in p["name"])
            vec = self._generate_normalized_vector(seed)
            p["embedding"] = vec
            self.enrolled_persons.append(p)
            
            if FAISS_AVAILABLE and self.faiss_index:
                self.faiss_index.add(np.ascontiguousarray([vec], dtype=np.float32))

    def _generate_normalized_vector(self, seed_val):
        """Generates normalized embedding vector."""
        np.random.seed(seed_val)
        vec = np.random.randn(self.embedding_dim).astype(np.float32)
        norm = np.linalg.norm(vec)
        return vec / (norm + 1e-7)

    def extract_blazeface_landmarks(self, frame):
        """Extracts facial landmarks from frame."""
        if frame is None:
            return [], 0

        h, w, _ = frame.shape
        detected_faces = []

        # Simulate landmark extraction
        # Face detector runs here
        num_faces = 3
        for i in range(num_faces):
            fw, fh = 75, 95
            fx = int(w * 0.25 + i * 180)
            fy = int(h * 0.35)

            if fw < self.min_face_size or fh < self.min_face_size:
                continue

            landmarks = [
                (fx + int(fw * 0.30), fy + int(fh * 0.35)),  # Left Eye
                (fx + int(fw * 0.70), fy + int(fh * 0.35)),  # Right Eye
                (fx + int(fw * 0.50), fy + int(fh * 0.55)),  # Nose Tip
                (fx + int(fw * 0.35), fy + int(fh * 0.75)),  # Left Mouth Corner
                (fx + int(fw * 0.65), fy + int(fh * 0.75)),  # Right Mouth Corner
            ]

            detected_faces.append({
                "id": i + 1,
                "bbox": (fx, fy, fx + fw, fy + fh),
                "landmarks": landmarks,
                "confidence": 98.4,
            })

        return detected_faces, len(detected_faces)

    def search_lost_person(self, image_bytes_or_uri, query_name="Uploaded Devotee Photo"):
        """Searches vector index against gallery."""
        # Generate embedding for uploaded image
        seed = sum(ord(c) for c in query_name) + int(time.time() * 1000) % 997
        query_vec = self._generate_normalized_vector(seed)

        # Force match for demo
        best_match = self.enrolled_persons[0]
        similarity = 0.948  # Simulate match

        # Audit logging
        audit_record = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "query": query_name,
            "match_id": best_match["id"],
            "matched_name": best_match["name"],
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
            "dpdp_audit_log": audit_record
        }
