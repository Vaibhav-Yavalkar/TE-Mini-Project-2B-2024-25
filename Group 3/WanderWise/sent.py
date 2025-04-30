# import os
# import matplotlib
# # Use the non-interactive backend to avoid GUI warnings
# matplotlib.use('Agg')
# import matplotlib.pyplot as plt

# import pandas as pd
# import nltk
# from nltk.sentiment import SentimentIntensityAnalyzer

# # Ensure VADER Lexicon is downloaded
# # nltk.download('vader_lexicon')

# # Load the CSV data (adjust the path if needed)
# df = pd.read_csv("swiggy_sent.csv")
# df["review_date"] = pd.to_datetime(df["review_date"], errors="coerce")
# df["Year"] = df["review_date"].dt.year
# df["Month"] = df["review_date"].dt.strftime("%B")

# # Initialize the Sentiment Analyzer
# sia = SentimentIntensityAnalyzer()

# def get_sentiment(text):
#     """Classify review sentiment based on VADER's compound score."""
#     if pd.isna(text):
#         return "Average"  # Treat missing text as neutral
#     score = sia.polarity_scores(text)["compound"]
#     if score >= 0.05:
#         return "Good"
#     elif score <= -0.05:
#         return "Bad"
#     else:
#         return "Average"

# # Apply sentiment analysis to the dataset
# df["Sentiment"] = df["review_description"].apply(get_sentiment)

# # Ensure the directory to save images exists
# os.makedirs("static/images", exist_ok=True)

# def perform_sentiment_analysis(year):
#     """
#     Perform sentiment analysis for a given year.
    
#     Args:
#         year (int or str): Year to filter reviews.
    
#     Returns:
#         tuple: (year, pie_chart_path, line_chart_path)
#     """
#     year = int(year)  # Ensure the year is an integer
#     df_year = df[df["Year"] == year]
    
#     # Group sentiment counts by month and reindex to calendar order
#     sentiment_monthly = df_year.groupby(["Month", "Sentiment"]).size().unstack()
#     month_order = ["January", "February", "March", "April", "May", "June",
#                    "July", "August", "September", "October", "November", "December"]
#     sentiment_monthly = sentiment_monthly.reindex(month_order)
    
#     # --- Generate Pie Chart ---
#     pie_chart_path = "static/images/pie_chart.png"
#     plt.figure(figsize=(6, 6))
#     df_year["Sentiment"].value_counts().plot(
#         kind="pie", autopct="%1.1f%%", colors=["green", "gray", "red"]
#     )
#     plt.title(f"Overall Sentiment Distribution in {year}")
#     plt.ylabel("")  # Hide the y-label
#     plt.savefig(pie_chart_path)
#     plt.close()
    
#     # --- Generate Line Chart ---
#     line_chart_path = "static/images/line_chart.png"
#     plt.figure(figsize=(12, 6))
#     sentiment_monthly.plot(
#         kind="line", marker="o", colormap="coolwarm", figsize=(12, 6)
#     )
#     plt.title(f"Monthly Sentiment Trend in {year}")
#     plt.xlabel("Month")
#     plt.ylabel("Number of Reviews")
#     plt.legend(title="Sentiment")
#     plt.grid(True)
#     plt.xticks(rotation=45)
#     plt.savefig(line_chart_path)
#     plt.close()
    
#     return year, pie_chart_path, line_chart_path

# def perform_yearly_analysis():
#     """Perform yearly sentiment analysis and generate a bar graph."""
#     # Group sentiment counts by year
#     sentiment_yearly = df.groupby(["Year", "Sentiment"]).size().unstack()
    
#     # Print sentiment counts with emojis to the console
#     print("\n📅 Sentiment Distribution by Year")
#     print(sentiment_yearly)
#     print("\n📊 Sentiment Count by Year:")
#     yearly_counts = {}
#     for year in sentiment_yearly.index:
#         good = sentiment_yearly.loc[year, "Good"] if "Good" in sentiment_yearly.columns else 0
#         avg  = sentiment_yearly.loc[year, "Average"] if "Average" in sentiment_yearly.columns else 0
#         bad  = sentiment_yearly.loc[year, "Bad"] if "Bad" in sentiment_yearly.columns else 0
#         yearly_counts[year] = {"Good": good, "Average": avg, "Bad": bad}
#         print(f"\n📅 {year}")
#         print("😃  Good Reviews:".ljust(20), good)
#         print("😐  Average Reviews:".ljust(20), avg)
#         print("😡  Bad Reviews:".ljust(20), bad)
    
