/*
 * Yuva Yodha Tech 2026 - Challenge 4: Smart Manufacturing
 * Arduino Uno R4 WiFi / ESP32 IIoT Telemetry Ingestion Node
 * Sensors: DS18B20 (Temperature), ACS712 (Current)
 * Communication: MQTT over WiFi to Raspberry Pi Edge Node (Node-RED)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <OneWire.h>

// ---------------- HARDWARE PINS ----------------
#define TEMP_SENSOR_PIN 2     // DS18B20 OneWire Data Pin
#define ACS712_PIN A0         // ACS712 Current Sensor Analog Pin
#define FAN_RELAY_PIN 7       // Relay output for Cooling Fan
#define HEATER_RELAY_PIN 8    // Relay output for Heater

#define VREF 5.0              // Reference voltage (5.0V)
#define ADC_MAX 1023.0        // 10-bit ADC resolution
#define ACS712_SENSITIVITY 0.100 // 100mV/A for ACS712-20A module

// ---------------- NETWORK & BROKER CONFIG ----------------
const char* ssid = "Factory_WiFi_SSID";
const char* password = "FactoryPassword123";
const char* mqtt_server = "172.20.10.7"; // Raspberry Pi Edge IP
const int mqtt_port = 1883;

const char* topic_telemetry = "sensors/scada/telemetry";
const char* topic_control   = "sensors/scada/control";

// ---------------- OBJECT INSTANTIATION ----------------
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
OneWire ds(TEMP_SENSOR_PIN);

byte sensorAddr[8];
unsigned long lastPublishTime = 0;
const unsigned long publishInterval = 2000; // Publish every 2 seconds

// ---------------- DS18B20 SENSOR READ ----------------
float readDS18B20() {
  if (sensorAddr[0] == 0x00) return 25.0; // Fallback demo default

  ds.reset();
  ds.select(sensorAddr);
  ds.write(0x44, 1);
  delay(750);
  ds.reset();
  ds.select(sensorAddr);
  ds.write(0xBE);

  byte data[9];
  for (byte i = 0; i < 9; i++) data[i] = ds.read();

  int16_t raw = (data[1] << 8) | data[0];
  return (float)raw / 16.0;
}

// ---------------- ACS712 CURRENT READ ----------------
float readACS712Current() {
  int rawADC = analogRead(ACS712_PIN);
  float voltage = (rawADC / ADC_MAX) * VREF;
  float current = (voltage - (VREF / 2.0)) / ACS712_SENSITIVITY;
  return abs(current);
}

// ---------------- MQTT CALLBACK (ACTUATION) ----------------
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("[MQTT RX] "); Serial.print(topic); Serial.print(" -> "); Serial.println(message);

  if (message == "FAN_ON") {
    digitalWrite(FAN_RELAY_PIN, HIGH);
  } else if (message == "FAN_OFF") {
    digitalWrite(FAN_RELAY_PIN, LOW);
  } else if (message == "HEATER_ON") {
    digitalWrite(HEATER_RELAY_PIN, HIGH);
  } else if (message == "HEATER_OFF") {
    digitalWrite(HEATER_RELAY_PIN, LOW);
  }
}

// ---------------- NETWORK SETUP ----------------
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("Connecting to WiFi "); Serial.print(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Connected! IP: " + WiFi.localIP().toString());
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT Broker...");
    if (mqttClient.connect("ArduinoSCADANode")) {
      Serial.println(" Connected.");
      mqttClient.subscribe(topic_control);
    } else {
      Serial.print(" Failed, rc="); Serial.print(mqttClient.state());
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(FAN_RELAY_PIN, OUTPUT);
  pinMode(HEATER_RELAY_PIN, OUTPUT);

  if (!ds.search(sensorAddr)) {
    ds.reset_search();
  }

  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);

  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) reconnectMQTT();
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastPublishTime >= publishInterval) {
    lastPublishTime = now;

    float procTemp = readDS18B20();
    float current  = readACS712Current();
    float envTemp  = 8.5; // Ambient baseline reading

    // JSON Payload
    String payload = "{";
    payload += "\"ProcTemp\":" + String(procTemp, 2) + ",";
    payload += "\"Current\":"  + String(current, 2) + ",";
    payload += "\"EnvTemp\":"  + String(envTemp, 2);
    payload += "}";

    mqttClient.publish(topic_telemetry, payload.c_str());
    Serial.print("[MQTT TX] "); Serial.println(payload);
  }
}
