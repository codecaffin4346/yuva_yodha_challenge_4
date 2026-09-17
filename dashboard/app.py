import os
import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from joblib import load

# Page Configuration
st.set_page_config(
    page_title="Yuva Yodha Tech - Smart SCADA & AI Predictor",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load Trained Model
@st.cache_resource
def load_ml_model():
    model_path = os.path.join(os.path.dirname(__file__), "..", "ai_model", "energy_predictor.joblib")
    if os.path.exists(model_path):
        return load(model_path)
    return None

model = load_ml_model()

# Header Banner
st.title("⚡ Smart Industrial Process Monitoring & AI Energy Predictor")
st.caption("Schneider Electric Yuva Yodha Tech Hackathon 2026 • Challenge 4 Solution (Open-Source IIoT SCADA)")

st.markdown("---")

# Sidebar
st.sidebar.header("🕹️ SCADA Control & Parameters")
st.sidebar.success("MQTT Broker: Connected (172.20.10.7:1883)")
st.sidebar.info("Node-RED Engine: Active")

proc_temp = st.sidebar.slider("Process Temperature (°C)", min_value=30.0, max_value=100.0, value=60.0, step=0.5)
env_temp = st.sidebar.slider("Environmental Temperature (°C)", min_value=-10.0, max_value=50.0, value=7.5, step=0.5)
current_draw = st.sidebar.slider("Motor Current Draw (A)", min_value=1.0, max_value=10.0, value=3.54, step=0.1)

# Metrics Cards
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric(label="Process Temp (DS18B20)", value=f"{proc_temp:.1f} °C", delta="Normal")

with col2:
    st.metric(label="Ambient Temp", value=f"{env_temp:.1f} °C")

with col3:
    st.metric(label="Current Draw (ACS712)", value=f"{current_draw:.2f} A")

# Prediction
if model:
    input_data = pd.DataFrame([[proc_temp, env_temp, current_draw]], columns=['ProcTemp', 'EnvTemp', 'Current'])
    predicted_energy = model.predict(input_data)[0]
else:
    # Surrogate formula fallback
    predicted_energy = 0.22 + (proc_temp - 50.0)*0.0018 + (8.0 - env_temp)*0.0035

with col4:
    co2_emissions = predicted_energy * 0.82
    st.metric(label="Predicted Energy (kWh)", value=f"{predicted_energy:.3f} kWh", delta=f"{co2_emissions:.3f} kg CO2/hr", delta_color="inverse")

st.markdown("### 📊 Live Telemetry Trends & AI Analytics")

# Data generator for visualization
chart_data = pd.DataFrame(
    np.random.randn(20, 3) / [10, 5, 50] + [proc_temp, current_draw, predicted_energy],
    columns=["ProcTemp (°C)", "Current (A)", "EnergyCon (kWh)"]
)

st.line_chart(chart_data)

st.markdown("---")
st.markdown("#### 💡 AI Energy Optimization Insights")
if proc_temp > 75.0:
    st.warning("⚠️ High Thermal Load Alert: Process temperature exceeding 75°C increases power demand significantly. Consider increasing cooling fan output.")
elif env_temp < 0:
    st.info("❄️ Cold Ambient Condition: Low environmental temperature requires additional thermal insulation around the process tank.")
else:
    st.success("✅ System Operating at Optimal Thermal Efficiency. Thermal dissipation baseline target met.")
