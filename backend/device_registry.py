from copy import deepcopy
import re
from typing import Any, Dict, Iterable, Optional


SUPPORTED_DEVICE_TYPES = {
    "camera",
    "router",
    "sensor",
    "desktop",
    "laptop",
    "phone",
    "esp32",
    "raspberry",
    "unknown",
}

DEVICE_IMAGE_MAP = {
    "camera": "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/video.svg",
    "router": "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/router.svg",
    "sensor": "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/activity.svg",
    "desktop": "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/monitor.svg",
    "laptop": "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/laptop.svg",
    "phone": "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/smartphone.svg",
    "esp32": "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/cpu.svg",
    "raspberry": "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/server.svg",
    "unknown": "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/help-circle.svg",
}


def normalize_device_type(value: Optional[str], fallback: str = "unknown") -> str:
    normalized = (value or fallback).strip().lower()
    return normalized if normalized in SUPPORTED_DEVICE_TYPES else fallback


def normalize_mac_key(mac: Optional[str]) -> Optional[str]:
    if not mac:
        return None
    compact = re.sub(r"[^0-9A-Fa-f]", "", mac).upper()
    if len(compact) != 12:
        return None
    return compact


def build_device_id(mac: Optional[str], ip: Optional[str]) -> str:
    normalized_mac = normalize_mac_key(mac)
    if normalized_mac:
        return f"device_{normalized_mac.lower()}"
    safe_ip = (ip or "unknown").replace(".", "_")
    return f"unknown_{safe_ip}"


def default_device_name(device_type: Optional[str], hostname: Optional[str], vendor: Optional[str]) -> str:
    if hostname:
        sanitized = re.sub(r"[-_.]+", " ", hostname).strip()
        if sanitized:
            return sanitized.title()
    if vendor:
        return vendor.strip()
    normalized_type = normalize_device_type(device_type)
    return f"{normalized_type.title()} Device" if normalized_type != "unknown" else "Connected Device"


def normalize_device_document(document: Dict[str, Any], source: Optional[str] = None) -> Dict[str, Any]:
    normalized = deepcopy(document)
    legacy_status = (normalized.get("status") or "").lower()
    blocked = bool(normalized.get("blocked", False))
    connected = bool(
        normalized.get("connected", False)
        or legacy_status in {"online", "warning", "connected", "under_attack", "suspicious", "monitoring", "safe"}
    )
    trusted = bool(normalized.get("trusted", False) or normalized.get("auto_connect", False))
    auto_connect = bool(normalized.get("auto_connect", False))
    monitor = bool(normalized.get("monitor", connected and not blocked))

    if blocked:
        status = "blocked"
        connected = False
        monitor = False
    elif connected:
        status = "connected"
    else:
        status = "detected"

    normalized["status"] = status
    normalized["connected"] = connected
    normalized["trusted"] = trusted
    normalized["auto_connect"] = auto_connect
    normalized["monitor"] = monitor
    normalized["blocked"] = blocked
    normalized["type"] = normalize_device_type(normalized.get("type"), fallback=normalize_device_type(normalized.get("type_guess")))
    normalized["type_guess"] = normalize_device_type(normalized.get("type_guess"))
    normalized["device_id"] = normalized.get("device_id") or build_device_id(normalized.get("mac"), normalized.get("ip"))
    normalized["source_collection"] = source or normalized.get("source_collection")
    return normalized


def build_detected_device(
    base: Dict[str, Any],
    timestamp: str,
    existing: Optional[Dict[str, Any]] = None,
    *,
    trusted: bool = False,
    auto_connect: bool = False,
    blocked: bool = False,
) -> Dict[str, Any]:
    existing = existing or {}
    normalized_type_guess = normalize_device_type(base.get("type_guess"))
    device = {
        "device_id": base.get("device_id") or build_device_id(base.get("mac"), base.get("ip")),
        "name": existing.get("name") or default_device_name(normalized_type_guess, base.get("hostname"), base.get("vendor")),
        "type": normalize_device_type(existing.get("type"), fallback=normalized_type_guess),
        "ip": base.get("ip"),
        "mac": base.get("mac") or "unknown",
        "hostname": base.get("hostname"),
        "vendor": base.get("vendor"),
        "type_guess": normalized_type_guess,
        "status": "blocked" if blocked else "detected",
        "connected": False,
        "trusted": bool(trusted or existing.get("trusted", False) or existing.get("auto_connect", False)),
        "monitor": False,
        "blocked": blocked,
        "auto_connect": bool(auto_connect or existing.get("auto_connect", False)),
        "cpu": existing.get("cpu", __import__("random").randint(1, 45)),
        "network_usage": existing.get("network_usage", 0),
        "connections": existing.get("connections", 0),
        "first_seen": existing.get("first_seen") or timestamp,
        "last_seen": timestamp,
        "online": False,
        "health": existing.get("health", 100),
        "blocked_at": existing.get("blocked_at") if blocked else None,
        "blocked_reason": existing.get("blocked_reason") if blocked else None,
    }
    return device


def build_connected_device(
    base: Dict[str, Any],
    timestamp: str,
    *,
    name: Optional[str] = None,
    device_type: Optional[str] = None,
    trusted: bool = False,
    auto_connect: bool = False,
    existing: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    existing = existing or {}
    normalized_type_guess = normalize_device_type(base.get("type_guess"))
    final_type = normalize_device_type(device_type or existing.get("type"), fallback=normalized_type_guess)
    device = {
        "device_id": base.get("device_id") or build_device_id(base.get("mac"), base.get("ip")),
        "name": (name or existing.get("name") or default_device_name(final_type, base.get("hostname"), base.get("vendor"))).strip(),
        "type": final_type,
        "ip": base.get("ip"),
        "mac": base.get("mac") or "unknown",
        "hostname": base.get("hostname"),
        "vendor": base.get("vendor"),
        "type_guess": normalized_type_guess,
        "status": "connected",
        "connected": True,
        "trusted": bool(trusted or existing.get("trusted", False) or auto_connect or existing.get("auto_connect", False)),
        "monitor": True,
        "blocked": False,
        "auto_connect": bool(auto_connect or existing.get("auto_connect", False)),
        "cpu": existing.get("cpu", __import__("random").randint(1, 45)),
        "network_usage": existing.get("network_usage", 0),
        "connections": existing.get("connections", 0),
        "first_seen": existing.get("first_seen") or timestamp,
        "last_seen": timestamp,
        "online": True,
        "health": existing.get("health", 100),
        "blocked_at": None,
        "blocked_reason": None,
    }
    return device


def build_dashboard_metrics(devices: Iterable[Dict[str, Any]], *, threats: int, telemetry_events: int, predictions: int, trusted_count: int) -> Dict[str, int]:
    materialized = [normalize_device_document(device) for device in devices]
    blocked_count = sum(1 for device in materialized if device.get("blocked"))
    connected_count = sum(1 for device in materialized if device.get("connected"))
    detected_count = sum(1 for device in materialized if device.get("status") == "detected")
    monitored_count = sum(1 for device in materialized if device.get("monitor"))

    return {
        "devices": connected_count,
        "connected": connected_count,
        "detected": detected_count,
        "blocked": blocked_count,
        "trusted": trusted_count,
        "monitored": monitored_count,
        "threats": threats,
        "telemetry_events": telemetry_events,
        "predictions": predictions,
    }


def is_monitorable_device(device: Optional[Dict[str, Any]]) -> bool:
    if not device:
        return False
    normalized = normalize_device_document(device)
    return bool(normalized.get("connected") and normalized.get("monitor") and not normalized.get("blocked"))