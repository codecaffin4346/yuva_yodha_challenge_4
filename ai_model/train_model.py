import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from joblib import dump

def train_and_benchmark():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, "Scada_Data.csv")
    
    print(f"Loading SCADA dataset from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    features = ['ProcTemp', 'EnvTemp', 'Current']
    target = 'EnergyCon'
    
    X = df[features]
    y = df[target]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Define models
    models = {
        "RandomForest": RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42),
        "GradientBoosting": GradientBoostingRegressor(n_estimators=100, random_state=42),
        "NeuralNetwork": MLPRegressor(hidden_layer_sizes=(32, 16), max_iter=500, random_state=42),
        "LinearRegression": LinearRegression()
    }
    
    benchmark_results = {}
    best_model = None
    best_r2 = -1.0
    best_model_name = ""
    
    print("\n--- Training & Benchmarking AI Models ---")
    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        r2 = float(r2_score(y_test, y_pred))
        mae = float(mean_absolute_error(y_test, y_pred))
        mse = float(mean_squared_error(y_test, y_pred))
        
        benchmark_results[name] = {
            "R2_Score": round(r2, 4),
            "MAE": round(mae, 6),
            "MSE": round(mse, 6)
        }
        
        print(f"Model: {name:18s} | R^2: {r2:.4f} | MAE: {mae:.6f}")
        
        if r2 > best_r2:
            best_r2 = r2
            best_model = model
            best_model_name = name

    # Save best model and benchmark metrics
    model_output_path = os.path.join(script_dir, "energy_predictor.joblib")
    dump(best_model, model_output_path)
    print(f"\nBest Model ({best_model_name}) saved to: {model_output_path}")
    
    metrics_path = os.path.join(script_dir, "benchmark_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(benchmark_results, f, indent=2)
    print(f"Benchmark results saved to: {metrics_path}")

if __name__ == "__main__":
    train_and_benchmark()
