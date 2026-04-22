import requests
import time

url = 'http://10.102.70.61:8000/api/threats/detect'
payload = {
'source_ip': '192.168.1.100', 'target_device': '10.102.70.81', 'attack_type': 'port_scan', 'severity': 'High', 'description': 'Simulated rigorous Port Scan', 'threat_score': 85.0
}
r = requests.post(url, json=payload)
print('Threat:', r.text)
time.sleep(2)
threats = requests.get('http://10.102.70.61:8000/api/threats').json()
t_id = threats[0]['id']
r2 = requests.post(f'http://10.102.70.61:8000/api/investigations/generate?threat_id={t_id}')
print('Inv:', r2.text)
