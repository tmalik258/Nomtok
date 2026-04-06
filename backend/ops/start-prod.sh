#!/bin/bash
set -euo pipefail

# start cron in background if available
if command -v cron >/dev/null 2>&1; then
  echo "Starting cron daemon..."
  cron || true
fi

# Pick up yt-dlp fixes on every deploy/restart without waiting for nightly cron
if [[ "${YTDLP_STARTUP_UPDATE:-true}" != "false" ]] && [[ -x /usr/local/bin/update-ytdlp ]]; then
  echo "[start-prod] Running yt-dlp startup update..."
  /usr/local/bin/update-ytdlp || echo "[start-prod] yt-dlp startup update failed (non-fatal); continuing"
fi

# Optimize worker count for 2-core server with memory constraints
# Formula: (2 * cores) + 1 = 5 workers max, but reduce to 3 for better stability
WORKERS=${GUNICORN_WORKERS:-3}
exec gunicorn -w "$WORKERS" app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120 --max-requests 1000 --max-requests-jitter 50 --worker-tmp-dir /dev/shm