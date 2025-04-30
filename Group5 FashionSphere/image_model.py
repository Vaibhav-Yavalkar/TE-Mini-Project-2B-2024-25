import numpy as np
import pickle as pkl
import tensorflow as tf
from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input
from tensorflow.keras.preprocessing import image
from tensorflow.keras.layers import GlobalMaxPool2D
from sklearn.neighbors import NearestNeighbors
import os
from numpy.linalg import norm
from PIL import Image
import base64
from io import BytesIO

class ImageSearchModel:
    def __init__(self):
        self.IMAGE_DIR = r"C:\Users\HP\OneDrive\Desktop\images"  # Update this path
        self.Image_features = pkl.load(open('Images_features.pkl', 'rb'))
        self.filenames = pkl.load(open('filenames.pkl', 'rb'))
        
        # Fix filenames to match local paths
        self.filenames = [os.path.join(self.IMAGE_DIR, os.path.basename(f)) for f in self.filenames]
        
        # Load Pretrained ResNet50 Model
        self.model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
        self.model.trainable = False
        self.model = tf.keras.models.Sequential([self.model, GlobalMaxPool2D()])
        
        # Initialize KNN Model
        self.neighbors = NearestNeighbors(n_neighbors=6, algorithm='brute', metric='euclidean')
        self.neighbors.fit(self.Image_features)

    def extract_features_from_image(self, img):
        img = img.convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img)
        img_expand_dim = np.expand_dims(img_array, axis=0)
        img_preprocess = preprocess_input(img_expand_dim)
        
        result = self.model.predict(img_preprocess).flatten()
        norm_result = result / norm(result)
        return norm_result

    def get_recommendations(self, uploaded_image):
        # Extract features from uploaded image
        input_img_features = self.extract_features_from_image(uploaded_image)
        
        # Find nearest neighbors
        distances, indices = self.neighbors.kneighbors([input_img_features])
        
        # Get recommended images
        recommended_images = []
        for idx in indices[0][1:6]:  # Skip the first one as it's the input image
            img_path = self.filenames[idx]
            with open(img_path, 'rb') as img_file:
                img_data = img_file.read()
                img_base64 = base64.b64encode(img_data).decode('utf-8')
                recommended_images.append(img_base64)
        
        return recommended_images