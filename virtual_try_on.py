import os
import cv2
import cvzone
import json
from cvzone.PoseModule import PoseDetector

class VirtualTryOnSystem:
    def __init__(self, gender='male'):
        self.base_path = os.path.dirname(os.path.abspath(__file__))  # Get absolute path of the script
        self.static_path = os.path.join(self.base_path, "static")  # Ensure static folder is set properly
        self.gender = gender
        self.cap = cv2.VideoCapture(0)
        self.detector = PoseDetector()
        self.shirt_configs = self._load_config()
        self.shirt_folder = os.path.join(self.static_path, self.gender)  # Ensure correct gender folder path
        self.current_shirt_index = 0
        self.current_shirt_filename = None

        # ✅ Ensure the gender folder exists, create it if necessary
        if not os.path.exists(self.shirt_folder):
            os.makedirs(self.shirt_folder)

    def set_gender(self, gender):
        """Set gender and update folder path"""
        self.gender = gender
        self.shirt_folder = os.path.join(self.static_path, self.gender)

        # ✅ Ensure the new gender folder exists
        if not os.path.exists(self.shirt_folder):
            os.makedirs(self.shirt_folder)

        self.current_shirt_index = 0
        print(f"Gender set to {gender}")

    def get_shirt_list(self):
        """Return a list of shirts in the folder"""
        if not os.path.exists(self.shirt_folder):
            print(f"Warning: {self.shirt_folder} does not exist. Returning empty list.")
            return []

        shirts = sorted(f for f in os.listdir(self.shirt_folder) if os.path.isfile(os.path.join(self.shirt_folder, f)))
        return [{'filename': f, 'index': i} for i, f in enumerate(shirts)]

    def generate_frames(self, selected_shirt_index):
        """Generate frames for virtual try-on"""
        shirts = self.get_shirt_list()
        if not shirts:
            print("No shirts found. Using default frame.")
            yield b''  # Return empty frame to avoid crashing
        
        self.current_shirt_index = selected_shirt_index
        self.current_shirt_filename = shirts[selected_shirt_index]['filename']
        
        while True:
            success, img = self.cap.read()
            if not success:
                self.cap.release()
                self.cap = cv2.VideoCapture("3.mp4")
                continue
            
            img = self._process_frame(img)
            _, buffer = cv2.imencode('.jpg', img)
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    def _process_frame(self, img):
        """Process webcam frame and overlay shirt"""
        img = self.detector.findPose(img, draw=False)
        lm_list, _ = self.detector.findPosition(img, bboxWithHands=False, draw=False)
        
        if lm_list:
            try:
                # ✅ Handle missing configurations gracefully
                shirt_config = self.shirt_configs.get(self.gender, {}).get(
                    self.current_shirt_filename,
                    next(iter(self.shirt_configs.get(self.gender, {}).values()), {})
                )

                shirt_img = self._prepare_shirt_image(lm_list, shirt_config)
                if shirt_img is not None:
                    shadow = self._create_shadow(shirt_img)
                    scale = abs(lm_list[11][0] - lm_list[12][0]) / 190
                    offset = (
                        int(shirt_config.get('offset_x', 0) * scale),
                        int(shirt_config.get('offset_y', 0) * scale)
                    )

                    img = cvzone.overlayPNG(
                        img, shadow,
                        (lm_list[12][0] - offset[0] + 5, lm_list[12][1] - offset[1] + 5))
                    img = cvzone.overlayPNG(
                        img, shirt_img,
                        (lm_list[12][0] - offset[0], lm_list[12][1] - offset[1]))
            except Exception as e:
                print(f"Error processing frame: {e}")
        
        return img

    def _prepare_shirt_image(self, lm_list, shirt_config):
        """Resize and process the shirt image"""
        shirt_path = os.path.join(self.shirt_folder, self.current_shirt_filename)
        if not os.path.exists(shirt_path):
            print(f"Shirt image not found: {shirt_path}")
            return None

        img_shirt = cv2.imread(shirt_path, cv2.IMREAD_UNCHANGED)
        if img_shirt is None:
            print(f"Failed to load shirt image: {shirt_path}")
            return None

        width = max(1, int(abs(lm_list[11][0] - lm_list[12][0]) * shirt_config.get('fixed_ratio', 1.0)))
        height = max(1, int(width * shirt_config.get('shirt_ratio_hw', 1.0)))
        img_shirt = cv2.resize(img_shirt, (width, height))

        if img_shirt.shape[2] == 4:
            b, g, r, a = cv2.split(img_shirt)
            adjusted = cv2.merge([b, g, r]) * 0.8 + 10
            img_shirt = cv2.merge([adjusted.astype('uint8'), a])

        return img_shirt

    def _create_shadow(self, img_shirt):
        """Create shadow effect for shirt overlay"""
        if img_shirt.shape[2] == 4:
            shadow = cv2.GaussianBlur(img_shirt[:, :, 3], (7, 7), 0)
            return cv2.merge([shadow] * 4) * 0.4
        return None

    def _load_config(self):
        """Load configuration JSON file"""
        config_path = os.path.join(self.base_path, "shirts_config.json")
        
        if not os.path.exists(config_path):
            print(f"Warning: Config file {config_path} not found. Returning empty config.")
            return {}

        with open(config_path, "r") as file:
            return json.load(file) 