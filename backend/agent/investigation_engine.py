"""
NeuroGuard Investigation Engine
Automatically builds forensic investigations from detected threats.
Correlates devices, topology, logs, and AI analysis into comprehensive case files.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import hashlib
import random

try:
    from db import db, sync_db
except ImportError:
    db = None
    sync_db = None

from device_registry import normalize_device_document, is_monitorable_device
from agent.ai_engine import invoke_autonomous_agent


def _generate_investigation_id(threat_id: str) -> str:
    """Generate unique investigation ID from threat."""
    timestamp = datetime.utcnow()
    return f"INV-{timestamp.year}-{abs(hash(threat_id)) % 10000:04d}"


def _classify_attack_vector(threat_type: str) -> str:
    """Classify attack vector for investigation."""
    classification_map = {
        "port_scan": "Network Reconnaissance Campaign",
        "ddos_attempt": "Distributed Denial of Service",
        "data_exfiltration": "Data Breach Campaign",
        "brute_force": "Credential Compromise Attack",
        "malware_detected": "Malware Infection Campaign",
        "suspicious_activity": "Anomalous Behavior Pattern",
        "iot_botnet": "IoT Botnet Compromise",
        "firmware_exploit": "Firmware Exploitation Campaign",
    }
    return classification_map.get(threat_type, "Coordinated Multi-Vector Attack")


def _correlate_affected_devices(threat: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Find all devices affected by this threat."""
    if sync_db is None:
        return []
    
    affected = []
    target_device_id = threat.get("targetDevice", "")
    source_ip = threat.get("sourceIp", "")
    
    # Primary target device
    target_device = sync_db.devices.find_one({"device_id": target_device_id})
    if target_device:
        affected.append({
            "name": target_device.get("name", target_device_id),
            "type": target_device.get("type", "Unknown"),
            "ip": target_device.get("ip", ""),
            "mac": target_device.get("mac", ""),
            "status": "compromised" if threat.get("severity") in ["Critical", "High"] else "at-risk",
            "device_id": target_device_id,
        })
    
    # Find related devices on same subnet or with similar attack patterns
    target_ip = target_device.get("ip", "") if target_device else ""
    if target_ip:
        subnet_prefix = ".".join(target_ip.split(".")[:3])
        related_devices = sync_db.devices.find({
            "ip": {"$regex": f"^{subnet_prefix}"},
            "device_id": {"$ne": target_device_id},
            "connected": True,
        }).limit(5)
        
        for device in related_devices:
            if len(affected) >= 5:  # Limit to 5 devices for UI
                break
            affected.append({
                "name": device.get("name", device.get("device_id")),
                "type": device.get("type", "Unknown"),
                "ip": device.get("ip", ""),
                "mac": device.get("mac", ""),
                "status": "at-risk",
                "device_id": device.get("device_id"),
            })
    
    return affected