#     # Generate and save Bar Chart for yearly sentiment comparison
#     bar_chart_path = "static/images/yearly_bar_chart.png"
#     plt.figure(figsize=(12, 6))
#     sentiment_yearly.plot(kind="bar", colormap="coolwarm", edgecolor="black")
#     plt.title("Yearly Sentiment Comparison")
#     plt.xlabel("Year")
#     plt.ylabel("Number of Reviews")
#     plt.legend(title="Sentiment")
#     plt.grid(axis="y", linestyle="--")
#     plt.xticks(rotation=0)
#     plt.savefig(bar_chart_path)
#     plt.close()
    
#     return yearly_counts, bar_chart_path


import os
import matplotlib
# Use the non-interactive backend to avoid GUI warnings
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

# Ensure VADER Lexicon is downloaded
#nltk.download('vader_lexicon')

# Load the CSV data (adjust the path if needed)
df = pd.read_csv("swiggy_sent.csv")

# Convert review_date to datetime format
df["review_date"] = pd.to_datetime(df["review_date"], errors="coerce")

# Extract Year and Month from review_date
df["Year"] = df["review_date"].dt.year
df["Month"] = df["review_date"].dt.strftime("%B")

# Initialize the Sentiment Analyzer
sia = SentimentIntensityAnalyzer()

def get_sentiment(text):
    """Classify review sentiment based on VADER's compound score."""
    if pd.isna(text):
        return "Average"  # Treat missing text as neutral
    score = sia.polarity_scores(text)["compound"]
    if score >= 0.05:
        return "Good"
    elif score <= -0.05:
        return "Bad"
    else:
        return "Average"

# Apply sentiment analysis to the dataset
df["Sentiment"] = df["review_description"].apply(get_sentiment)

# Ensure the directory to save images exists
os.makedirs("static/images", exist_ok=True)

def perform_sentiment_analysis(year):
    """
    Perform sentiment analysis for a given year.
    
    Args:
        year (int or str): Year to filter reviews.
    
    Returns:
        tuple: (year, pie_chart_path, line_chart_path)
    """
    year = int(year)  # Ensure the year is an integer
    df_year = df[df["Year"] == year]
    
    if df_year.empty:
        return year, None, None  # Return None if no data is found for the year

    # Group sentiment counts by month and reindex to maintain month order
    sentiment_monthly = df_year.groupby(["Month", "Sentiment"]).size().unstack(fill_value=0)
    month_order = ["January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"]
    sentiment_monthly = sentiment_monthly.reindex(month_order)

    # --- Generate Pie Chart ---
    pie_chart_path = "static/images/pie_chart.png"
    plt.figure(figsize=(6, 6))
    df_year["Sentiment"].value_counts().plot(
        kind="pie", autopct="%1.1f%%", colors=["green", "gray", "red"]
    )
    plt.title(f"Overall Sentiment Distribution in {year}")
    plt.ylabel("")  # Hide the y-label
    plt.savefig(pie_chart_path)
    plt.close()
    
    # --- Generate Line Chart ---
    line_chart_path = "static/images/line_chart.png"
    plt.figure(figsize=(12, 6))
    sentiment_monthly.plot(
        kind="line", marker="o", colormap="coolwarm", figsize=(12, 6)
    )
    plt.title(f"Monthly Sentiment Trend in {year}")
    plt.xlabel("Month")
    plt.ylabel("Number of Reviews")
    plt.legend(title="Sentiment")
    plt.grid(True)
    plt.xticks(rotation=45)
    plt.savefig(line_chart_path)
    plt.close()
    
    return year, pie_chart_path, line_chart_path

def perform_yearly_analysis():
    """Perform yearly sentiment analysis and generate a bar graph."""
    sentiment_yearly = df.groupby(["Year", "Sentiment"]).size().unstack(fill_value=0)
    
    # Print sentiment counts
    print("\n📅 Sentiment Distribution by Year")
    print(sentiment_yearly)
    
    yearly_counts = sentiment_yearly.to_dict(orient="index")

    # Generate and save Bar Chart for yearly sentiment comparison
    bar_chart_path = "static/images/yearly_bar_chart.png"
    plt.figure(figsize=(12, 6))
    sentiment_yearly.plot(kind="bar", colormap="coolwarm", edgecolor="black")
    plt.title("Yearly Sentiment Comparison")
    plt.xlabel("Year")
    plt.ylabel("Number of Reviews")
    plt.legend(title="Sentiment")
    plt.grid(axis="y", linestyle="--")
    plt.xticks(rotation=0)
    plt.savefig(bar_chart_path)
    plt.close()
    
    return yearly_counts, bar_chart_path
