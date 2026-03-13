import re

with open('backend/main.py', 'r') as f:
    content = f.read()

# Remove the duplicate get_network_traffic block entirely
duplicate_block = """@app.get("/api/network/traffic")
async def get_network_traffic():
    net = psutil.net_io_counters()

    total_bytes = net.bytes_sent + net.bytes_recv
    total_tb = total_bytes / (1024**4) # Usually bytes to TB is 1024^4

    return {
        "bandwidth_tb": round(total_tb, 4),
        "bytes_sent": net.bytes_sent,
        "bytes_recv": net.bytes_recv
    }"""
content = content.replace(duplicate_block, "")

original_block = """@app.get("/api/network/traffic")
async def get_network_traffic():
    \"\"\"
    Network Traffic Engine — returns 24-hour traffic time series and bandwidth stats.
    Aggregates telemetry data into hourly buckets for visualization charts.
    \"\"\"
    return await get_traffic_stats()"""

new_block = """from agent.packet_monitor import monitor

@app.get("/api/network/traffic")
async def get_network_traffic():
    \"\"\"
    Network Traffic Engine — returns 24-hour traffic time series and bandwidth stats.
    Aggregates telemetry data into hourly buckets for visualization charts.
    \"\"\"
    data = await get_traffic_stats()
    try:
        net = psutil.net_io_counters()
        total_bytes = net.bytes_sent + net.bytes_recv
        data["bandwidth_tb"] = round(total_bytes / (1024**4), 4)
        data["bytes_sent"] = getattr(net, 'bytes_sent', 0)
        data["bytes_recv"] = getattr(net, 'bytes_recv', 0)
    except Exception:
        pass
    data["packets_per_sec"] = monitor.packets_per_sec
    return data"""

content = content.replace(original_block, new_block)

# Add monitor.start() to startup event
if 'monitor.start()' not in content:
    content = content.replace("asyncio.create_task(scanner.start())", "monitor.start()\n    asyncio.create_task(scanner.start())")

with open('backend/main.py', 'w') as f:
    f.write(content)
print('Done!')