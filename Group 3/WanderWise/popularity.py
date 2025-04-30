import joblib
import pandas as pd
import numpy as np

# ✅ Load trained model
model = joblib.load("new_popularity_model.pkl")

# ✅ Load encoders & scaler
label_encoder_area = joblib.load("label_encoder_area.pkl")
label_encoder_city = joblib.load("label_encoder_city.pkl")
label_encoder_food = joblib.load("label_encoder_food.pkl")
scaler = joblib.load("minmax_scaler.pkl")

# ✅ Load dataset (Used to fetch restaurant names and features)
df = pd.read_csv("swiggy_dataset.csv")  # Replace with actual dataset

# ✅ Feature Order (Must match model training)
FEATURE_ORDER = ['Area', 'City', 'Price', 'Avg_ratings', 'Total_ratings', 'Food_type', 'Delivery_time']

def encode_categorical_value(label_encoder, value):
    """Encodes categorical values and handles unseen values dynamically."""
    if value in label_encoder.classes_:
        return label_encoder.transform([value])[0]
    else:
        # Handle unseen categories dynamically
        new_classes = np.append(label_encoder.classes_, value)
        label_encoder.classes_ = new_classes
        return label_encoder.transform([value])[0]

def predict_popularity(area, city, food_type):
    # Filter dataset
    filtered_restaurants = df[(df["Area"] == area) & (df["City"] == city)]
    if food_type:
        filtered_restaurants = filtered_restaurants[
            filtered_restaurants["Food_type"].str.contains(food_type, case=False, na=False)
        ]

    if filtered_restaurants.empty:
        return "No restaurants found for the given area and city."

    restaurant_scores = []
    all_predictions = []

    # Predict popularity for each restaurant
    for _, row in filtered_restaurants.iterrows():
        # Encode categorical values
        area_encoded = encode_categorical_value(label_encoder_area, row["Area"])
        city_encoded = encode_categorical_value(label_encoder_city, row["City"])
        food_encoded = encode_categorical_value(label_encoder_food, row["Food_type"])

        # Prepare input data
        input_data = pd.DataFrame([[area_encoded, city_encoded, row["Price"], row["Avg_ratings"],
                                    row["Total_ratings"], food_encoded, row["Delivery_time"]]], 
                                  columns=FEATURE_ORDER)

        # Predict popularity score
        raw_prediction = model.predict(input_data)[0]
        all_predictions.append(raw_prediction)  # Store all predictions for scaling

    # Compute min and max predictions
    min_pred, max_pred = min(all_predictions), max(all_predictions)

    # Normalize and scale scores dynamically
    for i, (_, row) in enumerate(filtered_restaurants.iterrows()):
        raw_prediction = all_predictions[i]

        if min_pred != max_pred:  # Avoid division by zero
            final_score = round(3 + (raw_prediction - min_pred) / (max_pred - min_pred) * 6, 2)
        else:
            final_score = round(raw_prediction * 10, 2)  # Default scaling if all predictions are similar

        # Store restaurant name, score, and address
        restaurant_scores.append((row["Restaurant"], final_score, row["Address"]))

    # ✅ Sort restaurants by popularity score (highest first)
    restaurant_scores.sort(key=lambda x: x[1], reverse=True)

    # ✅ Return the top 3 restaurants
    return restaurant_scores[:3] if restaurant_scores else "No suitable restaurants found."




