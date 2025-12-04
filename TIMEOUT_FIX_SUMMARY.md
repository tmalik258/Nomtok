# Timeout Issues Resolution Summary

## Issues Identified

1. **Database Connection Timeouts**: TimeoutError when connecting to database
2. **System Restarts**: OOM (Out of Memory) killer triggering during video processing
3. **Heavy Swap Usage**: 2GB/4GB swap used causing severe performance degradation
4. **Connection Pool Exhaustion**: Too many concurrent database connections
5. **No Resource Limits**: Containers consuming unlimited memory/CPU

## Root Causes

- **Memory Constraints**: 2-core server with 7.8GB RAM, high swap usage
- **Connection Pool Too Large**: 50 base + 50 overflow = 100 connections per worker (5 workers = 500 potential connections)
- **No Container Limits**: Backend container could consume all available memory
- **High Concurrency**: 5 concurrent video processing tasks per worker
- **Long-running Transactions**: Video processing holds database connections for extended periods

## Solutions Implemented

### 1. Resource Limits (docker-compose.prod.yml)

Added memory and CPU limits to prevent OOM kills:

- **Backend**: 3GB memory limit, 1.5 CPU limit
- **Frontend**: 512MB memory limit, 0.5 CPU limit
- **Redis**: 256MB memory limit with LRU eviction policy

### 2. Database Connection Pool Optimization (backend/app/config.py)

Reduced connection pool size for production stability:

- **Pool Size**: 50 → **3** (per worker)
- **Max Overflow**: 50 → **3** (per worker)
- **Pool Timeout**: 60s → **120s** (more time to acquire connection)
- **Pool Recycle**: 1800s → **3600s** (recycle connections less frequently)
- **New**: Connection timeout = **30s** for initial connection

**Rationale**: With 3 workers and 6 connections each = 18 max connections total, preventing exhaustion.

### 3. Improved Connection Handling (backend/app/database.py)

- Added better error handling for connection failures
- Increased command timeout to 120s
- Added connection establishment timeout (30s)
- Improved session cleanup to prevent connection leaks

### 4. Reduced Concurrency (backend/app/services/transcription_nlp.py)

- Video processing concurrency: **5 → 2** per worker
- Prevents connection pool exhaustion during video processing

### 5. Optimized Worker Count (backend/ops/start-prod.sh)

- Gunicorn workers: **5 → 3** (configurable via `GUNICORN_WORKERS` env var)
- Better resource allocation for 2-core server

## Deployment Steps

### 1. Backup Current Configuration

```bash
wsl -e ssh nomtok "cd Nomtok && cp docker-compose.prod.yml docker-compose.prod.yml.backup"
```

### 2. Update Environment Variables (Optional)

If you want to customize settings, add to `backend/.env`:

```env
# Database connection pool (optional - defaults are optimized)
DB_POOL_SIZE=3
DB_MAX_OVERFLOW=3
DB_POOL_TIMEOUT=120
DB_POOL_RECYCLE=3600
DB_CONNECT_TIMEOUT=30

# Worker and concurrency settings (optional)
GUNICORN_WORKERS=3
TRANSCRIPTION_CONCURRENCY=2
```

### 3. Rebuild and Restart Services

```bash
wsl -e ssh nomtok "cd Nomtok && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml build backend && docker compose -f docker-compose.prod.yml up -d"
```

### 4. Monitor Resources

```bash
# Check container resources
wsl -e ssh nomtok "cd Nomtok && docker stats --no-stream"

# Check swap usage (should decrease)
wsl -e ssh nomtok "free -h"

# Monitor backend logs for connection issues
wsl -e ssh nomtok "cd Nomtok && docker compose logs -f --tail=50 backend"
```

### 5. Verify Connection Pool

Check logs for:
```
Database connection pool configured: pool_size=3, max_overflow=3, max_connections=6
```

## Expected Improvements

1. **Reduced Memory Usage**: Container limits prevent OOM kills
2. **Faster Page Loads**: Fewer timeouts, better connection availability
3. **Stable Video Processing**: Lower concurrency prevents system overload
4. **Better Resource Management**: CPU and memory limits ensure system stability
5. **Reduced Swap Usage**: Less memory pressure = less swapping

## Monitoring Recommendations

1. **Watch Swap Usage**: Should decrease from 2GB to <500MB
2. **Monitor Connection Errors**: Should see fewer timeout errors in logs
3. **Check Memory Usage**: Backend should stay under 3GB limit
4. **Track Video Processing**: Should process videos without system restarts

## Troubleshooting

### If timeouts persist:

1. Check database connectivity:
   ```bash
   wsl -e ssh nomtok "cd Nomtok && docker compose exec backend python -c 'from app.database import async_engine; import asyncio; asyncio.run(async_engine.connect())'"
   ```

2. Verify environment variables are loaded:
   ```bash
   wsl -e ssh nomtok "cd Nomtok && docker compose exec backend env | grep DB_"
   ```

3. Increase pool size temporarily (if needed):
   ```env
   DB_POOL_SIZE=5
   DB_MAX_OVERFLOW=5
   ```

### If memory issues persist:

1. Reduce worker count further:
   ```env
   GUNICORN_WORKERS=2
   ```

2. Reduce video concurrency:
   ```env
   TRANSCRIPTION_CONCURRENCY=1
   ```

3. Check for memory leaks in logs

## Rollback Instructions

If issues occur, rollback:

```bash
wsl -e ssh nomtok "cd Nomtok && docker compose -f docker-compose.prod.yml down && mv docker-compose.prod.yml.backup docker-compose.prod.yml && docker compose -f docker-compose.prod.yml up -d"
```

Then revert code changes via git.

## Notes

- These settings are optimized for a **2-core, 8GB RAM server**
- Adjust limits if you upgrade server resources
- Monitor for 24-48 hours after deployment to ensure stability
- Consider adding database connection monitoring/alerting

