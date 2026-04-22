import re

with open("backend/agent/topology_engine.py", "r") as f:
    text = f.read()

# Fix the early return issue in _build_device_links
old_code = """    if not core_devices:
        return links

    # Primary core device (usually first router/gateway)
    primary_core = core_devices[0]

    # Connect all edge devices to primary core
    for edge in edge_devices:
        links.append({
            "id": f"L_{primary_core['device_id']}_{edge['device_id']}",
            "from": primary_core.get("device_id"),
            "to": edge.get("device_id"),
            "flows": 2,
            "suspicious": False,
        })

    # Connect core devices to each other (if multiple)
    for i, core in enumerate(core_devices[1:], 1):
        links.append({
            "id": f"L_{primary_core['device_id']}_{core['device_id']}",
            "from": primary_core.get("device_id"),
            "to": core.get("device_id"),
            "flows": 5,
            "suspicious": False,
        })"""

new_code = """    if core_devices:
        primary_core = core_devices[0]

        # Connect all edge devices to primary core
        for edge in edge_devices:
            links.append({
                "id": f"L_{primary_core['device_id']}_{edge['device_id']}",
                "from": primary_core.get("device_id"),
                "to": edge.get("device_id"),
                "flows": 2,
                "suspicious": False,
            })

        # Connect core devices to each other (if multiple)
        for i, core in enumerate(core_devices[1:], 1):
            links.append({
                "id": f"L_{primary_core['device_id']}_{core['device_id']}",
                "from": primary_core.get("device_id"),
                "to": core.get("device_id"),
                "flows": 5,
                "suspicious": False,
            })
    else:
        # Fallback if no router: find Pi and use it as core
        pi_device = next((d for d in edge_devices if "pi" in str(d.get("name", "")).lower() or d.get("type") == "raspberry_pi"), None)
        if pi_device:
            for edge in edge_devices:
                if edge["device_id"] != pi_device["device_id"]:
                    links.append({
                        "id": f"L_{pi_device['device_id']}_{edge['device_id']}",
                        "from": pi_device.get("device_id"),
                        "to": edge.get("device_id"),
                        "flows": 2,
                        "suspicious": False,
                    })"""

text = text.replace(old_code, new_code)

with open("backend/agent/topology_engine.py", "w") as f:
    f.write(text)
