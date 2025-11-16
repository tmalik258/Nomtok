#!/bin/bash
set -euo pipefail

# start cron in background if available
if command -v cron >/dev/null 2>&1; then
  echo "Starting cron daemon..."
  cron || true
fi

WORKERS=$((($(nproc) * 2) + 1))
exec gunicorn -w "$WORKERS" app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120 --max-requests 1000 --max-requests-jitter 50 --worker-tmp-dir /dev/shm