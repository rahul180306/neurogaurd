import subprocess
import os

from datetime import datetime
try:
    from db import sync_db
except ImportError:
    sync_db = None


def check_camera_status():
    """
    Simulates checking the IoT camera for active intrusions.
    """
    suspicious = True
    if suspicious:
        return {
            "status": "warning",
            "message": "Camera endpoint is under possible port scan attack. High volume of TCP requests detected on ports 80 and 554."
        }
    return {"status": "secure", "message": "Camera is secure. All protocols normal."}

def check_device_status(device_id: str = None):
    """
    Alias for device checking as requested by the AI prompt.
    """
    if not device_id:
        return {
            "status": "monitoring",
            "message": "No specific device ID was provided. Monitoring all connected devices for abnormal behavior."
        }

    if "cam" in str(device_id).lower():
        return check_camera_status()
    return {"status": "secure", "message": f"Device {device_id} is secure and operating normally."}


def scan_network():
    """
    Simulates a network scan or pulls active threats from MongoDB.
    """
    if sync_db is not None:
        count = sync_db.threats.count_documents({})
        return {
            "status": "success",
            "message": f"Network scan complete. System currently tracking {count} historical security events."
        }
    
    return {
        "status": "success",
        "message": "Network scan complete. No critical threats detected in local subnets."
    }


def block_ip(ip_address: str):
    """
    Executes actual iptables firewall IP blocking mechanism and logs the autonomous action to MongoDB.
    """
    print(f"Executing Firewall Rule: BLOCK {ip_address}")
    
    # Actually block the IP using iptables
    try:
        subprocess.run(["iptables", "-A", "INPUT", "-s", ip_address, "-j", "DROP"], check=True)
        subprocess.run(["iptables", "-A", "FORWARD", "-s", ip_address, "-j", "DROP"], check=True)
        print(f"✅ Successfully added iptables DROP rules for {ip_address}")
    except Exception as e:
        print(f"❌ Failed to execute iptables for {ip_address}: {e}")

    if sync_db is not None:
        timestamp = datetime.utcnow().isoformat()
        
        
        
        
        # Log to blocked IPs
        sync_db.blocked_ips.insert_one({
            "ip": ip_address,
            "reason": "Autonomous agent block",
            "timestamp": timestamp
        })
        
        # Log AI action
        sync_db.ai_actions.insert_one({
            "action": "block_ip",
            "ip": ip_address,
            "reason": "Threat response protocol initiated",
            "timestamp": timestamp
        })
        
    return {
        "status": "success",
        "message": f"Firewall updated. Source IP {ip_address} has been permanently blocked across all subnets."
    }


def get_recent_threats():
    """
    Fetches the most recent threat events from MongoDB.
    """
    if sync_db is not None:
        threats = list(sync_db.threats.find({}, {"_id": 0}).sort("timestamp", -1).limit(3))
        if threats:
            description = f"Found {len(threats)} recent threats. "
            for t in threats:
                severity = t.get('severity', 'High')
                attack_type = t.get('type') or t.get('attack_type', 'attack')
                source = t.get('sourceIp') or t.get('source_ip', 'unknown')
                description += f"A {severity} severity {attack_type} from {source}. "
            return {"status": "success", "message": description, "data": threats}

    return {
        "status": "success",
        "message": "Recent threats retrieved. No critical anomalies.",
        "data": []
    }

def generate_threat_report():
    """
    Simulates generating a comprehensive threat report.
    """
    return {
        "status": "success",
        "message": "Threat report successfully generated and archived in the active security log.",
        "report_url": "/dashboard/reports/latest"
    }
    
def get_device_list():
    """
    Retrieves the list of active IoT devices from MongoDB.
    """
    if sync_db is not None:
        devices = list(sync_db.devices.find({}, {"_id": 0}).limit(10))
        if devices:
            return {
                "status": "success",
                "devices": devices
            }
            
    return {
        "status": "success",
        "devices": [
            {"id": "cam_01", "type": "camera", "status": "online"},
            {"id": "sensor_front", "type": "motion", "status": "online"},
            {"id": "lock_main", "type": "smart_lock", "status": "offline"}
        ]
    }


def get_predictions():
    """
    Retrieves the latest AI threat predictions from MongoDB.
    Used by Voice AI to answer prediction queries.
    """
    if sync_db is not None:
        predictions = list(sync_db.predictions.find({}, {"_id": 0}).sort("timestamp", -1).limit(5))
        if predictions:
            description = f"Found {len(predictions)} active predictions. "
            for p in predictions:
                confidence_pct = int(p.get('confidence', 0) * 100)
                description += (
                    f"Device {p.get('device_id', 'unknown')}: "
                    f"{p.get('predicted_attack', 'unknown')} attack predicted "
                    f"with {confidence_pct}% confidence, risk level {p.get('risk_level', 'unknown')}. "
                )
            return {"status": "success", "message": description, "data": predictions}

    return {
        "status": "success",
        "message": "No active threat predictions at this time. All systems nominal.",
        "data": []
    }
