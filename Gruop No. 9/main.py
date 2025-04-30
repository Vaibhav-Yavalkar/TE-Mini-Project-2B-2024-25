import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dropout, Dense
import matplotlib
matplotlib.use('Agg')  # Fix RuntimeError for Flask
import matplotlib.pyplot as plt

def search(stockName):
    try:
        with open(f'static/stocks/{stockName}/{stockName}1.png', 'r'):
            print("Cache found")
            return 1
    except FileNotFoundError:
        print("File not found")
        return 0

# Function to process the data into 7-day look-back slices
def processData(data, lb):
    X, Y = [], []
    for i in range(len(data) - lb - 1):
        X.append(data[i:(i + lb), 0])
        Y.append(data[(i + lb), 0])
    return np.array(X), np.array(Y)

# Main Stock Prediction Function
def stockpredict(stockName):
    try:
        # Load dataset
        script_dir = os.path.dirname(os.path.abspath(__file__))
        dataset_path = os.path.join(script_dir, 'dataset', 'all_stocks_5yr.csv')
        
        # Check if dataset exists
        if not os.path.exists(dataset_path):
            print(f"Error: Dataset file not found at {dataset_path}")
            return ["Error", "Dataset file not found"]
            
        try:
            data = pd.read_csv(dataset_path)
        except Exception as e:
            print(f"Error reading dataset: {str(e)}")
            return ["Error", "Failed to read dataset file"]
        
        # Strip column names and convert to uppercase
        data.columns = data.columns.str.strip().str.lower()
        data['name'] = data['name'].str.upper()
        stockName = stockName.upper()

        # Rename columns to match requirements
        data = data.rename(columns={
            'date': 'Date',
            'close': 'Close',
            'name': 'Name'
        })

        # Check if required columns exist
        required_columns = ['Name', 'Close', 'Date']
        missing_columns = [col for col in required_columns if col not in data.columns]
        if missing_columns:
            print(f"Error: Missing required columns: {missing_columns}")
            print("Available columns:", data.columns)
            return ["Error", "Missing required columns in dataset"]

        # Filter stock data
        stock_data = data[data['Name'] == stockName].copy()
        if stock_data.empty:
            print(f"Error: No data found for stock '{stockName}'!")
            return ["Error", f"No data found for stock {stockName}. Please check if the stock symbol is correct."]

        # Sort by date and reset index
        stock_data['Date'] = pd.to_datetime(stock_data['Date'])
        stock_data = stock_data.sort_values('Date').reset_index(drop=True)
        cl = stock_data['Close']

        if len(cl) < 30:  # Require at least 30 days of data for meaningful prediction
            return ["Error", f"Insufficient data for stock {stockName}. Need at least 30 days of data."]

        # Create directory structure if it doesn't exist
        static_dir = os.path.join(script_dir, 'static')
        stocks_dir = os.path.join(static_dir, 'stocks')
        stock_dir = os.path.join(stocks_dir, stockName)
        
        os.makedirs(static_dir, exist_ok=True)
        os.makedirs(stocks_dir, exist_ok=True)
        os.makedirs(stock_dir, exist_ok=True)

        # Scaling using MinMaxScaler
        scl = MinMaxScaler()
        cl = cl.values.reshape(-1, 1)
        cl = scl.fit_transform(cl)

        # Ensure we have enough data
        if len(cl) < 8:  # Need at least 8 days of data (7 for input, 1 for prediction)
            return ["Error", "Insufficient data for prediction"]

        X, Y = processData(cl, 7)
        
        # Ensure we have enough data after processing
        if len(X) == 0 or len(Y) == 0:
            return ["Error", "Insufficient data after processing"]

        X_train, X_test = X[:int(X.shape[0] * 0.80)], X[int(X.shape[0] * 0.80):]
        Y_train, Y_test = Y[:int(Y.shape[0] * 0.80)], Y[int(Y.shape[0] * 0.80):]

        # Build RNN LSTM model
        model = Sequential([
            LSTM(32, input_shape=(7, 1)),
            Dropout(0.5),
            Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse')

        # Reshape data for (Sample, Timestep, Features)
        X_train = X_train.reshape((X_train.shape[0], X_train.shape[1], 1))
        X_test = X_test.reshape((X_test.shape[0], X_test.shape[1], 1))

        hist = model.fit(X_train, Y_train, epochs=50, validation_data=(X_test, Y_test), shuffle=False)

        # Save training loss graph
        plt.figure(figsize=(10, 6))
        plt.plot(hist.history['loss'])
        plt.plot(hist.history['val_loss'])
        plt.title('Model Loss')
        plt.ylabel('Loss')
        plt.xlabel('Epoch')
        plt.legend(['Train', 'Validation'], loc='upper right')
        plt.savefig(os.path.join(stock_dir, f"{stockName}2.png"))
        plt.close()

        # Predict price for the last test sample
        i = min(249, len(X_test) - 1)  # Prevent index out of range
        Xt = model.predict(X_test[i].reshape(1, 7, 1))
        pprice = scl.inverse_transform(Xt).copy()
        pprice = round(float(pprice[0][0]), 2)

        # Predict entire test set
        Xt = model.predict(X_test)
        rval = scl.inverse_transform(Y_test.reshape(-1, 1))
        pval = scl.inverse_transform(Xt)

        # Calculate accuracy
        ploss = np.mean(np.abs((rval - pval) / rval) * 100)
        acr = round(100 - ploss, 2)

        # Save prediction vs real price graph
        plt.figure(figsize=(10, 6))
        plt.plot(rval)
        plt.plot(pval)
        plt.title(f'{stockName} Stock Price Prediction')
        plt.ylabel('Price')
        plt.xlabel('Days')
        plt.legend(['Real', 'Prediction'], loc='upper left')
        plt.savefig(os.path.join(stock_dir, f"{stockName}1.png"))
        plt.close()

        # Save prediction results
        result_file = os.path.join(stock_dir, f"{stockName}.txt")
        with open(result_file, 'w') as filehandle:
            filehandle.write(f"{pprice}\n{acr}\n")

        return [str(pprice), str(acr)]

    except Exception as e:
        print(f"Error in stock prediction: {str(e)}")
        return ["Error", str(e)]
