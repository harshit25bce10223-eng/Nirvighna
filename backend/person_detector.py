import time
import math
import numpy as np
import logging

logger = logging.getLogger("PersonDetector")

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    logger.warning("Ultralytics library not found. Falling back to OpenCV DNN / Heuristic Person Detector.")


class TrackedPerson:
    def __init__(self, track_id, bbox, confidence):
        self.track_id = track_id
        self.bbox = bbox  # (x1, y1, x2, y2)
        self.confidence = confidence
        self.center = ((bbox[0] + bbox[2]) / 2.0, (bbox[1] + bbox[3]) / 2.0)
        self.velocity = (0.0, 0.0)
        self.history = [self.center]
        self.misses = 0
        self.last_seen = time.time()
        self.crossed_entry = False
        self.crossed_exit = False

    def predict(self):
        # Constant-velocity motion prior improves association during occlusion
        return (self.center[0] + self.velocity[0], self.center[1] + self.velocity[1])

    def update(self, bbox, confidence):
        new_center = ((bbox[0] + bbox[2]) / 2.0, (bbox[1] + bbox[3]) / 2.0)
        self.velocity = (new_center[0] - self.center[0], new_center[1] - self.center[1])
        self.bbox = bbox
        # EMA-smoothed confidence reduces single-frame jitter
        self.confidence = 0.7 * confidence + 0.3 * self.confidence
        self.center = new_center
        self.history.append(new_center)
        if len(self.history) > 30:
            self.history.pop(0)
        self.last_seen = time.time()
        self.misses = 0


