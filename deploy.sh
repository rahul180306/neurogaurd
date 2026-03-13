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
echo "[1/3] Syncing project files to ${PI_USER}@${PI_HOST}:${PI_DIR} ..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '__pycache__' \
    --exclude '.git' \
    --exclude '.vscode' \
    --exclude 'backend/backend.log' \
    --exclude 'frontend/.env.local' \
    ./ "${PI_USER}@${PI_HOST}:${PI_DIR}/"

# 2. Build and start containers on the Pi
echo ""
echo "[2/3] Building and starting Docker containers on Pi ..."
ssh "${PI_USER}@${PI_HOST}" "cd ${PI_DIR} && docker compose up -d --build"

# 3. Show status
echo ""
echo "[3/3] Checking container status ..."
ssh "${PI_USER}@${PI_HOST}" "cd ${PI_DIR} && docker compose ps"

echo ""
echo "═══════════════════════════════════════════"
echo "  Deployment complete!"
echo ""
echo "  Dashboard:  http://${PI_HOST}:3000"
echo "  Backend:    http://${PI_HOST}:8000"
echo "  MongoDB:    mongodb://${PI_HOST}:27017"
echo "═══════════════════════════════════════════"
