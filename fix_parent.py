import re

with open("backend/agent/topology_engine.py", "r") as f:
    text = f.read()

text = text.replace(
    'parent_id = peripheral.get("parent_device_id")',
    'parent_id = peripheral.get("device_id")'
)

with open("backend/agent/topology_engine.py", "w") as f:
    f.write(text)
