## 2025-11-16

- Removed deprecated host scripts:
  - `scripts/update-ytdlp.sh`
  - `scripts/update-ytdlp.ps1`
- Implemented production automation for yt-dlp updates:
  - Added cron-based job running `/usr/local/bin/auto-update-ytdlp` daily at `03:15` inside the backend container
  - Logging to `/code/logs/yt-dlp-updater.log` with timestamps and status
  - Optional email notifications via SMTP (`SMTP_*`, `NOTIFY_EMAILS`)
- Updated `docker-compose.prod.yml` to enable updater and optional webhook
- Documented automation process and manual trigger in `README.md`