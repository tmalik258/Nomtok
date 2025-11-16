#!/bin/bash
set -euo pipefail

LOG_FILE="/code/logs/yt-dlp-updater.log"
ENABLED="${YTDLP_UPDATER_ENABLED:-true}"
SMTP_HOST="${SMTP_HOST:-}"
SMTP_PORT="${SMTP_PORT:-}"
SMTP_USER="${SMTP_USER:-}"
SMTP_PASS="${SMTP_PASS:-}"
SMTP_FROM="${SMTP_FROM:-}"
NOTIFY_EMAILS="${NOTIFY_EMAILS:-}"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
notify() {
  local status="$1"; local message="$2"
  if [[ -n "$SMTP_HOST" && -n "$SMTP_FROM" && -n "$NOTIFY_EMAILS" ]]; then
    python /usr/local/bin/notify_email.py "$status" "$message" || true
  fi
}

if [[ "$ENABLED" != "true" ]]; then
  echo "$(timestamp) [INFO] Updater disabled; skipping run" | tee -a "$LOG_FILE"
  exit 0
fi

echo "$(timestamp) [INFO] Starting yt-dlp auto-update" | tee -a "$LOG_FILE"
CUR_VER=$(python -c "import yt_dlp,sys; sys.stdout.write(getattr(yt_dlp,'__version__','unknown'))" || echo "unknown")
echo "$(timestamp) [INFO] Current yt-dlp version: $CUR_VER" | tee -a "$LOG_FILE"

if /usr/local/bin/update-ytdlp >>"$LOG_FILE" 2>&1; then
  NEW_VER=$(python -c "import yt_dlp,sys; sys.stdout.write(getattr(yt_dlp,'__version__','unknown'))" || echo "unknown")
  echo "$(timestamp) [INFO] Updated yt-dlp version: $NEW_VER" | tee -a "$LOG_FILE"
  echo "$(timestamp) [INFO] yt-dlp update completed successfully" | tee -a "$LOG_FILE"
  notify "success" "yt-dlp updated from $CUR_VER to $NEW_VER"
else
  echo "$(timestamp) [ERROR] yt-dlp update failed; see log for details" | tee -a "$LOG_FILE"
  notify "failure" "yt-dlp update failed on $(hostname)"
  exit 1
fi