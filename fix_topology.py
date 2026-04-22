import re

with open("backend/agent/topology_engine.py", "r") as f:
    text = f.read()

# Fix angle logic
text = text.replace(
    "angle = (index / max(1, total - 1)) * 360 if total > 1 else 0",
    "angle = (index / max(1, total)) * 360"
)

with open("backend/agent/topology_engine.py", "w") as f:
    f.write(text)
