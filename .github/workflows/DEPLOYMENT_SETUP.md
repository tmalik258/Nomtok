# GitHub Actions Deployment Setup Guide

This guide will help you set up automated deployment to your production server using GitHub Actions.

## Prerequisites

- GitHub repository with your code
- SSH access to your production server (191.101.15.39)
- Docker and Docker Compose installed on the server
- Git repository cloned on the server

## GitHub Secrets Configuration

You need to configure the following secrets in your GitHub repository settings:

### Required Secrets

1. **SSH_PRIVATE_KEY**: Your SSH private key for accessing the server
2. **SSH_HOST**: `191.101.15.39`
3. **SSH_USER**: `root`
4. **PROJECT_DIR**: The absolute path to your project directory on the server

### Setting up GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its corresponding value

### SSH Private Key Setup

To get your SSH private key:

```bash
# On your local machine, copy your SSH private key
cat ~/.ssh/nomtok
```

Copy the entire content (including the BEGIN and END lines) and paste it as the `SSH_PRIVATE_KEY` secret.

### Project Directory Secret

Determine the absolute path to your project on the server. For example:
- `/root/nomtok`
- `/home/youruser/projects/nomtok`
- `/var/www/nomtok`

## Server Setup

### 1. SSH Configuration

Ensure your SSH key is properly configured on the server:

```bash
# On the server, add your public key to authorized_keys
echo "your-public-key-here" >> ~/.ssh/authorized_keys
```

### 2. Git Repository Setup

Clone your repository on the server:

```bash
# Navigate to your desired directory
cd /path/to/your/projects

# Clone the repository
git clone git@github.com:your-username/nomtok.git
cd nomtok
```

### 3. Environment Files

Create the necessary environment files on the server:

```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your production values

# Frontend environment
touch frontend/.env
# Add your frontend environment variables
```

### 4. Docker Setup

Ensure Docker and Docker Compose are installed:

```bash
# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

## Deployment Process

The GitHub Actions workflow will:

1. **Trigger on push** to main/master branch or manual dispatch
2. **Setup SSH connection** to your server
3. **Pull latest code** from GitHub
4. **Stop existing containers** gracefully
5. **Build and deploy** using docker-compose.prod.yml
6. **Perform health checks** on both frontend and backend
7. **Clean up** old Docker images

## Monitoring Deployment

### GitHub Actions Logs

- Go to **Actions** tab in your GitHub repository
- Click on the workflow run to see detailed logs
- Look for any error messages if deployment fails

### Server Logs

After deployment, you can check the logs on your server:

```bash
# Check all service logs
docker compose -f docker-compose.prod.yml logs -f

# Check specific service logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Health Checks

The workflow includes automatic health checks:
- Backend: `http://localhost:8030/health`
- Frontend: `http://localhost:3000/api/health`

You can also check manually:

```bash
# Check backend health
curl -f http://localhost:8030/health

# Check frontend health
curl -f http://localhost:3000/api/health
```

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify SSH_PRIVATE_KEY secret is correct
   - Check SSH_HOST and SSH_USER secrets
   - Ensure your public key is in server's authorized_keys

2. **Docker Build Failed**
   - Check Docker daemon is running: `sudo systemctl status docker`
   - Verify sufficient disk space: `df -h`
   - Check build logs in GitHub Actions

3. **Health Check Failed**
   - Check service logs: `docker compose -f docker-compose.prod.yml logs`
   - Verify ports are not blocked: `netstat -tlnp`
   - Check environment variables are set correctly

4. **Permission Issues**
   - Ensure proper file permissions on server
   - Check Docker user permissions
   - Verify Git repository permissions

### Manual Deployment (Fallback)

If automated deployment fails, you can deploy manually:

```bash
# SSH to server
ssh -i ~/.ssh/nomtok root@191.101.15.39

# Navigate to project
cd /path/to/your/project

# Pull latest code
git pull origin main

# Deploy
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## Security Best Practices

1. **Use strong SSH keys** (RSA 4096-bit or ED25519)
2. **Rotate SSH keys** regularly
3. **Use GitHub secrets** for sensitive data (never hardcode)
4. **Limit GitHub Actions permissions** to minimum required
5. **Monitor deployment logs** for suspicious activity
6. **Keep Docker images** updated with security patches

## Additional Notes

- The workflow uses `docker system prune` to clean up unused resources
- Health checks ensure services are running before marking deployment as successful
- The deployment process includes proper error handling and rollback capabilities
- All sensitive data should be stored in GitHub secrets, not in the workflow file

## Support

If you encounter issues:
1. Check GitHub Actions logs for specific error messages
2. Verify all secrets are configured correctly
3. Ensure