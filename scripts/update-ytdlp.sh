#!/bin/bash

# yt-dlp Automated Update Script for Docker Environment
# This script updates yt-dlp in the running Docker container

set -e

echo "🔄 Starting yt-dlp update process..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if the backend container is running
# Use the production container name defined in docker-compose.prod.yml
CONTAINER_NAME="nomtok_backend_prod"
if ! docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Backend container '${CONTAINER_NAME}' is not running."
    echo "💡 Start it with: docker compose -f docker-compose.prod.yml up -d backend"
    exit 1
fi

echo "📦 Updating yt-dlp to latest nightly version..."

# Update yt-dlp in the running container
docker exec ${CONTAINER_NAME} /usr/local/bin/update-ytdlp

# Verify the update
NEW_VERSION=$(docker exec ${CONTAINER_NAME} python -c "import yt_dlp; print(yt_dlp.version.__version__)")
echo "✅ yt-dlp updated successfully to version: ${NEW_VERSION}"

# Optional: Restart the backend service to ensure all changes take effect
read -p "🔄 Do you want to restart the backend service? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Restarting backend service..."
    docker compose -f docker-compose.prod.yml restart backend
    echo "✅ Backend service restarted successfully."
else
    echo "ℹ️  Backend service not restarted. Changes will take effect on next restart."
fi

echo "🎉 yt-dlp update process completed!"