#!/bin/bash
set -euo pipefail

# start cron in background if available
if command -v cron >/dev/null 2>&1; then
  echo "Starting cron daemon..."
  cron || true
fi

# Optimize worker count for 2-core server with memory constraints
# Formula: (2 * cores) + 1 = 5 workers max, but reduce to 3 for better stability
WORKERS=${GUNICORN_WORKERS:-3}
exec gunicorn -w "$WORKERS" app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120 --max-requests 1000 --max-requests-jitter 50 --worker-tmp-dir /dev/shm