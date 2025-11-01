# Quick Deployment Reference

## GitHub Secrets Required

Configure these in your repository settings under Settings → Secrets and variables → Actions:

| Secret | Description | Example |
|--------|-------------|---------|
| `SSH_PRIVATE_KEY` | Your SSH private key for server access | Content of `~/.ssh/nomtok` |
| `SSH_HOST` | Server IP address | `191.101.15.39` |
| `SSH_USER` | SSH username | `root` |
| `PROJECT_DIR` | Absolute path to project on server | `/root/nomtok` |

## Deployment Triggers

The workflow will automatically deploy when:
- ✅ You push to `main` or `master` branch
- ✅ You manually trigger from GitHub Actions tab

## Deployment Process

1. **Setup SSH connection** to your server
2. **Pull latest code** from GitHub
3. **Stop existing containers** gracefully
4. **Build and deploy** using docker-compose.prod.yml
5. **Health checks** on both services
6. **Cleanup** old Docker images

## Checking Deployment Status

### GitHub Actions
- Go to **Actions** tab in your repository
- Click on the latest workflow run
- Check the logs for any errors

### Server Health Checks
```bash
# Check if services are running
curl -f http://localhost:8030/health  # Backend
curl -f http://localhost:3000/api/health  # Frontend

# Check Docker containers
docker ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

## Manual Deployment (if needed)

```bash
# SSH to server
ssh -i ~/.ssh/nomtok root@191.101.15.39

# Navigate to project
cd /path/to/project

# Deploy manually
git pull origin main
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## Common Issues

| Issue | Solution |
|-------|----------|
| SSH connection failed | Check SSH_PRIVATE_KEY secret and server firewall |
| Docker build failed | Check Docker daemon and disk space |
| Health check failed | Check service logs with `docker compose logs` |
| Permission denied | Ensure proper file permissions on server |

## Application URLs

- **Frontend**: http://191.101.15.39:3000
- **Backend API**: http://191.101.15.39:8030

## Support

If deployment fails:
1. Check GitHub Actions logs for specific errors
2. Verify all secrets are configured correctly
3. Check server logs with `docker compose logs`
4. Ensure Docker is running on the server