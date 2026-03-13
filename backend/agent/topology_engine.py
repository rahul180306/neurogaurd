"""
NeuroGuard Network Topology Engine
Builds topology from real devices and correlates with threats.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import random

try:
    from db import sync_db, db
except ImportError:
    sync_db = None
    db = None

from device_registry import normalize_device_document, is_monitorable_device


DEVICE_TYPE_COLORS = {
    "router": {"bg": "bg-violet-500/20", "border": "border-violet-400/40", "text": "text-violet-300", "fill": "#8B5CF6"},
    "switch": {"bg": "bg-blue-500/20", "border": "border-blue-400/40", "text": "text-blue-300", "fill": "#3B82F6"},
    "gateway": {"bg": "bg-cyan-500/20", "border": "border-cyan-400/40", "text": "text-cyan-300", "fill": "#06B6D4"},
    "camera": {"bg": "bg-rose-500/20", "border": "border-rose-400/40", "text": "text-rose-300", "fill": "#F43F5E"},
    "sensor": {"bg": "bg-emerald-500/20", "border": "border-emerald-400/40", "text": "text-emerald-300", "fill": "#10B981"},
    "desktop": {"bg": "bg-amber-500/20", "border": "border-amber-400/40", "text": "text-amber-300", "fill": "#F59E0B"},
    "laptop": {"bg": "bg-amber-500/20", "border": "border-amber-400/40", "text": "text-amber-300", "fill": "#F59E0B"},
    "phone": {"bg": "bg-pink-500/20", "border": "border-pink-400/40", "text": "text-pink-300", "fill": "#EC4899"},
    "esp32": {"bg": "bg-orange-500/20", "border": "border-orange-400/40", "text": "text-orange-300", "fill": "#F97316"},
    "raspberry": {"bg": "bg-green-500/20", "border": "border-green-400/40", "text": "text-green-300", "fill": "#22C55E"},
    "unknown": {"bg": "bg-gray-500/20", "border": "border-gray-400/40", "text": "text-gray-300", "fill": "#9CA3AF"},
}


def _calculate_layout_position(device: Dict[str, Any], index: int, total: int) -> tuple[float, float]:
    """
    Deterministic layout based on device type and role.
    Core infrastructure near the center, edge devices distributed around.
    """
    device_type = device.get("type", "unknown").lower()
    
    # Core infrastructure (routers, switches, gateways) → center
    if device_type in {"router", "switch", "gateway"}:
        if index == 0:
            return (50.0, 22.0)  # Top center
        elif total == 1:
            return (50.0, 45.0)  # Center
        else:
            # Distribute horizontally near top
            x = 30.0 + (index * (40.0 / max(1, total - 1)))
            return (x, 35.0)
    
    # Edge devices distributed around perimeter
    angle = (index / max(1, total - 1)) * 360 if total > 1 else 0
    radius = 25.0  # Distance from center
    
    import math
    x = 50.0 + radius * math.cos(math.radians(angle))
    y = 50.0 + radius * math.sin(math.radians(angle))
    
    # Clamp to safe bounds
    x = max(15.0, min(85.0, x))
    y = max(25.0, min(85.0, y))
    
    return (x, y)


def _build_topology_node(device: Dict[str, Any], position: tuple[float, float]) -> Dict[str, Any]:
    """Create a topology node from a device."""
    device_type = device.get("type", "unknown").lower()
    colors = DEVICE_TYPE_COLORS.get(device_type, DEVICE_TYPE_COLORS["unknown"])
    
    # Calculate threat score from device status
    threat_score = 0
    if device.get("blocked"):
        threat_score = 100
    elif not device.get("connected"):
        threat_score = 50
    elif not device.get("monitor"):
        threat_score = 30
    
    status = device.get("status", "detected")
    if status == "connected":
        status_label = "online"
    elif status == "blocked":
        status_label = "offline"
    else:
        status_label = "warning"
    
    return {
        "id": device.get("device_id"),
        "name": device.get("name", "Unknown Device"),
        "type": device.get("type", "unknown").title(),
        "ip": device.get("ip"),
        "mac": device.get("mac"),
        "status": status_label,
        "threatScore": threat_score,
        "lastActivity": _format_last_seen(device.get("last_seen")),
        "x": position[0],
        "y": position[1],
        "colors": colors,
    }


def _format_last_seen(timestamp: Optional[str]) -> str:
    """Format last seen timestamp into human-readable string."""
    if not timestamp:
        return "Unknown"
    
    try:
        last_seen = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        now = datetime.utcnow()
        delta = now - last_seen.replace(tzinfo=None)
        
        seconds = int(delta.total_seconds())
        if seconds < 5:
            return "Just now"
        elif seconds < 60:
            return f"{seconds}s ago"
        elif seconds < 3600:
            return f"{seconds // 60}m ago"
        elif seconds < 86400:
            return f"{seconds // 3600}h ago"
        else:
            return f"{seconds // 86400}d ago"
    except Exception:
        return "Unknown"


def _build_device_links(devices: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Build network links based on device hierarchy.
    Routers/switches/gateways connect to edge devices.
    """
    links = []
    
    # Separate core infrastructure from edge devices
    core_devices = [d for d in devices if d.get("type", "").lower() in {"router", "switch", "gateway"}]
    edge_devices = [d for d in devices if d.get("type", "").lower() not in {"router", "switch", "gateway"}]
    
    if not core_devices:
        return links
    
    # Primary core device (usually first router/gateway)
    primary_core = core_devices[0]
    
    # Connect all edge devices to primary core
    for edge in edge_devices:
        links.append({
            "id": f"L_{primary_core['device_id']}_{edge['device_id']}",
            "from": primary_core.get("device_id"),
            "to": edge.get("device_id"),
            "flows": 2,
            "suspicious": False,
        })
    
    # Connect core devices to each other (if multiple)
    for i, core in enumerate(core_devices[1:], 1):
        links.append({
            "id": f"L_{primary_core['device_id']}_{core['device_id']}",
            "from": primary_core.get("device_id"),
            "to": core.get("device_id"),
            "flows": 5,
            "suspicious": False,
        })
    
    return links


