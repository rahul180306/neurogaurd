import os
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi

load_dotenv(dotenv_path="../frontend/.env.local")

uri = os.getenv("MONGODB_URI")
db_name = os.getenv("MONGODB_DB", "neuroguard")

try:
    client = MongoClient(uri, tlsCAFile=certifi.where())
    db = client[db_name]
    threat_collection = db["threat_events"]
    print("✅ Connected to MongoDB Atlas")
except Exception as e:
    print(f"❌ MongoDB Connection Error: {e}")
    db = None
    threat_collection = None
