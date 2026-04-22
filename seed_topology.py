from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017/?appName=Neurogaurddb")
db = client["neurogaurd"]

db.devices.insert_many([
    {
        "device_id": "raspberry_pi_node",
        "name": "Raspberry Pi 4",
        "type": "raspberry_pi",
        "type_guess": "raspberry_pi",
        "ip": "10.102.70.61",
        "mac": "DC:A6:32:00:11:22",
        "connected": True,
        "trusted": True
    },
    {
        "device_id": "esp32_neuroguard_01",
        "name": "ESP32 NeuroGuard Node",
        "type": "esp32",
        "type_guess": "esp32",
        "ip": "10.102.70.178",
        "mac": "B4:E6:2D:XX:YY:ZZ",
        "connected": True,
        "trusted": True
    }
])

db.device_peripherals.insert_many([
    {
        "device_id": "esp32_neuroguard_01",
        "peripheral_type": "humidity_sensor",
        "name": "Humidity Sensor",
        "active": True
    },
    {
        "device_id": "esp32_neuroguard_01",
        "peripheral_type": "servo_motor",
        "name": "Servo Motor",
        "active": True
    }
])
print("Successfully seeded topology!")