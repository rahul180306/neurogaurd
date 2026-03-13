from scapy.all import sniff, IP, TCP
import time
import sys

print("🚀 Starting NeuroGuard Hardware Network Monitor (Raspberry Pi Edition)")
print("Listening for suspicious TCP traffic...\n")

def detect(packet):
    """
    A basic packet sniffer function catching TCP traffic.
    In a real environment, this logic expands to detect port scanning patterns.
    """
    if packet.haslayer(IP) and packet.haslayer(TCP):
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        dst_port = packet[TCP].dport
        
        # Example: Log traffic targeting common IoT ports
        if dst_port in [80, 443, 554, 8080]:
            print(f"[ALERT] TCP Connection Attempt from {src_ip} -> {dst_ip}:{dst_port}")
            # Here: We would use `requests.post()` to send this to the FastAPI backend
            # or insert it directly into MongoDB for the AI to analyze.

if __name__ == "__main__":
    try:
        # Sniff packets indefinitely. 
        # (Note: Requires sudo/root privileges to run)
        sniff(prn=detect, store=0)
    except KeyboardInterrupt:
        print("\nShutting down Network Monitor.")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] Ensure you are running with sudo on your Raspberry Pi: {e}")
