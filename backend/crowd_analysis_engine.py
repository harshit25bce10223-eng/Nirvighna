"""
Crowd Analysis Engine for Photo/Video Upload
Uses trained CSRNet model for density map estimation and crowd counting.
Supports large crowds (1M+) via density map integration.
"""

import os
import cv2
import numpy as np
import torch
import logging
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path

logger = logging.getLogger("CrowdAnalysisEngine")


class CrowdAnalysisEngine:
    """Production-ready crowd analysis for uploaded media"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.model_path = config.get("model_path", "./models/crowd_csrnet.pth")
        self.onnx_path = config.get("onnx_path", "./models/crowd_csrnet.onnx")
        self.input_size = config.get("input_size", (768, 1024))
        self.patch_size = config.get("patch_size", (384, 512))
        self.stride = config.get("stride", (256, 320))
        self.confidence_threshold = config.get("confidence_threshold", 0.1)
        self.max_patches = config.get("max_patches", 100)
        
        self.model = None
        self.onnx_session = None
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.use_onnx = config.get("use_onnx", True)
        
        self._load_model()
    
    def _load_model(self):
        """Load PyTorch or ONNX model"""
        if self.use_onnx and os.path.exists(self.onnx_path):
            try:
                import onnxruntime as ort
                providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'] if self.device == 'cuda' else ['CPUExecutionProvider']
                self.onnx_session = ort.InferenceSession(self.onnx_path, providers=providers)
                logger.info(f"Loaded ONNX model from {self.onnx_path}")
                return
            except Exception as e:
                logger.warning(f"Failed to load ONNX model: {e}, falling back to PyTorch")
        
        if os.path.exists(self.model_path):
            try:
                from train_crowd_model import CSRNet
                self.model = CSRNet().to(self.device)
                checkpoint = torch.load(self.model_path, map_location=self.device)
                self.model.load_state_dict(checkpoint['model_state_dict'])
                self.model.eval()
                logger.info(f"Loaded PyTorch model from {self.model_path}")
                return
            except Exception as e:
                logger.warning(f"Failed to load PyTorch model: {e}")
        
        logger.warning("No trained model found. Using fallback density estimation.")

    def reload_model(self):
        """Re-checks model paths and loads newly trained model into memory."""
        self._load_model()
        return self.model is not None or self.onnx_session is not None
    
    def analyze_image(self, image: np.ndarray) -> Dict[str, Any]:
        """Analyze a single image for crowd count and density"""
        if image is None:
            return {"count": 0, "density_map": None, "error": "No image provided"}
        
        # If model wasn't loaded at startup, check if training completed recently
        if self.model is None and self.onnx_session is None:
            self._load_model()
        
        h, w = image.shape[:2]
        
        if self.model is not None or self.onnx_session is not None:
            return self._analyze_with_model(image)
        else:
            return self._analyze_fallback(image)
    
    def _analyze_with_model(self, image: np.ndarray) -> Dict[str, Any]:
        """Analyze using trained CSRNet model - resize to input size for fast inference"""
        h, w = image.shape[:2]
        
        # For typical uploaded images, just resize to model input size and run once
        # This is much faster than sliding window and works well for crowd counting
        target_h, target_w = self.input_size
        
        # Preprocess
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image_resized = cv2.resize(image_rgb, (target_w, target_h))
        image_normalized = image_resized.astype(np.float32) / 255.0
        image_normalized = (image_normalized - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
        image_tensor = image_normalized.transpose(2, 0, 1).astype(np.float32)
        batch_tensor = np.expand_dims(image_tensor, axis=0)
        
        # Inference
        if self.onnx_session is not None:
            outputs = self.onnx_session.run(None, {'input': batch_tensor})[0]
        else:
            with torch.no_grad():
                batch_tensor_torch = torch.from_numpy(batch_tensor).to(self.device)
                outputs = self.model(batch_tensor_torch).cpu().numpy()
        
        # Output is [1, 1, H/8, W/8] - upscale to original image size
        density_map_small = outputs[0, 0]
        density_map = cv2.resize(density_map_small, (w, h))
        
        # Scale density to account for resize (preserve total count)
        scale_factor = (target_h * target_w) / (h * w)
        density_map = density_map * scale_factor
        
        total_count = float(density_map.sum())
        avg_density = float(density_map.mean())
        max_density = float(density_map.max())
        
        # Generate heatmap
        density_normalized = cv2.normalize(density_map, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        heatmap = cv2.applyColorMap(density_normalized, cv2.COLORMAP_JET)
        
        return {
            "count": int(round(total_count)),
            "density": round(avg_density * 10000, 2),
            "max_density": round(max_density * 10000, 2),
            "density_map": density_map,
            "heatmap": heatmap,
            "method": "CSRNet Density Estimation (Fast Resize)",
            "image_size": (w, h)
        }
    
    def _preprocess_batch(self, patches: List[np.ndarray]) -> np.ndarray:
        """Preprocess batch of patches for model input"""
        processed = []
        for patch in patches:
            patch_rgb = cv2.cvtColor(patch, cv2.COLOR_BGR2RGB)
            patch_resized = cv2.resize(patch_rgb, (self.input_size[1], self.input_size[0]))
            patch_normalized = patch_resized.astype(np.float32) / 255.0
            patch_normalized = (patch_normalized - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
            patch_tensor = patch_normalized.transpose(2, 0, 1)
            processed.append(patch_tensor)
        return np.stack(processed, axis=0).astype(np.float32)
    
    def _analyze_fallback(self, image: np.ndarray) -> Dict[str, Any]:
        """Fallback analysis using YOLO + density estimation"""
        h, w = image.shape[:2]
        
        try:
            from ultralytics import YOLO
            model = YOLO('yolov8n.pt')
            results = model(image, classes=[0], conf=0.3, iou=0.45, verbose=False)
            
            detections = []
            for r in results:
                for box in r.boxes:
                    conf = float(box.conf[0])
                    xyxy = box.xyxy[0].cpu().numpy()
                    detections.append({
                        'bbox': xyxy.astype(int).tolist(),
                        'confidence': conf
                    })
            
            count = len(detections)
            density = count / max(1, (h * w) / 10000)
            
            heatmap = np.zeros((h, w, 3), dtype=np.uint8)
            for det in detections:
                x1, y1, x2, y2 = det['bbox']
                cv2.rectangle(heatmap, (x1, y1), (x2, y2), (0, 255, 255), 2)
                cv2.putText(heatmap, f"{det['confidence']:.2f}", (x1, y1-5), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
            
            return {
                "count": count,
                "density": round(density, 2),
                "max_density": round(density * 2, 2),
                "density_map": None,
                "heatmap": heatmap,
                "method": "YOLOv8 Detection Fallback",
                "detections": detections,
                "image_size": (w, h)
            }
        except Exception as e:
            logger.warning(f"YOLO fallback failed: {e}")
            return self._analyze_heuristic(image)
    
    def _analyze_heuristic(self, image: np.ndarray) -> Dict[str, Any]:
        """Heuristic crowd estimation using image processing"""
        h, w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        edges = cv2.Canny(gray, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        person_like = 0
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if 100 < area < 5000:
                x, y, w_cnt, h_cnt = cv2.boundingRect(cnt)
                aspect = h_cnt / max(1, w_cnt)
                if 1.2 < aspect < 4.0:
                    person_like += 1
        
        count = min(person_like, max(10, int((h * w) / 5000)))
        density = count / max(1, (h * w) / 10000)
        
        return {
            "count": count,
            "density": round(density, 2),
            "max_density": round(density * 1.5, 2),
            "density_map": None,
            "heatmap": None,
            "method": "Heuristic Edge Detection",
            "image_size": (w, h)
        }
    
    def analyze_video(self, video_path: str, sample_rate: int = 5) -> Dict[str, Any]:
        """Analyze video by sampling frames"""
        if self.model is None and self.onnx_session is None:
            self._load_model()
            
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"error": "Could not open video"}
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / max(1, fps)
        
        frame_results = []
        frame_idx = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_idx % sample_rate == 0:
                result = self.analyze_image(frame)
                result['frame_index'] = frame_idx
                result['timestamp'] = frame_idx / max(1, fps)
                frame_results.append(result)
            
            frame_idx += 1
        
        cap.release()
        
        if not frame_results:
            return {"error": "No frames processed"}
        
        counts = [r['count'] for r in frame_results]
        densities = [r['density'] for r in frame_results]
        
        return {
            "total_frames": total_frames,
            "sampled_frames": len(frame_results),
            "duration_sec": round(duration, 1),
            "fps": round(fps, 1),
            "sample_rate": sample_rate,
            "avg_count": int(round(np.mean(counts))),
            "max_count": int(max(counts)),
            "min_count": int(min(counts)),
            "avg_density": round(np.mean(densities), 2),
            "max_density": round(max(densities), 2),
            "frame_results": frame_results[:10],
            "method": frame_results[0].get('method', 'Unknown') if frame_results else 'Unknown'
        }
    
    def get_risk_level(self, count: int, density: float, area_m2: float = 100) -> Dict[str, Any]:
        """Calculate crowd risk level based on count and density"""
        density_pm2 = count / max(1, area_m2)
        
        if density_pm2 >= 5.0 or count >= 500:
            level = "CRITICAL"
            color = (0, 0, 255)
            message = f"CRITICAL: Extreme density ({density_pm2:.1f} P/m²). Immediate intervention required."
        elif density_pm2 >= 3.5 or count >= 300:
            level = "HIGH"
            color = (0, 165, 255)
            message = f"HIGH: Dangerous density ({density_pm2:.1f} P/m²). Active monitoring required."
        elif density_pm2 >= 2.0 or count >= 150:
            level = "ELEVATED"
            color = (0, 255, 255)
            message = f"ELEVATED: Elevated density ({density_pm2:.1f} P/m²). Increased vigilance."
        else:
            level = "OPTIMAL"
            color = (0, 255, 0)
            message = f"OPTIMAL: Safe density ({density_pm2:.1f} P/m²). Normal operations."
        
        return {
            "level": level,
            "color_bgr": color,
            "density_pm2": round(density_pm2, 2),
            "message": message,
            "recommended_actions": self._get_recommendations(level)
        }
    
    def _get_recommendations(self, level: str) -> List[str]:
        recommendations = {
            "CRITICAL": [
                "Immediate crowd diversion to alternative routes",
                "Deploy additional security personnel",
                "Activate emergency evacuation protocols",
                "Restrict entry to affected zones"
            ],
            "HIGH": [
                "Divert incoming crowds to less congested areas",
                "Increase monitoring frequency",
                "Prepare evacuation routes",
                "Coordinate with on-ground staff"
            ],
            "ELEVATED": [
                "Monitor crowd flow closely",
                "Adjust queue management",
                "Ready backup personnel"
            ],
            "OPTIMAL": [
                "Continue standard monitoring",
                "Maintain current flow rates"
            ]
        }
        return recommendations.get(level, [])


def create_crowd_analysis_engine(config: Dict) -> CrowdAnalysisEngine:
    """Factory function to create crowd analysis engine"""
    return CrowdAnalysisEngine(config)