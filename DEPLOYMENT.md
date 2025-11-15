# Deployment Guide for AWS Ubuntu Server

## Quick Start

### On Your Local Machine

1. **Push code to GitHub**
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

2. **Create production env file template**
```bash
cp .env.example .env.production
nano .env.production
```

Add your production values.

### On AWS Ubuntu Server

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y

# Clone repository
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/sehan_website.git
cd sehan_website

# Create production environment
nano .env.production
# Add your production credentials

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Check status
docker compose ps
docker compose logs -f
```

## Detailed Deployment

See `DOCKER_COMPOSE_GUIDE.md` for complete instructions.















