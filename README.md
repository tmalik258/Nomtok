# Nomtok – Admin Video Creation

## Overview

- Frontend runs with Next.js App Router on port `3000` (via `pnpm`).
- Backend runs in Docker on port `8030`; admin routes live under `/admin/*`.
- This document summarizes the new video creation flow and UI updates.

## Admin Video API

### Create Video from YouTube URL

- Endpoint: `POST /admin/videos/`
- Request body:
  - `youtube_url` (string) – required
  - `influencer_id` (UUID) – optional override
- Behavior:
  - Validates YouTube URL and extracts the video ID.
  - Checks for duplicates by `youtube_video_id` and returns `409` if exists.
  - Fetches metadata from YouTube (title, description, channel info, publish date).
  - Auto-associates the video to an existing influencer by `channel_id`; if none found, creates a new influencer using channel data.
  - Persists the `Video` and returns a full `VideoResponse` including influencer details.
- Errors:
  - `400` – invalid YouTube URL or missing channel metadata.
  - `409` – video already exists.
  - `500` – unexpected server error.

### Manual Video Creation

- Endpoint: `POST /admin/videos/`
- Request body:
  - Matches `VideoCreate`: `influencer_id`, `youtube_video_id`, `title`, `description`, `video_url`, `published_at`, `transcription`.

## Frontend Updates

- Admin dashboard video creation form now only asks for `youtube_url`.
- Zod validation enforces correct YouTube URL format.
- Actions/hooks send only `{ youtube_url }` to the backend, relying on auto-association.

## Run & Preview

- Frontend: `pnpm run dev` (always on `http://localhost:3000/`).
- Backend: manage via Docker helper commands:
  - `dclogs backend` – check logs
  - `dcu` – start stack
  - `dcr` – restart stack
  - `dcr backend` – restart backend only
  - `dce backend <command>` – exec into backend container

## Notes

- Do not change ports (`3000` frontend, `8030` backend).
- Backend tests for the new flow exist under `backend/tests/test_admin_videos_create.py`.

## Production yt-dlp Automation

- The production backend container runs a daily cron job at `03:15` that executes `/usr/local/bin/auto-update-ytdlp`.
- The job calls `/usr/local/bin/update-ytdlp`, logs to `/code/logs/yt-dlp-updater.log`, and can send email notifications if SMTP is configured.
- Check logs: `dclogs backend` or read `/backend/logs/yt-dlp-updater.log` on the host.
- Manual trigger: `dce backend /usr/local/bin/auto-update-ytdlp`.
- Staging testing (recommended): enable updater via staging compose override, run manual trigger, and verify logs and version.
- Email notifications (optional): set `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASS`, and `NOTIFY_EMAILS` in production. If unset, notifications are skipped.