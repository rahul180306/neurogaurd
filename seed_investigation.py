from pymongo import MongoClient
from datetime import datetime

client = MongoClient("mongodb://ashwin:ashwin_hackathon@10.102.70.61:27017")
db = client.neuroguard

investigation = {
    "id": "INV-1090-ESP",
    "created": datetime.utcnow().isoformat(),
    "title": "ESP32 Lateral Movement Attempt",
    "summary": "AI subsystem detected anomalous rapid SYN flooding originating from a suspected compromised external endpoint towards 10.102.70.81 (ESP32 Node). Multiple unusual protocol deviations flagged.",
    "classification": "Port Scan / Lateral Action",
    "severity": "High",
    "riskScore": 88,
    "status": "in-progress",
    "evidence": {
        "suspiciousIPs": ["192.168.1.100"],
        "compromisedCredentials": False,
        "logsExtracted": 142
    },
    "affectedDevices": [
        {"id": "dev_esp32_1", "ip": "10.102.70.81", "type": "IoT Node"}
    ]
}

db.investigations.insert_one(investigation)
print("Seeded fake investigation!")
