#!/bin/bash
set -euo pipefail
# Use absolute interpreter so this works from cron (minimal PATH) and from start-prod.sh
exec /usr/local/bin/python3 -m pip install --no-cache-dir --upgrade --pre "yt-dlp[default]"
