## Objectives
- Remove deprecated/unused updater scripts from production scope safely.
- Implement automated yt-dlp updates in the production Docker environment with scheduling, logging, validation, and notifications.
- Keep local development separate and unchanged.
- Test in staging before production release; document changes clearly.

## Discovery Summary
- Production container name: `nomtok_backend_prod` (`docker-compose.prod.yml`, port `8030:8000`).
- `backend/Dockerfile.prod` already ships `/usr/local/bin/update-ytdlp` to upgrade yt-dlp in-place.
- `backend/requirements.txt` includes `yt-dlp==2025.10.22` (base install), while Dockerfiles currently upgrade to nightly.
- Repo scripts:
  - `scripts/update-ytdlp.sh` and `scripts/update-ytdlp.ps1`: host-driven helpers that exec into the backend container to run `/usr/local/bin/update-ytdlp`.
  - Windows-only `scripts/yt-dlp-updater.ps1`: local machine updater for `yt-dlp.exe` (not used in Docker).

## Cleanup Plan (Production Scope)
1. Verify whether `scripts/update-ytdlp.sh` and `scripts/update-ytdlp.ps1` are referenced by any CI/CD or ops tooling.
2. If unused, remove both from the repo (they aren’t copied into the production image) to reduce confusion.
3. Keep `/usr/local/bin/update-ytdlp` inside the container as the canonical mechanism for updates.
4. Add a CHANGELOG entry listing removed host scripts and the new automated approach.

## Automation Implementation (Production Only)
1. Add a production-only scheduled updater inside the backend container:
   - Install a minimal scheduler (`cron` or `supercronic`) in `backend/Dockerfile.prod`.
   - Create `/usr/local/bin/auto-update-ytdlp` to:
     - Run `/usr/local/bin/update-ytdlp` with timestamped logging to `/var/log/yt-dlp-updater.log`.
     - Perform pre/post validation (`python -c "import yt_dlp; print(yt_dlp.__version__)"`).
     - On failure, log error details and emit a webhook alert (configurable env `YTDLP_WEBHOOK_URL`).
   - Register a daily schedule (e.g., `03:15`) via container crontab.
2. Logging:
   - Write logs to `/var/log/yt-dlp-updater.log` and STDOUT so `docker compose logs` can show them.
   - Include start/end timestamps, current/target version, status, and error traces.
3. Notifications:
   - If `YTDLP_WEBHOOK_URL` is set, POST JSON for success/failure with timestamp and version.
4. Backward Compatibility:
   - Keep existing `/usr/local/bin/update-ytdlp` unchanged; automation only calls it.
   - Do not alter FastAPI runtime behavior; updates occur off-hours and skip if critical processes are busy.

## Environment-Specific Handling
- Production:
  - Enable scheduler (`YTDLP_UPDATER_ENABLED=true`).
  - Provide `YTDLP_WEBHOOK_URL` and `YTDLP_UPDATER_SCHEDULE` via `docker-compose.prod.yml`.
- Development:
  - Do not install or run the scheduler.
  - Preserve current dev flow with manual updates.
- Package install:
  - Base image installs yt-dlp per `requirements.txt` for deterministic builds.
  - Automated updater uses `/usr/local/bin/update-ytdlp` to perform controlled upgrades when needed.

## Quality Assurance
1. Staging compose override to enable the scheduler and webhook to a test endpoint.
2. Run a manual trigger in staging: `docker compose -f docker-compose.staging.yml exec backend /usr/local/bin/auto-update-ytdlp`.
3. Verify logs: `docker compose -f docker-compose.staging.yml logs backend` and inspect `/var/log/yt-dlp-updater.log`.
4. Confirm validation outputs and rollback behavior on simulated failure.
5. Validate that old host scripts are removed and no tooling breaks.

## Documentation
- Update `CHANGELOG.md` to list removed scripts and the new production automation.
- Update `README.md` with:
  - How the production updater works.
  - How to configure schedule and webhook.
  - How to check logs and manually trigger in staging.

## Rollout Steps
1. Implement Dockerfile.prod changes and the `auto-update-ytdlp` script.
2. Add production-compose environment variables and volume (if needed for logs).
3. Remove unused host scripts.
4. Test in staging; if green, ship to production.
5. Update CHANGELOG and README.

## Risk Mitigation
- Run off-hours and include skip-if-running logic.
- Pre/post validation with rollback and clear logs.
- Webhook alerts for visibility.
- Keep base installation aligned with `requirements.txt`; automation remains additive and reversible.