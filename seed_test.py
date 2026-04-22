import requests
import time

base_url = "http://10.102.70.61:8000"

print("1. Injecting a test threat...")
payload = {
    "source_ip": "192.168.1.100",
    "target_device": "10.102.70.81",
    "attack_type": "port_scan",
    "description": "Simulated rigorous Port Scan targeting ESP32 IoT node from external address.",
    "threat_score": 85.0
}

r = requests.post(f"{base_url}/api/threats/detect", json=payload)
print(r.text)

print("2. Fetching threats to extract the ID...")
time.sleep(1.5)
threats = requests.get(f"{base_url}/api/threats").json()
threat_id = threats[0]["_id"] if threats and len(threats) > 0 and "_id" in threats[0] else None

if threat_id:
    print(f"3. Auto-generating investigation for threat {threat_id}...")
    r2 = requests.post(f"{base_url}/api/investigations/generate?threat_id={threat_id}")
    print(r2.text)
else:
    print("Could not find threat! Dump:", threats)