def _collect_evidence(threat: Dict[str, Any], affected_devices: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Collect forensic evidence from threat and related sources."""
    if sync_db is None:
        return {
            "suspiciousIPs": [],
            "malwareIndicators": [],
            "anomalies": [],
        }
    
    source_ip = threat.get("sourceIp", "unknown")
    
    # Suspicious IPs
    suspicious_ips = []
    if source_ip and source_ip != "unknown":
        # Count attacks from this IP
        threat_count = sync_db.threats.count_documents({"sourceIp": source_ip})
        suspicious_ips.append({
            "ip": source_ip,
            "origin": _geolocate_ip(source_ip),
            "attackCount": threat_count,
        })
    
    # Find other attacking IPs in recent threats
    recent_threats = sync_db.threats.find({
        "timestamp": {"$gte": (datetime.utcnow() - timedelta(hours=1)).isoformat()},
        "sourceIp": {"$ne": source_ip, "$ne": "unknown"},
    }).limit(3)
    
    for t in recent_threats:
        ip = t.get("sourceIp")
        if ip and ip not in [s["ip"] for s in suspicious_ips]:
            suspicious_ips.append({
                "ip": ip,
                "origin": _geolocate_ip(ip),
                "attackCount": sync_db.threats.count_documents({"sourceIp": ip}),
            })
    
    # Malware indicators (simulated for MVP - would integrate with real malware DB)
    malware_indicators = []
    if threat.get("type") in ["malware_detected", "data_exfiltration", "ddos_attempt"]:
        # Generate plausible malware hash
        threat_id = str(threat.get("_id", ""))
        hash_input = f"{source_ip}{threat.get('type')}{threat_id}"
        file_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:10] + "..."
        
        malware_indicators.append({
            "hash": file_hash,
            "type": _infer_malware_family(threat.get("type")),
            "conf": random.randint(75, 95),
        })
    
    # Network anomalies
    anomalies = []
    if threat.get("type") == "port_scan":
        anomalies.append("Rapid port scanning detected on subnet")
    if threat.get("type") == "ddos_attempt":
        anomalies.append(f"SYN flood from {source_ip}")
    if threat.get("type") == "data_exfiltration":
        anomalies.append("Abnormal outbound data volume")
        anomalies.append("Encrypted C2 channel suspected")
    
    # Check for subnet-wide issues
    if len(affected_devices) > 1:
        anomalies.append(f"Lateral movement across {len(affected_devices)} devices")
    
    return {
        "suspiciousIPs": suspicious_ips,
        "malwareIndicators": malware_indicators,
        "anomalies": anomalies,
    }


def _build_timeline(threat: Dict[str, Any], affected_devices: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Build investigation timeline from logs and threat data."""
    if sync_db is None:
        return []
    
    timeline = []
    threat_time = datetime.fromisoformat(threat.get("timestamp", datetime.utcnow().isoformat()).replace("Z", ""))
    
    # Initial detection
    timeline.append({
        "time": threat_time.strftime("%H:%M"),
        "event": f"AI detected {threat.get('type', 'suspicious activity').replace('_', ' ')}",
        "type": "system",
        "icon": "🔍",
    })
    
    # Attack details
    timeline.append({
        "time": (threat_time + timedelta(minutes=3)).strftime("%H:%M"),
        "event": threat.get("description", "Threat event recorded"),
        "type": "alert",
        "icon": "⚡",
    })
    
    # Auto-response action
    if threat.get("severity") in ["Critical", "High"]:
        timeline.append({
            "time": (threat_time + timedelta(minutes=5)).strftime("%H:%M"),
            "event": f"{threat.get('sourceIp', 'Source')} auto-blocked by AI firewall",
            "type": "response",
            "icon": "🛡️",
        })
    
    # Forensic analysis
    timeline.append({
        "time": (threat_time + timedelta(minutes=10)).strftime("%H:%M"),
        "event": f"Investigation {_generate_investigation_id(str(threat.get('_id', '')))} initiated",
        "type": "analysis",
        "icon": "🔬",
    })
    
    # Pull from network_logs if available
    device_id = threat.get("targetDevice")
    if device_id:
        recent_logs = sync_db.network_logs.find({
            "device_id": device_id,
            "timestamp": {"$gte": (threat_time - timedelta(minutes=15)).isoformat()},
        }).sort("timestamp", -1).limit(3)
        
        for log in recent_logs:
            log_time = datetime.fromisoformat(log.get("timestamp", datetime.utcnow().isoformat()).replace("Z", ""))
            timeline.append({
                "time": log_time.strftime("%H:%M"),
                "event": log.get("message", "Network event logged"),
                "type": log.get("level", "info"),
                "icon": "📝",
            })
    
    # Sort chronologically
    timeline.sort(key=lambda x: x["time"])
    return timeline


def _generate_ai_analysis(threat: Dict[str, Any], evidence: Dict[str, Any], affected_devices: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate AI-powered investigation analysis."""
    # Build context for AI
    context = {
        "threat_type": threat.get("type"),
        "severity": threat.get("severity"),
        "target_device": threat.get("targetDevice"),
        "source_ip": threat.get("sourceIp"),
        "affected_device_count": len(affected_devices),
        "evidence": evidence,
    }
    
    # Try to get real AI analysis if available
    try:
        ai_response = invoke_autonomous_agent(event_data=context)
        if ai_response and isinstance(ai_response, dict) and "response" in ai_response:
            reasoning = ai_response["response"]
        else:
            reasoning = _generate_fallback_reasoning(threat, evidence, affected_devices)
    except Exception:
        reasoning = _generate_fallback_reasoning(threat, evidence, affected_devices)
    
    # Generate mitigations
    mitigations = _generate_mitigations(threat, affected_devices)
    
    # Calculate confidence
    confidence = _calculate_confidence(threat, evidence, affected_devices)
    
    return {
        "reasoning": reasoning,
        "mitigations": mitigations,
        "confidence": confidence,
    }


def _generate_fallback_reasoning(threat: Dict[str, Any], evidence: Dict[str, Any], affected_devices: List[Dict[str, Any]]) -> str:
    """Generate reasoning when AI is not available."""
    attack_type = threat.get("type", "unknown attack").replace("_", " ")
    severity = threat.get("severity", "Medium")
    device_count = len(affected_devices)
    ip_count = len(evidence.get("suspiciousIPs", []))
    
    reasoning_parts = [
        f"{severity}-severity {attack_type} detected with {threat.get('threatScore', 0)}/10 risk score.",
    ]
    
    if device_count > 1:
        reasoning_parts.append(f"Attack pattern spans {device_count} devices indicating coordinated campaign.")
    
    if ip_count > 1:
        reasoning_parts.append(f"Multiple attack vectors ({ip_count} source IPs) suggest well-resourced threat actor.")
    
    if evidence.get("malwareIndicators"):
        reasoning_parts.append("Malware signatures extracted for forensic analysis.")
    
    reasoning_parts.append("Recommend immediate containment and full forensic investigation.")
    
    return " ".join(reasoning_parts)


def _generate_mitigations(threat: Dict[str, Any], affected_devices: List[Dict[str, Any]]) -> List[str]:
    """Generate mitigation recommendations."""
    mitigations = []
    
    severity = threat.get("severity", "Medium")
    threat_type = threat.get("type", "")
    target_device = threat.get("targetDevice", "")
    
    # Immediate actions
    if severity in ["Critical", "High"]:
        mitigations.append(f"Isolate affected subnet immediately")
        mitigations.append(f"Block source IP {threat.get('sourceIp', 'unknown')} at firewall")
    
    # Type-specific mitigations
    if threat_type == "port_scan":
        mitigations.append("Enable advanced intrusion detection on perimeter")
    elif threat_type == "ddos_attempt":
        mitigations.append("Activate DDoS mitigation and rate limiting")
    elif threat_type == "data_exfiltration":
        mitigations.append("Inspect outbound traffic for data leakage")
        mitigations.append("Rotate all device credentials immediately")
    elif threat_type == "brute_force":
        mitigations.append("Force password reset on affected accounts")
        mitigations.append("Enable MFA on all management interfaces")
    
    # Device-specific actions
    if len(affected_devices) > 1:
        mitigations.append("Deploy honeypot to capture full attack payload")
    
    mitigations.append("Conduct full forensic imaging of affected devices")
    mitigations.append("Review and patch vulnerable firmware versions")
    
    return mitigations[:6]  # Limit to 6 for UI


def _calculate_confidence(threat: Dict[str, Any], evidence: Dict[str, Any], affected_devices: List[Dict[str, Any]]) -> int:
    """Calculate investigation confidence score."""
    confidence = 60  # Base confidence
    
    # Boost for severity
    if threat.get("severity") == "Critical":
        confidence += 15
    elif threat.get("severity") == "High":
        confidence += 10
    
    # Boost for evidence
    if evidence.get("suspiciousIPs"):
        confidence += 5
    if evidence.get("malwareIndicators"):
        confidence += 10
    if evidence.get("anomalies"):
        confidence += 5
    
    # Boost for multiple affected devices
    if len(affected_devices) > 1:
        confidence += 5
    
    return min(confidence, 95)  # Cap at 95%


def _geolocate_ip(ip: str) -> str:
    """Simulate IP geolocation (would use real GeoIP DB in production)."""
    # Simple hash-based country assignment for demo consistency
    ip_hash = hash(ip)
    countries = [
        "Moscow, RU",
        "Beijing, CN",
        "Bucharest, RO",
        "Amsterdam, NL",
        "Tokyo, JP",
        "London, UK",
        "Unknown",
    ]
    return countries[abs(ip_hash) % len(countries)]


def _infer_malware_family(threat_type: str) -> str:
    """Infer malware family from threat type."""
    families = {
        "port_scan": "Mirai Variant",
        "ddos_attempt": "DDoS Botnet",
        "data_exfiltration": "Custom RAT",
        "brute_force": "Credential Stealer",
        "iot_botnet": "Mirai IoT Variant",
        "firmware_exploit": "Firmware Rootkit",
    }
    return families.get(threat_type, "Unknown Malware")


async def build_investigation(threat: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build complete investigation from threat.
    Async version for API endpoints.
    """
    investigation_id = _generate_investigation_id(str(threat.get("_id", "")))
    classification = _classify_attack_vector(threat.get("type", ""))
    affected_devices = _correlate_affected_devices(threat)
    evidence = _collect_evidence(threat, affected_devices)
    timeline = _build_timeline(threat, affected_devices)
    ai_analysis = _generate_ai_analysis(threat, evidence, affected_devices)
    
    investigation = {
        "id": investigation_id,
        "threat_id": str(threat.get("_id", "")),
        "title": classification,
        "status": "in-progress",
        "severity": threat.get("severity", "Medium"),
        "created": threat.get("timestamp", datetime.utcnow().isoformat()),
        "analyst": "AI Autonomous Agent",
        "riskScore": ai_analysis["confidence"],
        "classification": classification,
        "summary": threat.get("aiSummary", threat.get("description", "Investigation auto-generated from threat detection")),
        "affectedDevices": affected_devices,
        "evidence": evidence,
        "timeline": timeline,
        "aiAnalysis": ai_analysis,
        "threat": {
            "type": threat.get("type"),
            "source_ip": threat.get("sourceIp"),
            "target_device": threat.get("targetDevice"),
            "threat_score": threat.get("threatScore"),
        },
    }
    
    # Store in MongoDB
    if db is not None:
        await db.investigations.update_one(
            {"id": investigation_id},
            {"$set": investigation},
            upsert=True,
        )
    
    return investigation


def build_investigation_sync(threat: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build complete investigation from threat.
    Sync version for background tasks.
    """
    investigation_id = _generate_investigation_id(str(threat.get("_id", "")))
    classification = _classify_attack_vector(threat.get("type", ""))
    affected_devices = _correlate_affected_devices(threat)
    evidence = _collect_evidence(threat, affected_devices)
    timeline = _build_timeline(threat, affected_devices)
    ai_analysis = _generate_ai_analysis(threat, evidence, affected_devices)
    
    investigation = {
        "id": investigation_id,
        "threat_id": str(threat.get("_id", "")),
        "title": classification,
        "status": "in-progress",
        "severity": threat.get("severity", "Medium"),
        "created": threat.get("timestamp", datetime.utcnow().isoformat()),
        "analyst": "AI Autonomous Agent",
        "riskScore": ai_analysis["confidence"],
        "classification": classification,
        "summary": threat.get("aiSummary", threat.get("description", "Investigation auto-generated from threat detection")),
        "affectedDevices": affected_devices,
        "evidence": evidence,
        "timeline": timeline,
        "aiAnalysis": ai_analysis,
        "threat": {
            "type": threat.get("type"),
            "source_ip": threat.get("sourceIp"),
            "target_device": threat.get("targetDevice"),
            "threat_score": threat.get("threatScore"),
        },
    }
    
    # Store in MongoDB
    if sync_db is not None:
        sync_db.investigations.update_one(
            {"id": investigation_id},
            {"$set": investigation},
            upsert=True,
        )

        # Back-link: update threat document with investigation_id
        threat_oid = threat.get("_id")
        if threat_oid:
            sync_db.threats.update_one(
                {"_id": threat_oid},
                {"$set": {"investigation_id": investigation_id}},
            )
    
    return investigation


async def get_investigations(limit: int = 50, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all investigations with optional status filter."""
    if db is None:
        return []
    
    query = {}
    if status:
        query["status"] = status
    
    investigations = await db.investigations.find(query).sort("created", -1).limit(limit).to_list(limit)
    
    # Clean up _id for JSON serialization
    for inv in investigations:
        if "_id" in inv:
            inv["_id"] = str(inv["_id"])
    
    return investigations


async def get_investigation_by_id(investigation_id: str) -> Optional[Dict[str, Any]]:
    """Get single investigation by ID."""
    if db is None:
        return None
    
    investigation = await db.investigations.find_one({"id": investigation_id})
    
    if investigation and "_id" in investigation:
        investigation["_id"] = str(investigation["_id"])
    
    return investigation


def on_threat_created(threat: Dict[str, Any]):
    """
    Callback when threat is created.
    Automatically builds investigation for high-severity threats.
    """
    severity = threat.get("severity", "Low")
    
    # Auto-investigate Critical and High severity threats
    if severity in ["Critical", "High"]:
        try:
            build_investigation_sync(threat)
            print(f"✅ Auto-created investigation for {severity} severity threat")
        except Exception as e:
            print(f"Failed to auto-create investigation: {e}")
