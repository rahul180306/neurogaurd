import re

with open("backend/agent/topology_engine.py", "r") as f:
    text = f.read()

# Fix sub_device dictionary type resolving
text = text.replace(
    '"type": peripheral.get("type", "unknown"),',
    '"type": peripheral.get("peripheral_type", peripheral.get("type", "unknown")).replace("_", " "),',
)

# And fix "servo" to "servo motor" in sets
text = text.replace('{"servo", "humidity sensor"}', '{"servo motor", "servo", "humidity sensor"}')

with open("backend/agent/topology_engine.py", "w") as f:
    f.write(text)
