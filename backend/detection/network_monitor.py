import os
import requests
from scapy.all import sniff, IP, TCP
import time
import sys
from collections import defaultdict

print("🚀 Starting NeuroGuard Hardware Network Monitor")
print("Listening for suspicious TCP traffic (Port Scans)...\n")

API_URL = "http://localhost:8000/api/threats/detect"

# Track connection attempts: {src_ip: set(dst_ports)}
connection_tracker = defaultdict(set)
last_alert_time = defaultdict(float)

# High cooldown to prevent spamming from the same script execution (1 alert per IP every 2 minutes)
COOLDOWN_SECONDS = 120 

def detect(packet):
    global connection_tracker, last_alert_time
    
    if packet.haslayer(IP) and packet.haslayer(TCP):
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        dst_port = packet[TCP].dport
        
        # Localhost filter
        if src_ip == "127.0.0.1" or src_ip == dst_ip:
            return
            
        connection_tracker[src_ip].add(dst_port)
        
        # If an IP hits more than 15 unique ports, it is a port scan
        if len(connection_tracker[src_ip]) > 15:
            current_time = time.time()
            if current_time - last_alert_time[src_ip] > COOLDOWN_SECONDS:
                last_alert_time[src_ip] = current_time
                print(f"[ALERT] Port Scan Detected from {src_ip} -> {dst_ip} (Silencing further alerts from this IP for 2 mins)")
                
                payload = {
                    "source_ip": src_ip,
                    "target_device": dst_ip,
                    "attack_type": "port_scan",
                    "severity": "high",
                    "description": f"Aggressive port scan targeting >15 ports from {src_ip}",
                    "threat_score": 85
                }
                
                try:
                    requests.post(API_URL, json=payload, timeout=2)
                except Exception as e:
                    pass # Hide backend connection errors from terminal
            
            # ALWAYS reset tracker after reaching threshold so it doesn't instantly count up again inside the cooldown 
            connection_tracker[src_ip] = set()

if __name__ == "__main__":
    try:
        sniff(prn=detect, store=0)
    except KeyboardInterrupt:
        print("\nShutting down Network Monitor.")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] Ensure you run with privileges: {e}")
