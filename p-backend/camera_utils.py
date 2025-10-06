import cv2
import numpy as np
from pyzbar.pyzbar import decode

class CameraManager:
    def __init__(self):
        self.cap = None
        self.camera_index = 0
    
    def start_camera(self, camera_index=0):
        """Start camera capture"""
        if self.cap and self.cap.isOpened():
            self.cap.release()
        
        self.cap = cv2.VideoCapture(camera_index)
        self.camera_index = camera_index
        return self.cap.isOpened()
    
    def stop_camera(self):
        """Stop camera capture"""
        if self.cap:
            self.cap.release()
            self.cap = None
    
    def get_frame(self):
        """Get frame from camera and decode barcodes"""
        if not self.cap or not self.cap.isOpened():
            return None, []
        
        ret, frame = self.cap.read()
        if not ret:
            return None, []
        
        # Decode barcodes and QR codes
        decoded_objects = decode(frame)
        results = []
        
        for obj in decoded_objects:
            data = obj.data.decode('utf-8')
            barcode_type = obj.type
            points = obj.polygon
            
            # Convert points to serializable format
            points_list = [(p.x, p.y) for p in points]
            
            results.append({
                'type': barcode_type,
                'data': data,
                'points': points_list
            })
            
            # Draw bounding box on frame (for visualization)
            if len(points) > 4:
                hull = cv2.convexHull(np.array([point for point in points], dtype=np.float32))
                hull = list(map(tuple, np.squeeze(hull)))
            else:
                hull = points
            
            n = len(hull)
            for j in range(0, n):
                cv2.line(frame, hull[j], hull[(j+1) % n], (0, 255, 0), 3)
            
            cv2.putText(frame, f"{barcode_type}: {data}", (hull[0].x, hull[0].y - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Convert frame to JPEG
        ret, jpeg = cv2.imencode('.jpg', frame)
        if not ret:
            return None, results
        
        return jpeg.tobytes(), results

camera_manager = CameraManager()