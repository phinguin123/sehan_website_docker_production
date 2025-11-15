# Docker Compose Guide for Sehan Website

## 📋 Table of Contents
1. [How Docker Compose Works](#how-docker-compose-works)
2. [Understanding MySQL Init Scripts](#understanding-mysql-init-scripts)
3. [Development vs Production](#development-vs-production)
4. [Deploying to AWS Ubuntu Server](#deploying-to-aws-ubuntu-server)

---

## How Docker Compose Works

### Overview
Your `docker-compose.yml` defines **8 services** that work together:
- **backend** (Flask API)
- **frontend** (Vite/React)
- **nginx** (Reverse proxy)
- **db** (MySQL database)
- **redis** (Message broker for Celery)
- **celery-worker** (Background task processor)
- **celery-beat** (Scheduled tasks)
- **flower** (Celery task monitoring)

### Service Breakdown

#### 1. **Backend Service** (Flask)
```yaml
backend:
  build: ./backend  # Builds from Dockerfile.backend
  container_name: flask_backend
  restart: unless-stopped
  env_file: env.local  # Loads environment variables
  environment:
    FLASK_ENV: development
    DATABASE_HOST: db  # Points to MySQL container
  ports:
    - "5000:5000"  # Host:Container port mapping
  volumes:
    - ./backend:/app  # Code sync for live reload in dev
  depends_on: db  # Wait for MySQL to start first
```

**What it does:**
- Runs your Flask application
- Connects to the `db` container via hostname `db`
- In development: mounts local code for live reload
- Exposes port 5000 for direct access (optional)

#### 2. **Frontend Service** (Vite/React)
```yaml
frontend:
  build: ./frontend  # Builds from Dockerfile.frontend
  container_name: vite_frontend
  ports:
    - "8080:80"
  volumes:
    - ./frontend:/app  # Code sync for live reload
  depends_on: backend
```

**What it does:**
- Serves your React application
- In development: runs Vite dev server on port 3000
- In production: serves pre-built static files via Nginx

#### 3. **Nginx Service** (Reverse Proxy)
```yaml
nginx:
  image: nginx:alpine
  container_name: main_nginx
  ports:
    - "80:80"  # Main entry point
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    - ./nginx/sites-enabled/docker-dev.conf:/etc/nginx/sites-enabled/default
  depends_on:
    - backend
    - frontend
```

**What it does:**
- Acts as the **single entry point** on port 80
- Routes requests:
  - `/` → Frontend (port 3000 in dev, static files in prod)
  - `/api/` → Backend (port 5002 in dev, 5000 in prod)
  - `/swaggerui/` → Backend Swagger UI
- Manages CORS, SSL termination (in production)

#### 4. **Database Service** (MySQL)
```yaml
db:
  image: mysql:8.0
  container_name: mysql_db
  env_file: env.local
  volumes:
    - db_data:/var/lib/mysql  # Persistent data storage
    - ./mysql-init:/docker-entrypoint-initdb.d  # SQL init scripts
  ports:
    - "3306:3306"
```

**What it does:**
- Runs MySQL 8.0
- Stores data in a **named volume** (`db_data`) that persists even if container is deleted
- Automatically executes SQL files from `mysql-init/` **only on first initialization**

#### 5. **Redis Service**
```yaml
redis:
  image: redis:7-alpine
  container_name: redis_broker
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes
```

**What it does:**
- Message broker for Celery
- Stores task queue and results
- Persists data with `appendonly` mode

#### 6. **Celery Services**
Three separate Celery instances using the **same backend image** but different commands:

- **celery-worker**: Processes background tasks
- **celery-beat**: Schedules periodic tasks
- **flower**: Web UI to monitor Celery tasks (port 5555)

All use `./start.sh [worker|beat|flower]` to run different commands.

---

### Key Concepts

#### **Networking**
Docker Compose creates a **bridge network** automatically. All containers can communicate using service names:
- `backend` can connect to `db:3306`
- `nginx` can proxy to `backend:5002` and `frontend:3000`
- `celery-worker` can connect to `redis:6379`

#### **Volume Mounting**
```yaml
volumes:
  - ./backend:/app  # Host:Container
```
- **Development**: Mounts local code for live reload
- **Production**: No volumes (code baked into image)

#### **Named Volumes**
```yaml
volumes:
  db_data:  # Stored in /var/lib/docker/volumes/
```
- Persists data outside containers
- Even if you `docker-compose down`, data remains

#### **Environment Variables**
```yaml
env_file: env.local
environment:
  DATABASE_HOST: db
```
- `env_file`: Loads from `.env` file (secrets)
- `environment`: Adds/overrides variables
- Containers reference each other by **service name** (`db`, not `localhost`)

---

## Understanding MySQL Init Scripts

### How It Works

When you mount `./mysql-init:/docker-entrypoint-initdb.d` to a MySQL container:

1. **MySQL checks** if data directory (`/var/lib/mysql`) is **empty**
2. If empty, it executes **ALL** `.sql` and `.sh` files in `/docker-entrypoint-initdb.d` **alphabetically**
3. If data directory exists, **skips** all init scripts

**Execution order** (alphabetical):
```
01-sehanDB_mysql_init.sql          ← Creates database
02-private_tutoring_init.sql        ← Creates tables
03-private_tutoring_sample_data.sql ← Inserts sample data
04-private_tutoring_schema_updates.sql
...
13-create_ledger_table.sql          ← Latest changes
```

### Current Problem

You have **13 SQL files** that include:
- ✅ `01-sehanDB_mysql_init.sql` - Database creation
- ✅ `02-private_tutoring_init.sql` - Initial schema
- ❌ `04-private_tutoring_schema_updates.sql` - Changes tables
- ❌ `06-fix_teacher_subjects_normalization.sql` - Fixes issues
- ❌ Multiple `08-normalize_*.sql` files - Schema migrations

**This is problematic because:**
- These were **incremental changes** during development
- They're modifying existing tables that may not exist in a fresh database
- They might fail or run unnecessarily
- It's hard to know what's actually needed

### Best Practice: Consolidate SQL Files

#### Option 1: Single Consolidated File (Recommended)
```bash
# Combine all schema into one file
cat mysql-init/01-sehanDB_mysql_init.sql > mysql-init/init-complete.sql
cat mysql-init/02-private_tutoring_init.sql >> mysql-init/init-complete.sql
# ... append only the final schema, not intermediate migrations
```

Create **ONE** file with the **final state** of your database:
- `01-sehanDB_database_init.sql` - Everything needed for fresh install

**Pros:**
- ✅ Clean, predictable
- ✅ Fast execution
- ✅ No intermediate states
- ✅ Easy to understand

**Cons:**
- ❌ Lose migration history (but you have version control)

#### Option 2: Keep Current Structure (Not Recommended)
Keep all 13 files for "history"

**Cons:**
- ❌ Files like `08-normalize_*.sql` fail if run on fresh database
- ❌ Unnecessary complexity
- ❌ Slower initialization

### Recommended Structure

```
mysql-init/
├── 01-complete_schema.sql    ← All tables, indexes, constraints
└── 02-sample_data.sql        ← Optional sample data
```

**Why this works:**
- First run: Creates complete database in correct state
- Subsequent runs: Skips (data exists)
- Clean and maintainable

---

## Development vs Production

### Development Mode (`docker-compose.override.yml`)

```yaml
backend:
  environment:
    FLASK_ENV: development
  ports:
    - "5002:5002"  # Expose backend port
  volumes:
    - ./backend:/app  # Live code reload
  command: ["python3", "app.py", "5002"]

frontend:
  command: sh -c "npm run dev -- --host 0.0.0.0 --port 3000"
  ports:
    - "3000:3000"  # Expose Vite dev server
```

**Differences:**
- ✅ Code is mounted (live reload)
- ✅ Ports exposed (direct access)
- ✅ Debug mode enabled
- ✅ Dev dependencies installed

### Production Mode (`docker-compose.prod.yml`)

```yaml
backend:
  environment:
    FLASK_ENV: production
  ports: []  # No ports exposed (only internal)
  volumes: []  # No mounts (code in image)

frontend:
  ports: []
  volumes: []

nginx:
  ports:
    - "80:80"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
```

**Differences:**
- ❌ No code mounting (image is read-only)
- ❌ No exposed ports (except 80)
- ❌ Optimized builds
- ❌ Production settings

---

## Deploying to AWS Ubuntu Server

### Prerequisites
- AWS EC2 Ubuntu instance running
- SSH access configured
- Domain name pointing to your server IP

### Deployment Strategy: Use Git

**Why Git?**
- ✅ Version control
- ✅ Easy updates
- ✅ Rollback capability
- ✅ No manual file copying

### Step-by-Step Deployment

#### 1. **Prepare Your Repository**

Ensure `.env` files are NOT committed:
```bash
# .gitignore
env.local
.env
*.env
```

Create production environment file:
```bash
# .env.production.example (commit this)
MYSQL_ROOT_PASSWORD=<strong-password>
MYSQL_DATABASE=sehanDB
MYSQL_USER=admin
MYSQL_PASSWORD=<strong-password>
DATABASE_HOST=db
DATABASE_PORT=3306
```

#### 2. **Set Up AWS Server**

SSH into your Ubuntu server:
```bash
ssh -i your-key.pem ubuntu@your-server-ip
```

Install dependencies:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose (v2)
sudo apt install docker-compose-plugin -y

# Add user to docker group (logout/login required)
sudo usermod -aG docker ubuntu
```

#### 3. **Clone Repository**

```bash
# Create project directory
mkdir -p /home/ubuntu/sehan_website
cd /home/ubuntu/sehan_website

# Clone your repo (use HTTPS or SSH)
git clone https://github.com/yourusername/sehan_website.git .

# Or create repository and push from local
```

#### 4. **Create Production Environment File**

```bash
# Create production env file
nano .env.production

# Add your production variables
MYSQL_ROOT_PASSWORD=YourStrongPassword123!
MYSQL_DATABASE=sehanDB
MYSQL_USER=admin
MYSQL_PASSWORD=YourStrongPassword123!
DATABASE_HOST=db
DATABASE_PORT=3306
FLASK_ENV=production
FLASK_DEBUG=0
```

#### 5. **Set Up SSL (Let's Encrypt)**

Install Certbot:
```bash
sudo apt install certbot -y
```

Get SSL certificate:
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

#### 6. **Configure Nginx for Production**

Create production Nginx config:
```nginx
# nginx/sites-enabled/docker-prod.conf
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Update `docker-compose.prod.yml`:
```yaml
nginx:
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/sites-enabled/docker-prod.conf:/etc/nginx/sites-enabled/default:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro  # SSL certificates
```

#### 7. **Build and Start Services**

```bash
# Build and start all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Check logs
docker compose logs -f

# Check running containers
docker compose ps
```

#### 8. **Set Up Auto-Start**

Create systemd service for auto-restart:
```bash
sudo nano /etc/systemd/system/sehan-website.service
```

Add:
```ini
[Unit]
Description=Sehan Website Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/sehan_website
ExecStart=/usr/bin/docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.yml -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable sehan-website.service
sudo systemctl start sehan-website.service
```

#### 9. **Set Up Auto-Deploy (Optional)**

Create deploy script:
```bash
# deploy.sh
#!/bin/bash
cd /home/ubuntu/sehan_website
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose restart nginx
```

Make executable:
```bash
chmod +x deploy.sh
```

Or use GitHub Actions for automated deployment.

---

### Important Production Considerations

#### 1. **Security**
- ✅ Use strong passwords in `.env.production`
- ✅ Restrict SSH access
- ✅ Enable firewall: `sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable`
- ✅ Keep Docker and system updated
- ✅ Use secrets management (AWS Secrets Manager or HashiCorp Vault)

#### 2. **Backups**
```bash
# Backup database
docker exec mysql_db mysqldump -u root -p sehanDB > backup-$(date +%Y%m%d).sql

# Schedule daily backup (crontab)
0 2 * * * cd /home/ubuntu/sehan_website && docker exec mysql_db mysqldump -u root -p'PASSWORD' sehanDB > backups/backup-$(date +\%Y\%m\%d).sql
```

#### 3. **Monitoring**
- Set up monitoring (Prometheus + Grafana)
- Configure log rotation
- Monitor disk space
- Set up alerts for crashes

#### 4. **Performance**
- Use AWS RDS instead of containerized MySQL for production
- Scale services: `docker compose up -d --scale celery-worker=3`
- Use CDN for static assets
- Enable Redis caching

---

### Quick Reference Commands

```bash
# Development
docker compose up -d              # Start all services
docker compose down               # Stop and remove
docker compose logs -f backend    # View logs
docker compose restart backend    # Restart specific service

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose ps                 # List running containers
docker compose exec backend bash  # Access container shell

# Database
docker exec mysql_db mysql -u admin -p sehanDB  # Connect to DB
docker exec mysql_db mysqldump -u root -p sehanDB > backup.sql  # Backup

# Updates
git pull origin main              # Pull latest code
docker compose up -d --build      # Rebuild and restart
```

---

### Summary

1. **Docker Compose** orchestrates 8 services (backend, frontend, nginx, db, redis, 3x celery)
2. **MySQL init scripts** run alphabetically only on first database creation
3. **Consolidate SQL files** into 1-2 files for clean initialization
4. **Deploy to AWS** using Git, rebuild images in production mode, add SSL
5. **Use `.env.production`** for environment variables, never commit secrets

This setup gives you a scalable, maintainable production deployment! 🚀















