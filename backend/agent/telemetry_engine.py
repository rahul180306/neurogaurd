"""
NeuroGuard Telemetry Engine
Core telemetry pipeline: normalize → store → flow → analyze → predict.
"""

from datetime import datetime
from typing import Dict, Any, Optional

try:
    from db import db
except ImportError:
    db = None

from agent.threat_analyzer import analyze_threat, predict_attack
from agent.traffic_engine import generate_flow
from agent.event_dispatcher import dispatch


async def process_telemetry(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Core telemetry pipeline.
    Normalizes data, stores in MongoDB, generates flow record,
    runs threat analysis and prediction.
    """
    # Normalize fields
    timestamp = data.get("timestamp") or datetime.utcnow().isoformat()
    device_id = data.get("device_id", "unknown")
    ip = data.get("source_ip") or data.get("sourceIp") or data.get("ip") or "unknown"
    connections = data.get("connections", 0)
    network_usage = data.get("network_usage", 0)
    raw_bytes = data.get("bytes", int(network_usage * 1024 * 1024))
    protocol = data.get("protocol", "TCP")

    telemetry_doc = {
        "device_id": device_id,
        "ip": ip,
        "connections": connections,
        "bytes": raw_bytes,
        "protocol": protocol,
        "network_usage": network_usage,
        "timestamp": timestamp,
    }

    # Preserve lat/lng if present (for threat geo)
    if "lat" in data:
        telemetry_doc["lat"] = data["lat"]
    if "lng" in data:
        telemetry_doc["lng"] = data["lng"]
    if "sourceIp" in data:
        telemetry_doc["sourceIp"] = data["sourceIp"]
    if "source_ip" in data:
        telemetry_doc["source_ip"] = data["source_ip"]

    # Store in telemetry collection
    if db is not None:
        await db.telemetry.insert_one(telemetry_doc)

    # Generate network flow record
    generate_flow(data)

    # Run threat analysis (synchronous)
    threat = analyze_threat(data)
    prediction = predict_attack()

    # Fire async event for timeline recording
    if threat is not None:
        await dispatch("threat_created", threat)

    return {
        "status": "received",
        "message": "Telemetry processed through pipeline",
        "threat_detected": threat is not None,
        "prediction_generated": prediction is not None,
        "threat": threat,
        "prediction": prediction,
    }
