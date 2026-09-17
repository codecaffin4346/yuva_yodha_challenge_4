"""
Yuva Yodha Tech Challenge 4 - Pure Software Industrial Digital Twin Simulator
Generates realistic industrial SCADA telemetry (no physical sensors required)
"""

import time
import math
import random
import json
import os
import pandas as pd
from joblib import load

class IndustrialDigitalTwinSimulator:
    def __init__(self):
        self.mode = "NORMAL" # NORMAL, OVERHEATING, MOTOR_ANOMALY, COLD_WEATHER, GRID_PEAK
        self.time_step = 0
        
        # Base operational state
        self.proc_temp = 60.0
        self.env_temp = 12.0
        self.current = 3.5
        self.voltage = 230.0
        self.motor_rpm = 1450.0
        self.vibration = 0.8 # mm/s
        
        # Load ML model if available
        model_path = os.path.join(os.path.dirname(__file__), "ai_model", "energy_predictor.joblib")
        if os.path.exists(model_path):
            self.model = load(model_path)
            print("Loaded AI Random Forest Model for Energy Prediction.")
        else:
            self.model = None

    def set_scenario(self, scenario_name):
        valid_scenarios = ["NORMAL", "OVERHEATING", "MOTOR_ANOMALY", "COLD_WEATHER", "GRID_PEAK"]
        if scenario_name in valid_scenarios:
            self.mode = scenario_name
            print(f"Industrial Simulator Scenario Changed to: {self.mode}")

    def generate_telemetry(self):
        self.time_step += 1
        t = self.time_step * 0.1

        # Scenario dynamic physics
        if self.mode == "NORMAL":
            self.proc_temp = 59.5 + math.sin(t * 0.5) * 1.2 + random.uniform(-0.3, 0.3)
            self.env_temp = 12.0 + math.cos(t * 0.1) * 2.0 + random.uniform(-0.1, 0.1)
            self.current = 3.5 + math.sin(t * 0.3) * 0.2 + random.uniform(-0.05, 0.05)
            self.vibration = 0.8 + random.uniform(-0.05, 0.05)
            self.motor_rpm = 1450.0 + random.uniform(-5.0, 5.0)

        elif self.mode == "OVERHEATING":
            # Process temperature spikes, current increases
            self.proc_temp = min(92.0, self.proc_temp + random.uniform(0.5, 1.2))
            self.env_temp = 15.0 + random.uniform(-0.2, 0.2)
            self.current = 4.8 + random.uniform(-0.1, 0.2)
            self.vibration = 1.6 + random.uniform(0.0, 0.3)
            self.motor_rpm = 1410.0 + random.uniform(-10.0, 5.0)

        elif self.mode == "MOTOR_ANOMALY":
            # Current spikes and high vibration indicating mechanical wear
            self.proc_temp = 68.0 + random.uniform(-0.5, 0.5)
            self.env_temp = 10.0 + random.uniform(-0.1, 0.1)
            self.current = 6.8 + random.uniform(-0.3, 0.4) # High current draw
            self.vibration = 3.8 + random.uniform(-0.2, 0.5) # Critical vibration
            self.motor_rpm = 1320.0 + random.uniform(-20.0, 10.0)

        elif self.mode == "COLD_WEATHER":
            # Sub-zero ambient temperature requiring additional heating energy
            self.proc_temp = 55.0 + math.sin(t * 0.2) * 2.0
            self.env_temp = -8.5 + random.uniform(-0.3, 0.3)
            self.current = 4.2 + random.uniform(-0.1, 0.1)
            self.vibration = 0.9 + random.uniform(-0.05, 0.05)
            self.motor_rpm = 1450.0 + random.uniform(-3.0, 3.0)

        elif self.mode == "GRID_PEAK":
            # Voltage dips due to grid peak load
            self.proc_temp = 62.0 + random.uniform(-0.4, 0.4)
            self.env_temp = 22.0 + random.uniform(-0.2, 0.2)
            self.voltage = 210.5 + random.uniform(-2.0, 2.0) # Voltage sag
            self.current = 4.1 + random.uniform(-0.1, 0.1)

        # AI Prediction for Energy Consumption
        if self.model:
            input_df = pd.DataFrame([[self.proc_temp, self.env_temp, self.current]], 
                                    columns=['ProcTemp', 'EnvTemp', 'Current'])
            energy_con = float(self.model.predict(input_df)[0])
        else:
            energy_con = 0.22 + (self.proc_temp - 50.0)*0.0018 + (8.0 - self.env_temp)*0.0035

        co2 = energy_con * 0.82

        return {
            "timestamp": time.strftime("%H:%M:%S"),
            "scenario": self.mode,
            "ProcTemp": round(self.proc_temp, 2),
            "EnvTemp": round(self.env_temp, 2),
            "Current": round(self.current, 2),
            "Voltage": round(self.voltage, 1),
            "MotorRPM": round(self.motor_rpm, 1),
            "Vibration": round(self.vibration, 2),
            "EnergyCon": round(energy_con, 3),
            "CO2_Emissions": round(co2, 3),
            "AlarmState": "CRITICAL" if (self.proc_temp > 80 or self.vibration > 3.0) else "NORMAL"
        }

if __name__ == "__main__":
    sim = IndustrialDigitalTwinSimulator()
    print("--- Starting Pure Software Digital Twin SCADA Telemetry Loop ---")
    for _ in range(10):
        data = sim.generate_telemetry()
        print(json.dumps(data, indent=2))
        time.sleep(1)
