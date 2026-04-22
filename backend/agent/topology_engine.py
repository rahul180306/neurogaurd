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
    "servo": {"bg": "bg-yellow-500/20", "border": "border-yellow-400/40", "text": "text-yellow-300", "fill": "#EAB308"},
    "humidity sensor": {"bg": "bg-teal-500/20", "border": "border-teal-400/40", "text": "text-teal-300", "fill": "#14B8A6"},
    "unknown": {"bg": "bg-gray-500/20", "border": "border-gray-400/40", "text": "text-gray-300", "fill": "#9CA3AF"},
}


def _calculate_layout_position(device: Dict[str, Any], index: int, total: int, parent_pos: Optional[tuple] = None) -> tuple[float, float]:
    """
    Deterministic layout based on device type and role.
    Core infrastructure near the center, edge devices distributed around.
    Sub-devices positioned near their parent.
    """
    device_type = device.get("type", "unknown").lower()

    # Sub-devices (servo, humidity sensor) cluster near parent
    if device_type in {"servo motor", "servo", "humidity sensor"} and parent_pos:
        import math
        sub_index = device.get("_sub_index", 0)
        # Fan out below/beside the parent
        angle = -50 + sub_index * 100
        radius = 16.0
        x = parent_pos[0] + radius * math.cos(math.radians(angle))
        y = parent_pos[1] + radius * math.sin(math.radians(angle))
        x = max(5.0, min(95.0, x))
        y = max(15.0, min(95.0, y))
        return (x, y)

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
    angle = (index / max(1, total)) * 360
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
    Sub-devices (servo, humidity sensor) connect to their parent ESP32.
    """
    links = []
    sub_device_types = {"servo motor", "servo", "humidity sensor"}

    # Separate core infrastructure, edge devices, and sub-devices
    core_devices = [d for d in devices if d.get("type", "").lower() in {"router", "switch", "gateway"}]
    sub_devices = [d for d in devices if d.get("type", "").lower() in sub_device_types]
    edge_devices = [d for d in devices if d.get("type", "").lower() not in {"router", "switch", "gateway"} and d.get("type", "").lower() not in sub_device_types]

    if core_devices:
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
    else:
        # Fallback if no router: find Pi and use it as core
        pi_device = next((d for d in edge_devices if "pi" in str(d.get("name", "")).lower() or d.get("type") == "raspberry_pi"), None)
        if pi_device:
            for edge in edge_devices:
                if edge["device_id"] != pi_device["device_id"]:
                    links.append({
                        "id": f"L_{pi_device['device_id']}_{edge['device_id']}",
                        "from": pi_device.get("device_id"),
                        "to": edge.get("device_id"),
                        "flows": 2,
                        "suspicious": False,
                    })

    # Connect sub-devices to their parent ESP32
    esp32_devices = [d for d in edge_devices if d.get("type", "").lower() == "esp32"]
    for sub in sub_devices:
        parent_id = sub.get("parent_device_id")
        # Find the parent ESP32 by parent_device_id or default to first ESP32
        parent = None
        if parent_id:
            parent = next((d for d in esp32_devices if d.get("device_id") == parent_id), None)
        if not parent and esp32_devices:
            parent = esp32_devices[0]

        if parent:
            links.append({
                "id": f"L_{parent['device_id']}_{sub['device_id']}",
                "from": parent.get("device_id"),
                "to": sub.get("device_id"),
                "flows": 1,
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
    Build network topology from real devices, sub-devices, and threats.

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

    # Fetch sub-devices (peripherals connected to ESP32s)
    sub_devices_raw = []
    try:
        peripherals_cursor = db.device_peripherals.find({"active": True})
        async for peripheral in peripherals_cursor:
            sub_devices_raw.append(peripheral)
    except Exception:
        pass

    # Build topology nodes with layout — first pass for main devices
    nodes = []
    device_positions = {}  # device_id -> (x, y) for parent lookup
    sub_device_types = {"servo motor", "servo", "humidity sensor"}

    # Separate main devices from any sub-devices that might be in the devices collection
    main_devices = [d for d in devices if d.get("type", "").lower() not in sub_device_types]

    for index, device in enumerate(main_devices):
        position = _calculate_layout_position(device, index, len(main_devices))
        node = _build_topology_node(device, position)
        nodes.append(node)
        device_positions[device.get("device_id")] = position

    # Build sub-device nodes from peripherals collection
    for sub_index, peripheral in enumerate(sub_devices_raw):
        parent_id = peripheral.get("device_id")
        parent_pos = device_positions.get(parent_id)

        sub_device = {
            "device_id": peripheral.get("peripheral_id", f"sub_{sub_index}"),
            "name": peripheral.get("name", "Peripheral"),
            "type": peripheral.get("peripheral_type", peripheral.get("type", "unknown")).replace("_", " "),
            "ip": peripheral.get("parent_ip", ""),
            "mac": "",
            "status": "connected" if peripheral.get("active") else "detected",
            "connected": peripheral.get("active", False),
            "blocked": False,
            "monitor": True,
            "parent_device_id": parent_id,
            "_sub_index": sub_index,
        }

        position = _calculate_layout_position(sub_device, sub_index, len(sub_devices_raw), parent_pos=parent_pos)
        node = _build_topology_node(sub_device, position)
        nodes.append(node)

        # Add to devices list for link building
        devices.append(sub_device)

    # Build device links (including sub-device → ESP32 links)
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
