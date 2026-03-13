"""
NeuroGuard Timeline Engine
Unified SOC event timeline — records and queries all system events.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any

try:
    from db import db
except ImportError:
    db = None


async def record_event(
    event_type: str,
    details: dict,
    severity: str = "info",
    device_id: Optional[str] = None,
    source_ip: Optional[str] = None,
    summary: Optional[str] = None,
) -> None:
    """Record a SOC event to the timeline."""
    if db is None:
        return

    event = {
        "type": event_type,
        "details": details,
        "timestamp": datetime.utcnow().isoformat(),
        "severity": severity,
        "device_id": device_id,
        "source_ip": source_ip,
        "summary": summary or f"{event_type.replace('_', ' ').title()} event",
    }
    await db.events.insert_one(event)


async def get_events(
    limit: int = 50,
    event_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Query timeline events with optional type filter."""
    if db is None:
        return []

    query = {"type": event_type} if event_type else {}
    cursor = db.events.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit)
    events = []
    async for event in cursor:
        events.append(event)
    return events