def _correlate_threats_to_links(links: List[Dict[str, Any]], threats: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Mark links as suspicious based on threat data.
    Increase flow count for links associated with threats.
    """
    threat_targets = {}
    
    # Build threat target lookup
    for threat in threats:
        target = threat.get("targetDevice") or threat.get("device")
        if target:
            severity = (threat.get("severity") or "low").lower()
            threat_targets[target] = {
                "severity": severity,
                "type": threat.get("type") or threat.get("attack_type"),
                "count": threat_targets.get(target, {}).get("count", 0) + 1,
            }
    
    # Update links
    for link in links:
        to_device = link.get("to")
        if to_device in threat_targets:
            threat_info = threat_targets[to_device]
            link["suspicious"] = threat_info["severity"] in {"critical", "high"}
            link["flows"] = min(12, link["flows"] + threat_info["count"])
            link["severity"] = threat_info["severity"]
            link["attackType"] = threat_info["type"]
    
    return links


async def build_topology(connected_only: bool = True) -> Dict[str, Any]:
    """
    Build network topology from real devices and threats.
    
    Returns:
        {
            "nodes": [...],  # Device nodes with position
            "links": [...],  # Network links between devices
            "stats": {...}   # Summary statistics
        }
    """
    if db is None:
        return {"nodes": [], "links": [], "stats": {}}
    
    # Fetch connected devices
    query = {"connected": True} if connected_only else {}
    devices_cursor = db.devices.find(query).sort("type", 1)
    
    devices = []
    async for device in devices_cursor:
        normalized = normalize_device_document(device, "devices")
        devices.append(normalized)
    
    if not devices:
        return {"nodes": [], "links": [], "stats": {"totalNodes": 0, "totalLinks": 0, "suspiciousLinks": 0}}
    
    # Build topology nodes with layout
    nodes = []
    for index, device in enumerate(devices):
        position = _calculate_layout_position(device, index, len(devices))
        node = _build_topology_node(device, position)
        nodes.append(node)
    
    # Build device links
    links = _build_device_links(devices)
    
    # Fetch recent threats for correlation
    threats_cursor = db.threats.find().sort("timestamp", -1).limit(50)
    threats = []
    async for threat in threats_cursor:
        threats.append(threat)
    
    # Correlate threats to links
    links = _correlate_threats_to_links(links, threats)
    
    # Calculate stats
    suspicious_links = sum(1 for link in links if link.get("suspicious"))
    
    return {
        "nodes": nodes,
        "links": links,
        "stats": {
            "totalNodes": len(nodes),
            "totalLinks": len(links),
            "suspiciousLinks": suspicious_links,
            "totalFlows": sum(link.get("flows", 0) for link in links),
        }
    }


def build_topology_sync(connected_only: bool = True) -> Dict[str, Any]:
    """Synchronous version for testing."""
    if sync_db is None:
        return {"nodes": [], "links": [], "stats": {}}
    
    # Fetch connected devices
    query = {"connected": True} if connected_only else {}
    devices_cursor = sync_db.devices.find(query).sort("type", 1)
    
    devices = [normalize_device_document(device, "devices") for device in devices_cursor]
    
    if not devices:
        return {"nodes": [], "links": [], "stats": {"totalNodes": 0, "totalLinks": 0, "suspiciousLinks": 0}}
    
    # Build topology nodes with layout
    nodes = []
    for index, device in enumerate(devices):
        position = _calculate_layout_position(device, index, len(devices))
        node = _build_topology_node(device, position)
        nodes.append(node)
    
    # Build device links
    links = _build_device_links(devices)
    
    # Fetch recent threats
    threats = list(sync_db.threats.find().sort("timestamp", -1).limit(50))
    
    # Correlate threats to links
    links = _correlate_threats_to_links(links, threats)
    
    # Calculate stats
    suspicious_links = sum(1 for link in links if link.get("suspicious"))
    
    return {
        "nodes": nodes,
        "links": links,
        "stats": {
            "totalNodes": len(nodes),
            "totalLinks": len(links),
            "suspiciousLinks": suspicious_links,
            "totalFlows": sum(link.get("flows", 0) for link in links),
        }
    }
