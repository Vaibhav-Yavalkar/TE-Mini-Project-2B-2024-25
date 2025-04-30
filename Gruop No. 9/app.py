from flask import Flask, render_template, request, jsonify
import pandas as pd
from main import search, stockpredict
import requests
import os
from datetime import datetime, timedelta
import cohere

app = Flask(__name__)
app.debug = True

# API Keys
COHERE_API_KEY = "Hcl4LZr34kxCd93oLjTToBdZ9v1r0f03Za2FMvpD"
FINNHUB_API_KEY = "cvruce1r01qnpem9p8f0cvruce1r01qnpem9p8fg"
TWELVE_DATA_API_KEY = "403b0ad0a90f42858df27b155e0d8eeb"

co = cohere.Client(COHERE_API_KEY)

# Load dataset
script_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.join(script_dir, 'dataset', 'all_stocks_5yr.csv')

try:
    df = pd.read_csv(dataset_path)
except Exception as e:
    print(f"Error loading dataset: {str(e)}")
    df = None

@app.route("/")
def index():
    return render_template("home.html")

@app.route("/news")
def news():
    return render_template("news.html")

@app.route("/topstocks")
def topstocks():
    return render_template("topstocks.html")

@app.route("/api/topstocks")
def get_top_stocks():
    try:
        symbols = ["AAPL", "MSFT", "TSLA", "GOOGL", "AMZN", "META", "NFLX", "TCS.NS", "INFY.NS", "RELIANCE.NS"]
        movers = []

        for symbol in symbols:
            url = f"https://api.twelvedata.com/quote?symbol={symbol}&apikey={TWELVE_DATA_API_KEY}"
            response = requests.get(url)
            data = response.json()

            if "percent_change" in data:
                try:
                    percent = float(data["percent_change"])
                    movers.append({
                        "symbol": symbol,
                        "price": data.get("price"),
                        "change": data.get("change"),
                        "percent_change": percent,
                        "high": data.get("high"),
                        "low": data.get("low"),
                        "volume": data.get("volume")
                    })
                except ValueError:
                    continue

        # ✅ FIXED: Properly filter before slicing
        gainers = sorted([m for m in movers if m["percent_change"] > 0], key=lambda x: x["percent_change"], reverse=True)[:5]
        losers = sorted([m for m in movers if m["percent_change"] < 0], key=lambda x: x["percent_change"])[:5]

        return jsonify({"gainers": gainers, "losers": losers})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_stock_news")
