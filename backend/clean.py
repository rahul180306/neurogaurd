import asyncio
from db import db, client
async def clean():
    await db.devices.delete_many({"vendor": "Simulated"})
    await db.unknown_devices.delete_many({"vendor": "Simulated"})
    client.close()
asyncio.run(clean())
