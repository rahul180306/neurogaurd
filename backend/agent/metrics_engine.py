"""
NeuroGuard Metrics Engine
Unified SOC metrics aggregation across all collections.
"""

from typing import Dict, Any

try:
    from db import db, sync_db
except ImportError:
    db = None
    sync_db = None


def _empty_metrics() -> Dict[str, Any]:
    return {
        "devices": {"total": 0, "connected": 0, "blocked": 0},
        "threats": {"total": 0, "active": 0, "critical": 0},
        "investigations": {"total": 0, "open": 0},
        "reports": {"total": 0},
        "aiActions": 0,
    }


async def get_soc_metrics() -> Dict[str, Any]:
    """Single async call returning all key SOC metrics."""
    if db is None:
        return _empty_metrics()

    devices_total = await db.devices.count_documents({})
    devices_connected = await db.devices.count_documents({"connected": True})
    devices_blocked = await db.devices.count_documents({"blocked": True})
    threats_total = await db.threats.count_documents({})
    threats_active = await db.threats.count_documents({"status": "active"})
    threats_critical = await db.threats.count_documents({"severity": "Critical"})
    investigations_total = await db.investigations.count_documents({})
    investigations_open = await db.investigations.count_documents({"status": "in-progress"})
    reports_total = await db.reports.count_documents({})
    ai_actions = await db.ai_actions.count_documents({})

    return {
        "devices": {"total": devices_total, "connected": devices_connected, "blocked": devices_blocked},
        "threats": {"total": threats_total, "active": threats_active, "critical": threats_critical},
        "investigations": {"total": investigations_total, "open": investigations_open},
        "reports": {"total": reports_total},
        "aiActions": ai_actions,
    }
