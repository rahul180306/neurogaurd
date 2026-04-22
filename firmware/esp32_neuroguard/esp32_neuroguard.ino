/*
 * NeuroGuard ESP32 Firmware
 *
 * Hardware:
 *   - ESP32 DevKit
 *   - DHT11/DHT22 Humidity & Temperature Sensor (GPIO 4)
 *   - Servo Motor (GPIO 13)
 *
 * Connects to WiFi, registers with NeuroGuard backend,
 * and sends telemetry every 5 seconds including sensor
 * data and peripheral info.
 *
 * Libraries required (install via Arduino Library Manager):
 *   - DHT sensor library by Adafruit
 *   - Adafruit Unified Sensor
 *   - ESP32Servo
 *   - ArduinoJson (v6+)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <ESP32Servo.h>

// ─── Configuration ───────────────────────────────────
// WiFi credentials — change these to match your network
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// NeuroGuard backend address (Raspberry Pi IP)
const char* BACKEND_HOST = "10.102.70.61";
const int   BACKEND_PORT = 8000;

// Device identity
const char* DEVICE_ID   = "esp32_neuroguard_01";
const char* DEVICE_NAME = "ESP32 NeuroGuard Node";
const char* DEVICE_TYPE = "esp32";

// ─── Pin Configuration ────────────────────────────────
#define DHT_PIN    4       // DHT data pin
#define DHT_TYPE   DHT11   // Change to DHT22 if using DHT22
#define SERVO_PIN  13      // Servo signal pin

// ─── Timing ───────────────────────────────────────────
const unsigned long TELEMETRY_INTERVAL_MS = 5000;  // 5 seconds
const unsigned long REGISTER_RETRY_MS     = 10000; // 10 seconds

// ─── Objects ──────────────────────────────────────────
DHT dht(DHT_PIN, DHT_TYPE);
Servo servoMotor;
HTTPClient http;

unsigned long lastTelemetry = 0;
bool registered = false;
int servoAngle = 0;
int servoDirection = 1;  // 1 = increasing, -1 = decreasing

// ─── Setup ────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n========================================");
    Serial.println("  NeuroGuard ESP32 Firmware v1.0");
    Serial.println("========================================\n");

    // Initialize sensors
    dht.begin();
    Serial.println("[INIT] DHT sensor initialized on GPIO " + String(DHT_PIN));

    // Initialize servo
    servoMotor.attach(SERVO_PIN);
    servoMotor.write(0);
    Serial.println("[INIT] Servo motor initialized on GPIO " + String(SERVO_PIN));

    // Connect to WiFi
    connectWiFi();
}

// ─── Main Loop ────────────────────────────────────────
void loop() {
    // Ensure WiFi is connected
    if (WiFi.status() != WL_CONNECTED) {
        connectWiFi();
    }

    // Register with backend if not yet registered
    if (!registered) {
        registered = registerDevice();
        if (!registered) {
            delay(REGISTER_RETRY_MS);
            return;
        }
    }

    // Send telemetry at interval
    unsigned long now = millis();
    if (now - lastTelemetry >= TELEMETRY_INTERVAL_MS) {
        lastTelemetry = now;

        // Sweep servo motor (demonstrates actuator is working)
        sweepServo();

        // Read sensors and send telemetry
        sendTelemetry();
    }
}

// ─── WiFi Connection ──────────────────────────────────
void connectWiFi() {
    Serial.print("[WIFI] Connecting to " + String(WIFI_SSID));
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[WIFI] Connected! IP: " + WiFi.localIP().toString());
    } else {
        Serial.println("\n[WIFI] Connection failed. Retrying...");
    }
}

// ─── Device Registration ──────────────────────────────
bool registerDevice() {
    String url = "http://" + String(BACKEND_HOST) + ":" + String(BACKEND_PORT) + "/api/device/register";

    StaticJsonDocument<512> doc;
    doc["device_id"] = DEVICE_ID;
    doc["name"]      = DEVICE_NAME;
    doc["type"]      = DEVICE_TYPE;
    doc["ip"]        = WiFi.localIP().toString();
    doc["mac"]       = WiFi.macAddress();

    String body;
    serializeJson(doc, body);

    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.POST(body);

    if (httpCode == 200) {
        String response = http.getString();
        Serial.println("[REG] Registered with backend: " + response);
        http.end();
        return true;
    } else {
        Serial.println("[REG] Registration failed (HTTP " + String(httpCode) + ")");
        http.end();
        return false;
    }
}

// ─── Servo Sweep ──────────────────────────────────────
void sweepServo() {
    servoAngle += servoDirection * 15;
    if (servoAngle >= 180) {
        servoAngle = 180;
        servoDirection = -1;
    } else if (servoAngle <= 0) {
        servoAngle = 0;
        servoDirection = 1;
    }
    servoMotor.write(servoAngle);
    Serial.println("[SERVO] Angle: " + String(servoAngle) + "°");
}

// ─── Send Telemetry ───────────────────────────────────
void sendTelemetry() {
    // Read DHT sensor
    float humidity    = dht.readHumidity();
    float temperature = dht.readTemperature();

    bool dhtValid = !isnan(humidity) && !isnan(temperature);
    if (!dhtValid) {
        Serial.println("[DHT] Failed to read sensor (check wiring)");
        humidity = 0;
        temperature = 0;
    } else {
        Serial.println("[DHT] Humidity: " + String(humidity) + "% | Temp: " + String(temperature) + "°C");
    }

    // Build telemetry JSON
    String url = "http://" + String(BACKEND_HOST) + ":" + String(BACKEND_PORT) + "/api/device/telemetry";

    StaticJsonDocument<1024> doc;
    doc["device_id"]   = DEVICE_ID;
    doc["ip"]          = WiFi.localIP().toString();
    doc["connections"] = 1;
    doc["bytes"]       = random(500, 5000);
    doc["protocol"]    = "TCP";

    // Sensor data
    JsonObject sensors = doc.createNestedObject("sensors");
    sensors["humidity"]    = humidity;
    sensors["temperature"] = temperature;

    // Actuator data
    JsonObject actuators = doc.createNestedObject("actuators");
    JsonObject servo = actuators.createNestedObject("servo");
    servo["angle"]  = servoAngle;
    servo["active"] = true;

    // Peripheral declarations (so backend registers them in topology)
    JsonArray peripherals = doc.createNestedArray("peripherals");

    JsonObject servoPeripheral = peripherals.createNestedObject();
    servoPeripheral["type"] = "servo";
    servoPeripheral["name"] = "Servo Motor (GPIO13)";
    JsonObject servoData = servoPeripheral.createNestedObject("data");
    servoData["angle"] = servoAngle;
    servoData["pin"]   = SERVO_PIN;

    JsonObject dhtPeripheral = peripherals.createNestedObject();
    dhtPeripheral["type"] = "humidity sensor";
    dhtPeripheral["name"] = "DHT11 Humidity Sensor";
    JsonObject dhtData = dhtPeripheral.createNestedObject("data");
    dhtData["humidity"]    = humidity;
    dhtData["temperature"] = temperature;
    dhtData["pin"]         = DHT_PIN;
    dhtData["valid"]       = dhtValid;

    String body;
    serializeJson(doc, body);

    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.POST(body);

    if (httpCode == 200) {
        String response = http.getString();
        Serial.println("[TEL] Telemetry sent OK: " + response);
    } else {
        Serial.println("[TEL] Telemetry failed (HTTP " + String(httpCode) + ")");
    }
    http.end();
}
