import cv2
import numpy as np
from pyzbar.pyzbar import decode
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import base64
import time

class CameraManager:
    def __init__(self):
        self.cap = None
        self.camera_index = 0
        self.last_scan_time = 0
        self.scan_cooldown = 5  # 2 seconds cooldown
    
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
    
    def can_scan(self):
        """Check if enough time has passed since last scan"""
        current_time = time.time()
        return current_time - self.last_scan_time >= self.scan_cooldown
    
    def get_frame(self):
        """Get frame from camera and decode barcodes"""
        if not self.cap or not self.cap.isOpened():
            return None, []
        
        ret, frame = self.cap.read()
        if not ret:
            return None, []
        
        # Check if we can scan (cooldown period)
        can_scan_now = self.can_scan()
        results = []
        
        # Only decode barcodes if cooldown period has passed
        if can_scan_now:
            decoded_objects = decode(frame)
            
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
                
                # Update last scan time when we find a barcode
                if results:
                    self.last_scan_time = time.time()
        
        # Always draw bounding boxes for visualization, even during cooldown
        if can_scan_now:
            decoded_objects_for_drawing = decode(frame)
        else:
            # During cooldown, still detect but don't return results
            decoded_objects_for_drawing = decode(frame)
        
        for obj in decoded_objects_for_drawing:
            points = obj.polygon
            
            # Draw bounding box on frame (for visualization)
            if len(points) > 4:
                hull = cv2.convexHull(np.array([point for point in points], dtype=np.float32))
                hull = list(map(tuple, np.squeeze(hull)))
            else:
                hull = points
            
            n = len(hull)
            for j in range(0, n):
                cv2.line(frame, hull[j], hull[(j+1) % n], (0, 255, 0), 3)
            
            cv2.putText(frame, f"{obj.type}: {obj.data.decode('utf-8')}", (hull[0].x, hull[0].y - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Add cooldown status text to frame
        if not can_scan_now:
            time_left = self.scan_cooldown - (time.time() - self.last_scan_time)
            cv2.putText(frame, f"Cooldown: {time_left:.1f}s", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        # Convert frame to JPEG
        ret, jpeg = cv2.imencode('.jpg', frame)
        if not ret:
            return None, results
        
        return jpeg.tobytes(), results

camera_manager = CameraManager()

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"message": "Barcode Scanner API"})

@app.route('/api/camera/start', methods=['POST'])
def start_camera():
    try:
        data = request.get_json()
        camera_index = data.get('camera_index', 0)
        
        success = camera_manager.start_camera(camera_index)
        return jsonify({"success": success, "message": "Camera started" if success else "Failed to start camera"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/camera/stop', methods=['POST'])
def stop_camera():
    try:
        camera_manager.stop_camera()
        return jsonify({"success": True, "message": "Camera stopped"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/camera/scan')
def scan_frame():
    try:
        frame_data, results = camera_manager.get_frame()
        
        if frame_data is None:
            return jsonify({"success": False, "error": "Camera not available"})
        
        # Convert frame to base64 for frontend
        frame_base64 = base64.b64encode(frame_data).decode('utf-8')
        
        # Check cooldown status
        can_scan = camera_manager.can_scan()
        time_until_next_scan = 0
        if not can_scan:
            time_until_next_scan = camera_manager.scan_cooldown - (time.time() - camera_manager.last_scan_time)
        
        return jsonify({
            "success": True,
            "frame": f"data:image/jpeg;base64,{frame_base64}",
            "results": results,
            "count": len(results),
            "can_scan": can_scan,
            "time_until_next_scan": max(0, time_until_next_scan)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/camera/cooldown-status')
def get_cooldown_status():
    """Get current cooldown status"""
    try:
        can_scan = camera_manager.can_scan()
        time_until_next_scan = 0
        if not can_scan:
            time_until_next_scan = camera_manager.scan_cooldown - (time.time() - camera_manager.last_scan_time)
        
        return jsonify({
            "can_scan": can_scan,
            "time_until_next_scan": max(0, time_until_next_scan),
            "cooldown_duration": camera_manager.scan_cooldown
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/cameras')
def get_cameras():
    """Get list of available cameras"""
    cameras = []
    for i in range(5):  # Check first 5 camera indices
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            cameras.append({
                "index": i,
                "name": f"Camera {i}",
                "resolution": f"{int(cap.get(3))}x{int(cap.get(4))}"
            })
            cap.release()
    
    return jsonify({"cameras": cameras})

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')