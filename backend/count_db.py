import asyncio
from database.mongodb import db

async def run():
    print("Devices:", await db.devices.count_documents({}))
    print("Unknown Devices:", await db.unknown_devices.count_documents({}))

asyncio.run(run())
