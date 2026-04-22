#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# NeuroGuard — Deploy to Raspberry Pi 4
# Usage: bash deploy.sh [PI_HOST]
# Default PI_HOST: 10.102.70.61
# ──────────────────────────────────────────────

PI_HOST="${1:-10.102.70.61}"
PI_USER="ashwin"
PI_DIR="/home/${PI_USER}/neuroguard"

echo "═══════════════════════════════════════════"
echo "  NeuroGuard → Deploying to Pi ($PI_HOST)"
echo "═══════════════════════════════════════════"

# 1. Sync project to Pi (exclude unnecessary files)
echo ""
echo "[1/4] Syncing project files to ${PI_USER}@${PI_HOST}:${PI_DIR} ..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '__pycache__' \
    --exclude '.git' \
    --exclude '.vscode' \
    --exclude '.claude' \
    --exclude 'backend/backend.log' \
    --exclude 'frontend/.env.local' \
    ./ "${PI_USER}@${PI_HOST}:${PI_DIR}/"

# 2. Ensure .env on Pi uses localhost MongoDB (Docker internal)
echo ""
echo "[2/4] Configuring environment on Pi ..."
ssh "${PI_USER}@${PI_HOST}" "cd ${PI_DIR} && cat > .env << 'ENVEOF'
# MongoDB (Docker service on same Pi)
MONGODB_URI=mongodb://localhost:27017/?appName=Neurogaurddb

# AWS Bedrock Configuration
BEDROCK_API_KEY=CHANGE_ME
BEDROCK_REGION=us-east-1

# Frontend auto-detects from browser hostname
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WS_URL=
ENVEOF"

# 3. Build and start containers on the Pi
echo ""
echo "[3/4] Building and starting Docker containers on Pi ..."
ssh "${PI_USER}@${PI_HOST}" "cd ${PI_DIR} && docker compose up -d --build"

# 4. Show status
echo ""
echo "[4/4] Checking container status ..."
ssh "${PI_USER}@${PI_HOST}" "cd ${PI_DIR} && docker compose ps"

echo ""
echo "═══════════════════════════════════════════"
echo "  Deployment complete!"
echo ""
echo "  Dashboard:  http://${PI_HOST}:3000"
echo "  Backend:    http://${PI_HOST}:8000"
echo "  MongoDB:    mongodb://${PI_HOST}:27017"
echo ""
echo "  ESP32 Firmware: firmware/esp32_neuroguard/"
echo "  → Flash via Arduino IDE to your ESP32"
echo "  → Update WIFI_SSID/WIFI_PASSWORD in the .ino"
echo "  → Set BACKEND_HOST to ${PI_HOST}"
echo "═══════════════════════════════════════════"
