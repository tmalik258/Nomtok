# yt-dlp Automated Update Script for Docker Environment (PowerShell)
# This script updates yt-dlp in the running Docker container

$ErrorActionPreference = "Stop"

Write-Host "🔄 Starting yt-dlp update process..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Check if the backend container is running (production)
$ContainerName = "nomtok_backend_prod"
$RunningContainers = docker ps --format "table {{.Names}}" | Select-String "^$ContainerName$"

if (-not $RunningContainers) {
    Write-Host "❌ Backend container '$ContainerName' is not running." -ForegroundColor Red
    Write-Host "💡 Start it with: docker compose -f docker-compose.prod.yml up -d backend" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Updating yt-dlp to latest nightly version..." -ForegroundColor Yellow

# Update yt-dlp in the running container
docker exec $ContainerName /usr/local/bin/update-ytdlp

# Verify the update
$NewVersion = docker exec $ContainerName python -c "import yt_dlp; print(yt_dlp.version.__version__)"
Write-Host "✅ yt-dlp updated successfully to version: $NewVersion" -ForegroundColor Green

# Optional: Restart the backend service to ensure all changes take effect
$Restart = Read-Host "🔄 Do you want to restart the backend service? (y/N)"
if ($Restart -match "^[Yy]$") {
    Write-Host "🔄 Restarting backend service..." -ForegroundColor Yellow
    docker compose -f docker-compose.prod.yml restart backend
    Write-Host "✅ Backend service restarted successfully." -ForegroundColor Green
} else {
    Write-Host "ℹ️  Backend service not restarted. Changes will take effect on next restart." -ForegroundColor Blue
}

Write-Host "🎉 yt-dlp update process completed!" -ForegroundColor Green