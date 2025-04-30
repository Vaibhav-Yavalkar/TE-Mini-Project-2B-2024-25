from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from flask import Flask, render_template, request, redirect, url_for,jsonify,flash,session
from sklearn.metrics.pairwise import cosine_similarity
from popularity import predict_popularity
import pandas as pd
import numpy as np
import joblib
import itertools
import pickle
import requests
import random
import os
from flask_mysqldb import MySQL
import MySQLdb.cursors
import re


app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Change this to a strong secret key

# MySQL Configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'user_login'

mysql = MySQL(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM user_details WHERE username = %s AND password = %s', (username, password))
        account = cursor.fetchone()

        if account:
            session['loggedin'] = True
            session['id'] = account['id']
            session['username'] = account['username']
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password. Please try again.', 'error')
            return redirect(url_for('login',form='login'))

    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['first-name']
        email = request.form['email']
        password = request.form['password']
        
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM user_details WHERE username = %s', (username,))
        account = cursor.fetchone()

        # Validation logic
        if account:
            flash('Account already exists!', 'error')
        elif not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            flash('Invalid email address!', 'error')
        elif len(password) < 6:
            flash('Password must be at least 6 characters long!', 'error')
        elif not username or not password or not email:
            flash('Please fill out the form!', 'error')
        else:
            cursor.execute('INSERT INTO user_details (username, email, password) VALUES (%s, %s, %s)', (username, email, password))
            mysql.connection.commit()
            flash('Signup successful! Now login.', 'success')
            return redirect(url_for('login',form='login'))
    
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')


# API Credentials
FOURSQUARE_API_KEY = "your_key"
MAPBOX_API_KEY = "your_key"

FOURSQUARE_URL = "https://api.foursquare.com/v3/places/search"
MAPBOX_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places/"

HEADERS = {"Authorization": FOURSQUARE_API_KEY}

# List of downloaded restaurant images
restaurant_images = [
    "static/images/rest1.jpg", "static/images/rest2.jpg", "static/images/rest3.jpg",
    "static/images/rest4.jpg", "static/images/rest5.jpg", "static/images/rest6.jpg",
    "static/images/rest7.jpg", "static/images/rest8.jpg", "static/images/rest9.jpg",
    "static/images/rest10.jpg","static/images/rest11.jpg","static/images/rest12.jpg",
    "static/images/rest13.jpg","static/images/rest14.jpg","static/images/rest15.jpg"
]

# Function to fetch unique random images
# Function to fetch random images (repeats if needed)
# Function to fetch unique random images without repetition
def get_random_images(count):
    if count > len(restaurant_images):
        # Shuffle and repeat images if more than available
        full_sets = count // len(restaurant_images)
        remainder = count % len(restaurant_images)
        images = []

        for _ in range(full_sets):
            images += random.sample(restaurant_images, len(restaurant_images))
        images += random.sample(restaurant_images, remainder)
        return images
    else:
        return random.sample(restaurant_images, count)

# Function to fetch latitude & longitude using Mapbox
def get_lat_long(city_name):
    response = requests.get(f"{MAPBOX_URL}{city_name}.json?access_token={MAPBOX_API_KEY}")
    if response.status_code == 200:
        data = response.json()
        if "features" in data and len(data["features"]) > 0:
            lon, lat = data["features"][0]["center"]
            return f"{lat},{lon}"
    return None

# Function to fetch real-time restaurant details from Foursquare
def get_real_time_restaurants(location, food_type, limit=5):
    params = {"query": food_type, "ll": location, "limit": limit, "sort": "DISTANCE"}
    response = requests.get(FOURSQUARE_URL, headers=HEADERS, params=params)
    
    if response.status_code == 200:
        data = response.json()
        restaurants = []
        random_images = get_random_images(len(data.get("results", [])))  # Get unique images

        for i, venue in enumerate(data.get("results", [])):
            name = venue.get("name", "Unknown")

            # Fallback: check if address exists and is not blank
            address_data = venue.get("location", {}).get("formatted_address")
            address = address_data if address_data and address_data.strip() else "Address not available"

            image_url = random_images[i] if i < len(random_images) else "static/images/default.jpg"

            restaurants.append({
                "name": name,
                "address": address,
                "image": image_url
            })

        return restaurants
    else:
        return []


# Load dataset
df = pd.read_csv('swiggy.csv')

# Convert food type into numerical form using TF-IDF
tfidf_vectorizer = TfidfVectorizer()
food_type_matrix = tfidf_vectorizer.fit_transform(df['Food type'].fillna(''))

# Scale numerical features
scaler = StandardScaler()
scaled_features = scaler.fit_transform(df[['Price', 'Avg ratings']])

# Concatenate both features (Numerical + Text-based)
combined_features = np.hstack((scaled_features, food_type_matrix.toarray()))

# Compute cosine similarity
cosine_sim = cosine_similarity(combined_features)

# Save models
pickle.dump(cosine_sim, open('cosine_similarity_model.pkl', 'wb'))
pickle.dump(scaler, open('scaler.pkl', 'wb'))
pickle.dump(tfidf_vectorizer, open('tfidf_vectorizer.pkl', 'wb'))

def get_top_recommendations(restaurant_name, food_type, area=None, city=None, top_n=5):
    if restaurant_name not in df['Restaurant'].values:
        return []  # Return empty list if restaurant not found
    
    # Find index of input restaurant
    index = df[df['Restaurant'] == restaurant_name].index[0]
    similar_scores = list(enumerate(cosine_sim[index]))  # Get similarity scores
    sorted_scores = sorted(similar_scores, key=lambda x: x[1], reverse=True)  # Sort scores
    top_indices = [i[0] for i in sorted_scores[1:]]  # Get sorted indices

    # Filter dataset based on Area or City
    filtered_df = df.copy()
    if area and area in df['Area'].values:
        filtered_df = filtered_df[filtered_df['Area'] == area]
    elif city and city in df['City'].values:
        filtered_df = filtered_df[filtered_df['City'] == city]
    else:
        # Dynamically select the most common area if the input area/city is not found
        closest_area = df['Area'].value_counts().idxmax()  # Pick most frequent area
        filtered_df = filtered_df[filtered_df['Area'] == closest_area]

    recommendations = []
    random_images = get_random_images(len(top_indices))  # Assign images

    for i, idx in enumerate(top_indices):
        restaurant = df.iloc[idx]

        # Ensure the restaurant is in the filtered dataset and matches food type
        if (restaurant["Restaurant"] in filtered_df["Restaurant"].values and
            food_type.lower() in restaurant["Food type"].lower()):
            recommendations.append({
                "name": restaurant["Restaurant"],
                "address": restaurant["Address"],
                "area": restaurant["Area"],
                "city": restaurant["City"],
                "image": random_images[i] if i < len(random_images) else "static/images/rest14.jpg"
            })

        if len(recommendations) == top_n:
            break

    return recommendations

@app.route("/recommend", methods=["GET", "POST"])
def recommend():
    if request.method == "POST":
        food_type = request.form['food_type']
        price = float(request.form['price'])
        avg_ratings = float(request.form['avg_ratings'])
        location_input = request.form['location']

        # Get latitude & longitude from Mapbox
        if not location_input.replace(',', '').replace('.', '').isdigit():
            location = get_lat_long(location_input)
        else:
            location = location_input

        if location is None:
            return render_template("recommend.html", error="Invalid location. Try again.")

        # Extract Area/City from user input (if possible)
        user_area, user_city = None, None
        if location_input in df['Area'].values:
            user_area = location_input
        elif location_input in df['City'].values:
            user_city = location_input

        # Prepare user input for scaling
        user_input = pd.DataFrame({'Price': [price], 'Avg ratings': [avg_ratings]})
        scaled_user_input = scaler.transform(user_input[['Price', 'Avg ratings']])

        # Find best-matching restaurant in dataset
        cosine_similarities = cosine_similarity(scaled_user_input, df[['Price', 'Avg ratings']])
        best_match_index = cosine_similarities.argmax()  # Find most similar restaurant index
        best_match_restaurant = df.iloc[best_match_index]['Restaurant']

        # Get top content-based recommendations with Area/City filtering
        content_based_recommendations = get_top_recommendations(best_match_restaurant, food_type, area=user_area, city=user_city)

        # Fetch real-time restaurants using the API
        real_time_restaurants = get_real_time_restaurants(location, food_type)

        # Combine both recommendation lists
        combined_recommendations = real_time_restaurants + content_based_recommendations

        return render_template("recommend.html", recommendations=combined_recommendations)

    return render_template("recommend.html", recommendations=None)



##########  Popularity ###########

@app.route("/popularity", methods=["GET", "POST"])
def popularity():
    if request.method == "POST":
        try:
            # ✅ Get user input
            area = request.form["area"]
            city = request.form["city"]
            food_type = request.form.get("food_type")  # Optional

            # ✅ Call function from popularity.py
            top_restaurants = predict_popularity(area, city, food_type)

            # ✅ Handle case where no results are found
            if isinstance(top_restaurants, str):  # If function returns a string (error message)
                return render_template("popularity.html", error=top_restaurants, top_restaurants=None)

            return render_template("popularity.html", top_restaurants=top_restaurants)

        except Exception as e:
            return render_template("popularity.html", error=str(e), top_restaurants=None)

    return render_template("popularity.html", top_restaurants=None, error=None)




############## Analysis ###############
import sent


# # Sentiment Analysis Route
# Sentiment Analysis Route
@app.route('/analysis', methods=['GET', 'POST'])
def analysis():
    year = None
    pie_chart_path = None
    line_chart_path = None
    yearly_counts = None
    yearly_bar_chart_path = None
    
    if request.method == 'POST':
        # Get the selected year from the form
        selected_year = request.form.get("year")
        
        if selected_year:
            year, pie_chart_path, line_chart_path = sent.perform_sentiment_analysis(selected_year)
        
        # Perform yearly analysis (always runs)
        yearly_counts, yearly_bar_chart_path = sent.perform_yearly_analysis()
    
    return render_template(
        'analysis.html',
        year=year, 
        pie_chart_path=pie_chart_path, 
        line_chart_path=line_chart_path,
        yearly_counts=yearly_counts,
        yearly_bar_chart_path=yearly_bar_chart_path
    )

# Dynamic Route Planner Route
@app.route('/dynamic_route')
def dynamic_route():
    return render_template('dynamic_route.html')

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    if 'loggedin' in session:
        user_id = session['id']
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT username, password, email, phone, location FROM user_details WHERE id=%s", (user_id,))
        account = cursor.fetchone()
        
        if request.method == 'POST':
            # Update profile details in the database
            username = request.form['username']
            password = request.form['password']
            email = request.form['email']
            phone = request.form['phone']
            location = request.form['location']
            
            cursor.execute("""
                UPDATE user_details 
                SET username=%s, password=%s, email=%s, phone=%s, location=%s 
                WHERE id=%s
            """, (username, password, email, phone, location, user_id))
            mysql.connection.commit()
            flash('Profile saved successfully', 'success')
            return redirect(url_for('profile'))
        
        return render_template('profile.html', account=account)
    return redirect(url_for('login'))

@app.route('/help_us')
def help_us():
    return render_template('help_us.html')

@app.route('/logout')
def logout():
    # Here we would normally clear the session or any user-specific data
    return redirect(url_for('index'))

if __name__ == "__main__":
    app.run(debug=True)