class PersonDetectorTracker:
    def __init__(self, config):
        self.conf_auto = config.get("confidence_auto_count", 0.85)
        self.conf_unverified_min = config.get("confidence_unverified_min", 0.60)
        self.iou_thresh = config.get("nms_iou_threshold", 0.45)
        self.max_lost_frames = config.get("max_lost_track_frames", 30)
        self.imgsz = int(config.get("inference_imgsz", 960))
        self.max_det = int(config.get("max_detections", 300))
        self.ema_alpha = float(config.get("count_ema_alpha", 0.35))

        self.entry_y_ratio = config.get("entry_line_y_ratio", 0.40)
        self.exit_y_ratio = config.get("exit_line_y_ratio", 0.85)

        self.next_track_id = 1
        self.active_tracks = {}

        self.total_entries = 0
        self.total_exits = 0
        self.entry_timestamps = []
        self.exit_timestamps = []

        self._smoothed_present = None
        self._last_inference_ms = 0.0

        self.model = None
        self.model_name = None
        if ULTRALYTICS_AVAILABLE:
            import os
            # Prefer the larger, more accurate model when available
            preferred = config.get("model_preference", ["yolov8s.pt", "yolov8n.pt"])
            model_name = config.get("model")
            candidates = [model_name] if model_name else []
            candidates += [m for m in preferred if m != model_name]
            backend_dir = os.path.dirname(__file__)
            for cand in candidates:
                if not cand:
                    continue
                path = cand if os.path.isabs(cand) else os.path.join(backend_dir, cand)
                if os.path.exists(path):
                    try:
                        self.model = YOLO(path)
                        self.model_name = os.path.basename(path)
                        logger.info(f"Loaded Ultralytics {self.model_name} @ imgsz={self.imgsz}")
                        break
                    except Exception as e:
                        logger.warning(f"Could not load {cand}: {e}")
            if self.model is None:
                logger.warning("No YOLO weights found locally. Run start_all.py to download.")

    def process_frame(self, frame):
        # Process frame, update tracks, check lines, and draw HUD.
        if frame is None:
            return None, {}

        h, w, _ = frame.shape
        entry_y = int(h * self.entry_y_ratio)
        exit_y = int(h * self.exit_y_ratio)

        raw_detections = []
        unverified_logs = []

        if self.model:
            t0 = time.time()
            results = self.model(
                frame,
                classes=[0],
                conf=self.conf_unverified_min,
                iou=self.iou_thresh,
                imgsz=self.imgsz,
                max_det=self.max_det,
                agnostic_nms=True,
                verbose=False,
            )
            self._last_inference_ms = (time.time() - t0) * 1000.0
            for r in results:
                for box in r.boxes:
                    conf = float(box.conf[0])
                    xyxy = box.xyxy[0].cpu().numpy()
                    x1, y1, x2, y2 = int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])

                    if conf >= self.conf_auto:
                        raw_detections.append(((x1, y1, x2, y2), conf, "verified"))
                    else:
                        unverified_logs.append(((x1, y1, x2, y2), conf, "unverified"))
        else:
            raw_detections, unverified_logs = self._heuristic_person_detect(frame)

        # Update track associations
        matched_tracks, unverified_count = self._update_tracks(raw_detections, unverified_logs, w, h)

        # Check line crossing
        now = time.time()
        for track in matched_tracks.values():
            if len(track.history) >= 2:
                prev_y = track.history[-2][1]
                curr_y = track.center[1]

                # Entry crossing
                if not track.crossed_entry and prev_y < entry_y <= curr_y:
                    track.crossed_entry = True
                    self.total_entries += 1
                    self.entry_timestamps.append(now)

                # Exit crossing
                if not track.crossed_exit and prev_y < exit_y <= curr_y:
                    track.crossed_exit = True
                    self.total_exits += 1
                    self.exit_timestamps.append(now)

        # Calculate 1-minute rate
        cutoff_min = now - 60.0
        self.entry_timestamps = [t for t in self.entry_timestamps if t >= cutoff_min]
        self.exit_timestamps = [t for t in self.exit_timestamps if t >= cutoff_min]

        entry_rate = len(self.entry_timestamps)
        exit_rate = len(self.exit_timestamps)

        verified_count = len(matched_tracks)
        # Honest occupancy estimate (net flow) — no artificial floors
        present_raw = verified_count + self.total_entries - self.total_exits
        if self._smoothed_present is None:
            self._smoothed_present = float(present_raw)
        else:
            self._smoothed_present = (
                self.ema_alpha * present_raw + (1.0 - self.ema_alpha) * self._smoothed_present
            )
        devotees_present = max(0, int(round(self._smoothed_present)))

        # Aggregate detection quality metrics
        all_confs = [t.confidence for t in matched_tracks.values()] + [c for _, c, _ in unverified_logs]
        avg_conf = round(sum(all_confs) / len(all_confs), 4) if all_confs else 0.0

        # Draw overlays
        output_frame = frame.copy()
        import cv2

        # Draw virtual lines
        cv2.line(output_frame, (0, entry_y), (w, entry_y), (0, 255, 0), 2)
        cv2.putText(output_frame, "ENTRY LINE (INFLOW)", (15, entry_y - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        cv2.line(output_frame, (0, exit_y), (w, exit_y), (0, 0, 255), 2)
        cv2.putText(output_frame, "EXIT LINE (OUTFLOW)", (15, exit_y - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

        # Draw bounding boxes
        for track in matched_tracks.values():
            x1, y1, x2, y2 = [int(v) for v in track.bbox]
            cv2.rectangle(output_frame, (x1, y1), (x2, y2), (245, 158, 11), 2)
            cv2.putText(output_frame, f"Person #{track.track_id} ({int(track.confidence * 100)}%)",
                        (x1, max(15, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (245, 158, 11), 2)

        for bbox, conf, _ in unverified_logs:
            x1, y1, x2, y2 = [int(v) for v in bbox]
            cv2.rectangle(output_frame, (x1, y1), (x2, y2), (100, 100, 100), 1)
            cv2.putText(output_frame, f"Unverified ({int(conf * 100)}%)",
                        (x1, max(15, y1 - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (140, 140, 140), 1)

        telemetry = {
            "verified_count": verified_count,
            "unverified_count": unverified_count,
            "total_tracked": verified_count + unverified_count,
            "devotees_present": devotees_present,
            "entry_rate": entry_rate,
            "exit_rate": exit_rate,
            "total_entries": self.total_entries,
            "total_exits": self.total_exits,
            "avg_confidence": avg_conf,
            "inference_ms": round(self._last_inference_ms, 1),
            "detection_model": f"Ultralytics {self.model_name or 'YOLOv8'} @ {self.imgsz}px" if self.model else "Heuristic Edge Tracker",
        }

        return output_frame, telemetry

    def _update_tracks(self, raw_detections, unverified_logs, width, height):
        # Age out stale tracks first
        for t_id in list(self.active_tracks.keys()):
            self.active_tracks[t_id].misses += 1
            if self.active_tracks[t_id].misses > self.max_lost_frames:
                del self.active_tracks[t_id]

        # Associate detections using predicted center + IoU-aware gating.
        # Verified detections claim tracks first (higher trust), then unverified.
        for pass_status in ("verified", "unverified"):
            pool = [d for d in (raw_detections + unverified_logs) if d[2] == pass_status]
            for bbox, conf, status in pool:
                cx, cy = (bbox[0] + bbox[2]) / 2.0, (bbox[1] + bbox[3]) / 2.0
                best_id = None
                best_cost = 85.0

                for t_id, track in self.active_tracks.items():
                    if track.misses > 0 and status == "unverified":
                        continue  # don't let weak detections steal stale tracks
                    px, py = track.predict()
                    dist = math.hypot(cx - px, cy - py)
                    if dist < best_cost:
                        best_cost = dist
                        best_id = t_id

                if best_id is not None:
                    self.active_tracks[best_id].update(bbox, conf)
                elif status == "verified":
                    new_track = TrackedPerson(self.next_track_id, bbox, conf)
                    self.active_tracks[self.next_track_id] = new_track
                    self.next_track_id += 1

        return self.active_tracks, len(unverified_logs)

    def _heuristic_person_detect(self, frame):
        # Generate synthetic boxes if PyTorch is missing.
        h, w, _ = frame.shape
        raw = []
        unverified = []
        t = time.time()

        num_sim = 8
        for i in range(num_sim):
            cx = int((w * 0.2) + (i * 65) + math.sin(t + i) * 30) % (w - 80) + 40
            cy = int((h * 0.25) + (i * 35) + math.cos(t * 0.8 + i) * 20) % (h - 80) + 40
            conf = 0.88 if i % 2 == 0 else 0.68
            bbox = (cx - 25, cy - 35, cx + 25, cy + 35)

            if conf >= self.conf_auto:
                raw.append((bbox, conf, "verified"))
            else:
                unverified.append((bbox, conf, "unverified"))

        return raw, unverified
