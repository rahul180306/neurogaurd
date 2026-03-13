"""
NeuroGuard Network Logs Service
Centralized network event logging for security, lifecycle, and AI events.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

try:
    from db import sync_db, db
except ImportError:
    sync_db = None
    db = None


async def log_event(
    event_type: str,
    level: str,
    message: str,
    device_id: Optional[str] = None,
    source_ip: Optional[str] = None,
    related_threat_id: Optional[str] = None,
    **kwargs
) -> None:
    """
    Log a network event to MongoDB.
    
    Args:
        event_type: Type of event (security, event, ai, system)
        level: Severity level (critical, warning, info)
        message: Human-readable event message
        device_id: Related device ID
        source_ip: Source IP address
        related_threat_id: Related threat ID if applicable
        **kwargs: Additional metadata
    """
    if db is None:
        return
    
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "type": event_type,
        "level": level,
        "message": message,
        "device_id": device_id,
        "source_ip": source_ip,
        "related_threat_id": related_threat_id,
        **kwargs
    }
    
    await db.network_logs.insert_one(log_entry)


def log_event_sync(
    event_type: str,
    level: str,
    message: str,
    device_id: Optional[str] = None,
    source_ip: Optional[str] = None,
    related_threat_id: Optional[str] = None,
    **kwargs
) -> None:
    """Synchronous version for non-async contexts."""
    if sync_db is None:
        return
    
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "type": event_type,
        "level": level,
        "message": message,
        "device_id": device_id,
        "source_ip": source_ip,
        "related_threat_id": related_threat_id,
        **kwargs
    }
    
    sync_db.network_logs.insert_one(log_entry)


async def get_recent_logs(limit: int = 50, event_type: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Fetch recent network logs.
    
    Args:
        limit: Maximum number of logs to return
        event_type: Optional filter by event type
    
    Returns:
        List of log entries with formatted timestamps
    """
    if db is None:
        # Return sample logs for demo
        return [
            {"time": "19:24:58", "type": "security", "msg": "Network scanner discovered 3 new devices"},
            {"time": "19:24:45", "type": "ai", "msg": "AI analyzing traffic patterns — baseline established"},
            {"time": "19:24:30", "type": "event", "msg": "Device lifecycle transition: detected → connected"},
            {"time": "19:24:12", "type": "security", "msg": "Threat monitoring active on 10 connected devices"},
            {"time": "19:23:55", "type": "ai", "msg": "Anomaly detection enabled — learning network behavior"},
        ]
    
    query = {"type": event_type} if event_type else {}
    cursor = db.network_logs.find(query).sort("timestamp", -1).limit(limit)
    
    logs = []
    async for log in cursor:
        # Format timestamp as HH:MM:SS
        try:
            ts = datetime.fromisoformat(log["timestamp"].replace("Z", "+00:00"))
            time_str = ts.strftime("%H:%M:%S")
        except Exception:
            time_str = "00:00:00"
        
        logs.append({
            "time": time_str,
            "type": log.get("type", "system"),
            "msg": log.get("message", ""),
            "device_id": log.get("device_id"),
            "source_ip": log.get("source_ip"),
            "level": log.get("level", "info"),
        })
    
    return logs


def get_recent_logs_sync(limit: int = 50, event_type: Optional[str] = None) -> List[Dict[str, Any]]:
    """Synchronous version for testing."""
    if sync_db is None:
        return [
            {"time": "19:24:58", "type": "security", "msg": "Network scanner discovered 3 new devices"},
            {"time": "19:24:45", "type": "ai", "msg": "AI analyzing traffic patterns — baseline established"},
            {"time": "19:24:30", "type": "event", "msg": "Device lifecycle transition: detected → connected"},
            {"time": "19:24:12", "type": "security", "msg": "Threat monitoring active on 10 connected devices"},
            {"time": "19:23:55", "type": "ai", "msg": "Anomaly detection enabled — learning network behavior"},
        ]
    
    query = {"type": event_type} if event_type else {}
    cursor = sync_db.network_logs.find(query).sort("timestamp", -1).limit(limit)
    
    logs = []
    for log in cursor:
        try:
            ts = datetime.fromisoformat(log["timestamp"].replace("Z", "+00:00"))
            time_str = ts.strftime("%H:%M:%S")
        except Exception:
            time_str = "00:00:00"
        
        logs.append({
            "time": time_str,
            "type": log.get("type", "system"),
            "msg": log.get("message", ""),
            "device_id": log.get("device_id"),
            "source_ip": log.get("source_ip"),
            "level": log.get("level", "info"),
        })
    
    return logs


async def log_scanner_discovery(device_id: str, ip: str, vendor: Optional[str] = None):
    """Log when scanner discovers a new device."""
    msg = f"Network scanner discovered device {device_id} at {ip}"
    if vendor:
        msg += f" (vendor: {vendor})"
    await log_event("event", "info", msg, device_id=device_id, source_ip=ip)


async def log_threat_detection(threat_id: str, device_id: str, attack_type: str, severity: str):
    """Log when a threat is detected."""
    msg = f"{severity.title()} threat detected: {attack_type.replace('_', ' ')} on device {device_id}"
    await log_event("security", "critical" if severity in {"critical", "high"} else "warning", msg, 
                   device_id=device_id, related_threat_id=threat_id)


async def log_ai_analysis(device_id: str, prediction: str, confidence: float):
    """Log AI prediction or analysis."""
    msg = f"AI predicted {prediction.replace('_', ' ')} attack with {int(confidence * 100)}% confidence"
    await log_event("ai", "warning", msg, device_id=device_id)


async def log_lifecycle_transition(device_id: str, old_status: str, new_status: str):
    """Log device lifecycle transitions."""
    msg = f"Device {device_id} transitioned from {old_status} to {new_status}"
    await log_event("event", "info", msg, device_id=device_id)
