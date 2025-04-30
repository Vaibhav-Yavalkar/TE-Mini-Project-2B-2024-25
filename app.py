from flask import Flask, render_template, request, jsonify, Response, redirect, url_for, flash, session
from model import load_model, recommend
from image_model import ImageSearchModel
import os
from PIL import Image
import base64
from io import BytesIO
import subprocess
import threading
import time
import requests
from virtual_try_on import VirtualTryOnSystem
import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
from werkzeug.utils import secure_filename
import mysql.connector
import hashlib
import secrets
from functools import wraps

app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')

# Set a fixed secret key
app.secret_key = 'fashionsphere-secret-key-2024'

# Configure upload folder
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load the models
fashion_df, similarity = load_model()
image_model = ImageSearchModel()
virtual_try_on = VirtualTryOnSystem()

# Body Size Measurement Models
class BodyMeasurementModel(nn.Module):
    def __init__(self):
        super(BodyMeasurementModel, self).__init__()
        weights = models.ResNet50_Weights.DEFAULT
        self.cnn = models.resnet50(weights=weights)
        num_features = self.cnn.fc.in_features
        self.cnn.fc = nn.Identity()
        
        self.height_regressor = nn.Linear(num_features * 2, 1)
        self.shoulder_regressor = nn.Linear(num_features * 2, 1)
        self.chest_regressor = nn.Linear(num_features * 2, 1)
        self.waist_regressor = nn.Linear(num_features * 2, 1)
        self.hip_regressor = nn.Linear(num_features * 2, 1)
        
        self.transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225]),
        ])
    
    def forward(self, front_img, side_img):
        front_features = self.cnn(front_img)
        side_features = self.cnn(side_img)
        combined_features = torch.cat([front_features, side_features], dim=1)
        
        return {
            'height': self.height_regressor(combined_features),
            'shoulder': self.shoulder_regressor(combined_features),
            'chest': self.chest_regressor(combined_features),
            'waist': self.waist_regressor(combined_features),
            'hip': self.hip_regressor(combined_features)
        }

class SizeClassifier(nn.Module):
    def __init__(self, input_dim=5):
        super(SizeClassifier, self).__init__()
        self.fc = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 5)  # 5 classes: S, M, L, XL, XXL
        )
    
    def forward(self, x):
        return self.fc(x)

# Load Body Size Models
try:
    measurement_model = BodyMeasurementModel()
    measurement_model.load_state_dict(torch.load('data/trained_models/measurement_model.pth', map_location=torch.device('cpu')))
    measurement_model.eval()
except FileNotFoundError:
    print("Warning: Measurement model not found. Using untrained model.")
    measurement_model = BodyMeasurementModel()

try:
    size_classifier = SizeClassifier()
    size_classifier.load_state_dict(torch.load('data/trained_models/size_classifier.pth', map_location=torch.device('cpu')))
    size_classifier.eval()
except FileNotFoundError:
    print("Warning: Size classifier not found. Using untrained model.")
    size_classifier = SizeClassifier()

# Global variable to store Streamlit process
streamlit_process = None

def is_streamlit_running():
    try:
        response = requests.get('http://localhost:8501')
        return response.status_code == 200
    except:
        return False

