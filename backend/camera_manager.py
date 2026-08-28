import cv2
import time
import queue
import threading
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CameraManager")

class CameraFeedManager:
    def __init__(self, camera_id=0, frame_width=1280, frame_height=720, max_queue_size=5):
        self.camera_id = camera_id
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.max_queue_size = max_queue_size
        
        self.frame_queue = queue.Queue(maxsize=max_queue_size)
        self.cap = None
        self.is_running = False
        self.thread = None
        self.using_simulation = False
        self.current_cam_name = f"CAM{camera_id + 1}"

    def start(self):
        # Start capture thread.
        if self.is_running:
            return
        
        self.is_running = True
        self._init_camera()
        
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        logger.info(f"[{self.current_cam_name}] Camera feed thread started.")

    def _init_camera(self):
        # Init webcam or fallback to simulation.
        try:
            self.cap = cv2.VideoCapture(self.camera_id, cv2.CAP_DSHOW if cv2.__name__ == 'cv2' and hasattr(cv2, 'CAP_DSHOW') else cv2.CAP_ANY)
            if self.cap and self.cap.isOpened():
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.frame_width)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.frame_height)
                ret, test_frame = self.cap.read()
                if ret and test_frame is not None:
                    self.using_simulation = False
                    logger.info(f"[{self.current_cam_name}] Successfully opened OpenCV VideoCapture({self.camera_id}).")
                    return
            
            logger.warning(f"[{self.current_cam_name}] Physical webcam unreadable. Using AI Simulated CCTV Video Stream.")
            self.using_simulation = True
        except Exception as e:
            logger.warning(f"[{self.current_cam_name}] Camera init error ({e}). Using AI Simulated CCTV Stream.")
            self.using_simulation = True

    def _capture_loop(self):
        # Fetch frames into queue.
        sim_angle = 0.0
        while self.is_running:
            if not self.using_simulation and self.cap and self.cap.isOpened():
                ret, frame = self.cap.read()
                if not ret or frame is None:
                    logger.warning("Frame read failed. Switching to synthetic stream.")
                    self.using_simulation = True
                    continue
            else:
                # Generate simulation frame.
                frame = self._generate_simulated_frame(sim_angle)
                sim_angle += 0.05
                time.sleep(0.033)  # ~30 FPS

            # Maintain queue size.
            if self.frame_queue.full():
                try:
                    self.frame_queue.get_nowait()
                except queue.Empty:
                    pass
            
            self.frame_queue.put(frame)

    def _generate_simulated_frame(self, angle):
        # Generate synthetic CCTV frame.
        h, w = self.frame_height, self.frame_width
        img = np.zeros((h, w, 3), dtype=np.uint8)
        
        # Dark background
        cv2.rectangle(img, (0, 0), (w, h), (18, 16, 22), -1)
        
        # Draw corridors
        cv2.line(img, (int(w*0.15), 0), (int(w*0.25), h), (40, 50, 70), 2)
        cv2.line(img, (int(w*0.50), 0), (int(w*0.55), h), (40, 50, 70), 2)
        cv2.line(img, (int(w*0.85), 0), (int(w*0.80), h), (40, 50, 70), 2)
        
        # Draw moving people
        num_people = 14
        for i in range(num_people):
            px = int((w * 0.15) + (i * 55) + np.sin(angle + i) * 35) % (w - 100) + 50
            py = int((h * 0.20) + (i * 35) + np.cos(angle * 0.8 + i) * 25) % (h - 100) + 50
            
            # Draw person
            cv2.ellipse(img, (px, py + 25), (20, 35), 0, 0, 360, (180, 140, 60), -1)
            cv2.circle(img, (px, py), 14, (220, 180, 120), -1)
            cv2.circle(img, (px, py), 15, (255, 200, 140), 2)

        # Draw HUD
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(img, f"{self.current_cam_name} LIVE | {timestamp}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 215, 255), 2)
        
        return img

    def get_frame(self):
        # Get latest frame.
        if not self.frame_queue.empty():
            return self.frame_queue.get()
        return None

    def switch_camera(self, camera_id):
        # Switch camera.
        logger.info(f"Switching camera to CAM{camera_id + 1}")
        self.camera_id = camera_id
        self.current_cam_name = f"CAM{camera_id + 1}"
        if self.cap:
            self.cap.release()
        self._init_camera()

    def stop(self):
        # Stop capture thread.
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
        if self.cap:
            self.cap.release()
        logger.info(f"[{self.current_cam_name}] Camera feed stopped.")