def get_stock_news():
    try:
        symbol = request.args.get('symbol', '')
        url = f"https://finnhub.io/api/v1/company-news"
        params = {
            'symbol': symbol,
            'from': (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d'),
            'to': datetime.now().strftime('%Y-%m-%d'),
            'token': FINNHUB_API_KEY
        }
        response = requests.get(url, params=params)
        data = response.json()
        if isinstance(data, list):
            return jsonify(data)
        else:
            return jsonify({'error': 'Failed to fetch news'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/", methods=["POST"])
def requestStock():
    try:
        text = request.form['sname']
        stockName = text.upper()
        print(f"Processing stock: {stockName}")
        if search(stockName):
            return displayStock(stockName)
        else:
            return predictStock(stockName)
    except Exception as e:
        print(f"Error in requestStock: {str(e)}")
        return render_template("error.html", error=str(e))

def displayStock(stockName):
    try:
        stockData = []
        stock_file = os.path.join(script_dir, 'static', 'stocks', stockName, f'{stockName}.txt')
        with open(stock_file, 'r') as filehandle:
            for line in filehandle:
                stockData.append(line.strip())
        return render_template("stockdetail.html", stockName=stockName, stockData=stockData)
    except Exception as e:
        print(f"Error in displayStock: {str(e)}")
        return render_template("error.html", error=str(e))

def predictStock(stockName):
    try:
        stockData = stockpredict(stockName)
        if stockData and stockData[0] == "Error":
            return render_template("error.html", error=stockData[1])
        return render_template("stockdetail.html", stockName=stockName, stockData=stockData)
    except Exception as e:
        print(f"Error in predictStock: {str(e)}")
        return render_template("error.html", error=str(e))

@app.route("/chatbot", methods=["POST"])

def chatbot():
    try:
        if df is None:
            return jsonify({"response": "Sorry, the stock data is currently unavailable."})

        user_message = request.json.get("message", "").lower()
        stock_symbols = df["Symbol"].str.lower().tolist()

        for symbol in stock_symbols:
            if symbol in user_message:
                stock_info = df[df["Symbol"].str.lower() == symbol].iloc[0]
                response = (
                    f"Stock: {stock_info['Symbol']}\n"
                    f"Price: {stock_info['Close']}\n"
                    f"Volume: {stock_info['Volume']}"
                )
                return jsonify({"response": response})

        return jsonify({"response": "Sorry, I don't have data for that. Try asking about a specific stock symbol."})
    except Exception as e:
        return jsonify({"response": f"An error occurred: {str(e)}"})

@app.route('/ask', methods=['POST'])
def ask():
    try:
        user_message = request.json['message']
        stock_symbol = detect_stock_query(user_message)

        price_info = ""
        news_info = ""
        stock_data = None
        news_data = None

        if stock_symbol:
            stock_data = get_stock_price(stock_symbol)
            if isinstance(stock_data, dict) and "error" not in stock_data:
                price_info = (
                    f"Current price: {stock_data['price']}\n"
                    f"Change: {stock_data['change']} ({stock_data['change_percent']})\n"
                    f"Volume: {stock_data['volume']}\n"
                    f"Today's range: {stock_data['low']} - {stock_data['high']}"
                )

            news_data = get_company_news(stock_symbol)
            if news_data:
                news_info = "Recent news:\n"
                for news in news_data:
                    news_info += f"- {news['headline']} ({news['datetime']})\n"

        context = "\n".join([
            "You are a helpful financial assistant. Use the real-time data provided below to answer the user's question.",
            f"Stock: {stock_symbol}" if stock_symbol else "No specific stock mentioned",
            price_info,
            news_info
        ])

        response = co.chat(
            message=user_message,
            model="command",
            temperature=0.6,
            max_tokens=200,
            chat_history=[],
            preamble=context
        )

        reply = response.text.strip()
        return jsonify({
            'reply': reply,
            'stock_data': stock_data if stock_data else None,
            'news_data': news_data if news_data else None
        })
    except Exception as e:
        return jsonify({'reply': f"Sorry, there was an error: {str(e)}"})

def detect_stock_query(text):
    companies = {
        "apple": "AAPL",
        "microsoft": "MSFT",
        "tesla": "TSLA",
        "meta": "META",
        "google": "GOOGL",
        "amazon": "AMZN",
        "mahindra": "M&M.NS",
        "tata": "TATAMOTORS.NS",
        "reliance": "RELIANCE.NS",
        "infosys": "INFY.NS",
        "hdfc": "HDFCBANK.NS",
        "icici": "ICICIBANK.NS",
        "sbi": "SBIN.NS",
        "tcs": "TCS.NS",
        "wipro": "WIPRO.NS",
        "bajaj": "BAJAJ-AUTO.NS"
    }

    text_lower = text.lower()
    for name, symbol in companies.items():
        if name in text_lower or symbol.lower() in text_lower:
            return symbol
    return None

def get_stock_price(symbol):
    try:
        url = f"https://api.twelvedata.com/quote?symbol={symbol}&apikey={TWELVE_DATA_API_KEY}"
        response = requests.get(url)
        data = response.json()

        if "price" in data:
            return {
                "price": data.get("price", "N/A"),
                "change": data.get("change", "N/A"),
                "change_percent": data.get("percent_change", "N/A"),
                "volume": data.get("volume", "N/A"),
                "high": data.get("high", "N/A"),
                "low": data.get("low", "N/A")
            }
        else:
            return {"error": data.get("message", "No data found.")}
    except Exception as e:
        return {"error": str(e)}

def get_company_news(symbol):
    try:
        url = f"https://finnhub.io/api/v1/company-news"
        params = {
            'symbol': symbol,
            'from': (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d'),
            'to': datetime.now().strftime('%Y-%m-%d'),
            'token': FINNHUB_API_KEY
        }
        response = requests.get(url, params=params)
        news_data = response.json()
        if isinstance(news_data, list) and len(news_data) > 0:
            return news_data[:3]
        return []
    except Exception as e:
        return []

@app.route("/api/news")
def get_news():
    try:
        category = request.args.get('category', 'general')
        
        # Map frontend categories to Finnhub categories
        category_map = {
            'general': 'general',
            'forex': 'forex',
            'crypto': 'crypto',
            'merger': 'merger'
        }
        
        finnhub_category = category_map.get(category, 'general')
        
        url = "https://finnhub.io/api/v1/news"
        params = {
            'category': finnhub_category,
            'token': FINNHUB_API_KEY
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        news_data = response.json()
        
        if not isinstance(news_data, list):
            return jsonify([]), 200
            
        # Process and clean the news data
        processed_news = []
        for news in news_data[:30]:  # Limit to 30 items
            if all(key in news for key in ['headline', 'datetime', 'url']):
                processed_news.append({
                    'headline': news['headline'],
                    'datetime': news['datetime'],
                    'url': news['url'],
                    'summary': news.get('summary', ''),
                    'source': news.get('source', '')
                })
                
        return jsonify(processed_news)
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching news: {str(e)}")
        return jsonify({'error': 'Failed to fetch news from the server'}), 500
    except Exception as e:
        print(f"Error processing news: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run()