def start_streamlit():
    global streamlit_process
    if not is_streamlit_running():
        try:
            streamlit_process = subprocess.Popen(
                ['streamlit', 'run', 'chatbot.py', '--server.port=8501', '--server.headless=true'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            # Wait for the server to start
            time.sleep(3)
        except Exception as e:
            print(f"Error starting Streamlit: {e}")
            return False
    return True

# Database configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '1927__sid',
    'database': 'users'
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

def get_db_connection():
    return mysql.connector.connect(**db_config)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    print(f"Index route accessed. Session: {session}")  # Debug print
    if 'user_id' not in session:
        print("No user_id in session, redirecting to login")  # Debug print
        return redirect(url_for('login'))
    
    try:
        # Get list of fashion items for the search bar
        fashion_items = fashion_df['title'].tolist()
        return render_template('index.html', fashion_items=fashion_items)
    except Exception as e:
        print(f"Error in index route: {e}")  # Debug print
        return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    # Clear any existing session
    session.clear()
    
    if request.method == 'POST':
        try:
            email = request.form['email']
            password = request.form['password']
            
            print(f"Login attempt for email: {email}")  # Debug print
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Hash the password before comparing
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            print(f"Hashed password: {hashed_password}")  # Debug print
            
            # First, let's check if the user exists
            cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
            user = cursor.fetchone()
            print(f"User found by email: {user}")  # Debug print
            
            if user:
                # Now check if password matches
                if user['password'] == hashed_password:
                    session['user_id'] = user['id']
                    session['user_name'] = user['full_name']
                    print(f"Session created: {session}")  # Debug print
                    cursor.close()
                    conn.close()
                    return redirect(url_for('index'))
                else:
                    print(f"Password mismatch. DB password: {user['password']}, Input password hash: {hashed_password}")
                    flash('Invalid password')
            else:
                print("No user found with this email")
                flash('Invalid email')
            
            cursor.close()
            conn.close()
            
        except mysql.connector.Error as err:
            print(f"Database error: {err}")
            flash('Database error occurred')
        except Exception as e:
            print(f"Unexpected error: {e}")
            flash('An unexpected error occurred')
    
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        try:
            full_name = request.form['full_name']
            email = request.form['email']
            phone = request.form['phone']
            address = request.form['address']
            password = request.form['password']
            
            print(f"Signup attempt for email: {email}")  # Debug print
            
            # Handle photo upload
            photo_data = request.form.get('photo')
            photo_filename = None
            
            if photo_data:
                # Convert base64 to image and save
                try:
                    # Remove the data URL prefix
                    photo_data = photo_data.split(',')[1]
                    # Decode base64 to bytes
                    photo_bytes = base64.b64decode(photo_data)
                    
                    # Generate filename
                    photo_filename = f"{email}_{int(time.time())}.jpg"
                    photo_path = os.path.join(app.config['UPLOAD_FOLDER'], photo_filename)
                    
                    # Save the image
                    with open(photo_path, 'wb') as f:
                        f.write(photo_bytes)
                    
                    print(f"Photo saved as: {photo_filename}")  # Debug print
                except Exception as e:
                    print(f"Error saving photo: {e}")  # Debug print
            
            # Hash the password
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            print(f"Hashed password: {hashed_password}")  # Debug print
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            try:
                # First check if email already exists
                cursor.execute('SELECT email FROM users WHERE email = %s', (email,))
                if cursor.fetchone():
                    print(f"Email {email} already exists")  # Debug print
                    flash('Email already registered')
                    return redirect(url_for('signup'))
                
                # Insert new user
                cursor.execute('''
                    INSERT INTO users (full_name, email, phone, address, password, photo)
                    VALUES (%s, %s, %s, %s, %s, %s)
                ''', (full_name, email, phone, address, hashed_password, photo_filename))
                conn.commit()
                print("User inserted successfully")  # Debug print
                flash('Account created successfully! Please login.')
                return redirect(url_for('login'))
                
            except mysql.connector.Error as err:
                print(f"Database error during signup: {err}")  # Debug print
                flash(f'Error creating account: {err}')
            finally:
                cursor.close()
                conn.close()
                
        except Exception as e:
            print(f"Unexpected error during signup: {e}")  # Debug print
            flash('An unexpected error occurred')
    
    return render_template('signup.html')

@app.route('/logout')
def logout():
    print("Logging out user:", session.get('user_name'))  # Debug print
    session.clear()
    session.pop('user_id', None)
    session.pop('user_name', None)
    print("Session after logout:", session)  # Debug print
    return redirect(url_for('login'))

@app.route('/search', methods=['POST'])
@login_required
def search():
    search_query = request.form.get('query')
    if search_query:
        recommended_fashion, recommended_images = recommend(search_query, fashion_df, similarity)
        return render_template('recommend.html', 
                             recommendations=zip(recommended_fashion, recommended_images),
                             search_query=search_query)
    return render_template('index.html')

@app.route('/image_search')
@login_required
def image_search():
    return render_template('image_search.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        try:
            # Read and process the image
            img = Image.open(file)
            # Get recommendations
            recommended_images = image_model.get_recommendations(img)
            return jsonify({'recommendations': recommended_images})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/get_fashion_items')
def get_fashion_items():
    return jsonify(fashion_df['title'].tolist())

@app.route('/start_chatbot')
def start_chatbot():
    if start_streamlit():
        return jsonify({'status': 'success', 'url': 'http://localhost:8501'})
    return jsonify({'status': 'error', 'message': 'Failed to start chatbot'})

@app.route('/virtual_try_on')
@login_required
def virtual_try_on_page():
    return render_template('virtual_try_on.html')

@app.route('/video_feed/<int:selected_shirt_index>')
def video_feed(selected_shirt_index):
    return Response(virtual_try_on.generate_frames(selected_shirt_index),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/get_shirts/<gender>')
def get_shirts(gender):
    virtual_try_on.set_gender(gender)
    shirts = virtual_try_on.get_shirt_list()
    return jsonify(shirts)

@app.route('/body_size', methods=['GET', 'POST'])
@login_required
def body_size():
    if request.method == 'POST':
        try:
            # Get form data
            height = float(request.form['height'])
            
            # Get uploaded files
            front_img = request.files['front_image']
            side_img = request.files['side_image']
            
            # Validate files
            if not front_img or not side_img:
                raise ValueError("Please upload both front and side images")
            
            # Save images
            front_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(front_img.filename))
            side_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(side_img.filename))
            front_img.save(front_path)
            side_img.save(side_path)
            
            # Process images
            measurements = predict_measurements(front_path, side_path)
            size = predict_size(measurements, height)
            
            return render_template('body_size_results.html', 
                                measurements=measurements,
                                size=size)
            
        except Exception as e:
            return render_template('body_size.html', error=str(e))
    
    return render_template('body_size.html')

def predict_measurements(front_path, side_path):
    front_img = Image.open(front_path).convert('RGB')
    side_img = Image.open(side_path).convert('RGB')
    
    transform = measurement_model.transform
    front_tensor = transform(front_img).unsqueeze(0)
    side_tensor = transform(side_img).unsqueeze(0)
    
    with torch.no_grad():
        outputs = measurement_model(front_tensor, side_tensor)
    
    # Convert to cm and round to 1 decimal place
    measurements = {k: round(v.item(), 1) for k, v in outputs.items()}
    return measurements

def predict_size(measurements, height):
    features = torch.tensor([
        measurements['shoulder'],
        measurements['chest'],
        measurements['waist'],
        measurements['hip'],
        height
    ]).unsqueeze(0).float()
    
    with torch.no_grad():
        output = size_classifier(features)
        predicted = torch.argmax(output, dim=1).item()
    
    sizes = ['S', 'M', 'L', 'XL', 'XXL']
    return sizes[predicted]

@app.route('/test_db')
def test_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if users table exists
        cursor.execute("SHOW TABLES LIKE 'users'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            # Get table structure
            cursor.execute("DESCRIBE users")
            columns = cursor.fetchall()
            
            # Get all users
            cursor.execute("SELECT * FROM users")
            users = cursor.fetchall()
            
            return f"""
            Database connection successful!
            Users table exists.
            Table structure: {columns}
            Number of users: {len(users)}
            Users: {users}
            """
        else:
            return "Users table does not exist!"
            
    except mysql.connector.Error as err:
        return f"Database error: {err}"
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    app.run(debug=True)