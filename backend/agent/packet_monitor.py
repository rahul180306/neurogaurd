import threading
import time
from scapy.all import sniff

class PacketMonitor:
    def __init__(self):
        self.packet_count = 0
        self.last_packet_count = 0
        self.last_time = time.time()
        self.packets_per_sec = 0
        self.running = False
        
    def _handler(self, packet):
        self.packet_count += 1
        
    def _sniff_loop(self):
        try:
            sniff(prn=self._handler, store=False)
        except PermissionError:
            print("Warning: Scapy needs sudo for sniffing packets! Starting dummy fallback instead.")
            while self.running:
                time.sleep(1)
                self.packet_count += __import__('random').randint(10, 150)
        except Exception as e:
            print(f"PacketMonitor error: {e}")

    def _rate_loop(self):
        while self.running:
            time.sleep(1)
            current_time = time.time()
            elapsed = current_time - self.last_time
            if elapsed > 0:
                self.packets_per_sec = int((self.packet_count - self.last_packet_count) / elapsed)
            self.last_packet_count = self.packet_count
            self.last_time = current_time

    def start(self):
        if not self.running:
            self.running = True
            threading.Thread(target=self._sniff_loop, daemon=True).start()
            threading.Thread(target=self._rate_loop, daemon=True).start()
        
monitor = PacketMonitor()
