import re

with open("backend/agent/topology_engine.py", "r") as f:
    text = f.read()

text = text.replace("angle = -60 + sub_index * 60  # -60°, 0°, 60° spread", "angle = -50 + sub_index * 100")
text = text.replace("radius = 8.0", "radius = 16.0")

with open("backend/agent/topology_engine.py", "w") as f:
    f.write(text)
