import math
for index, total in [(0, 2), (1, 2)]:
    angle = (index / max(1, total)) * 360
    radius = 25.0
    x = 50.0 + radius * math.cos(math.radians(angle))
    y = 50.0 + radius * math.sin(math.radians(angle))
    print(f"index={index} angle={angle} x={x} y={y}")
