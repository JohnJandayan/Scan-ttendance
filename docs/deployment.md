# Deployment Guide

This guide covers deploying Scan-ttendance to various platforms and environments.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
- [Docker Deployment](#docker-deployment)
- [Manual Server Deployment](#manual-server-deployment)
- [Database Setup](#database-setup)
- [SSL Configuration](#ssl-configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Quick Start

For a complete deployment, follow these guides in order:

1. **[Supabase Setup Guide](./supabase-setup.md)** - Set up your database and authentication
2. **[Deployment Checklist](./deployment-checklist.md)** - Comprehensive pre-deployment checklist
3. **This Guide** - Detailed deployment instructions
4. **[API Documentation](./api.md)** - API reference for integration testing

### Automated Deployment Scripts

Use the provided scripts for streamlined deployment:

```bash
# Validate environment configuration
npm run env:validate

# Verify Supabase connection
npm run verify:supabase

# Verify deployment configuration
npm run verify:deployment

# Deploy to preview environment
npm run deploy

# Deploy to production
npm run deploy:production
```

## Prerequisites

Before deploying, ensure you have:

- Node.js 18.x or 20.x
- PostgreSQL database (local or cloud)
- Domain name (for production)
- SSL certificate (for HTTPS)
- Environment variables configured

## Environment Configuration

### Required Environment Variables

Create a `.env.production` file with the following variables:

```env
# Application
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secure-nextauth-secret-32-chars-min

# Database
DATABASE_URL=postgresql://username:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Authentication
JWT_SECRET=your-secure-jwt-secret-32-chars-minimum
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Environment Variable Security

- Use strong, randomly generated secrets (minimum 32 characters)
- Never commit environment files to version control
- Use different secrets for each environment
- Rotate secrets regularly

### Environment Variable Validation

The application includes built-in environment validation:

```typescript
// lib/env-validation.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).optional(),
})

export const env = envSchema.parse(process.env)
```

### Generating Secure Secrets

Use these commands to generate secure secrets:

```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate NextAuth secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 24

# Generate webhook secret
openssl rand -hex 32
```

### Environment-Specific Configurations

#### Development (.env.local)
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/scan_ttendance_dev
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_ANON_KEY=your-dev-anon-key
JWT_SECRET=your-dev-jwt-secret-32-chars-minimum
NEXTAUTH_SECRET=your-dev-nextauth-secret-32-chars
NEXTAUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

#### Staging (.env.staging)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@staging-db:5432/scan_ttendance_staging
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=your-staging-anon-key
JWT_SECRET=your-staging-jwt-secret-different-from-prod
NEXTAUTH_SECRET=your-staging-nextauth-secret
NEXTAUTH_URL=https://staging.your-domain.com
CORS_ORIGIN=https://staging.your-domain.com
LOG_LEVEL=info
SENTRY_DSN=your-staging-sentry-dsn
```

#### Production (.env.production)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:secure-pass@prod-db:5432/scan_ttendance_prod
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
JWT_SECRET=your-ultra-secure-prod-jwt-secret-64-chars
NEXTAUTH_SECRET=your-ultra-secure-prod-nextauth-secret
NEXTAUTH_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=warn
SENTRY_DSN=your-production-sentry-dsn
```

## Vercel Deployment (Recommended)

Vercel provides the easiest deployment experience for Next.js applications.

### 1. Connect Repository

1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings

### 2. Configure Environment Variables

In the Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add all required environment variables
3. Set appropriate environments (Production, Preview, Development)

### 3. Configure Build Settings

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "devCommand": "npm run dev"
}
```

### 4. Custom Domain Setup

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL certificate is automatically provisioned

### 5. Deployment Configuration

The project includes a comprehensive `vercel.json` configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://your-domain.com"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Authorization, Content-Type"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=self, microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/health",
      "destination": "/api/health"
    }
  ]
}
```

### 6. Automatic Deployments

Configure automatic deployments:

1. Production deployments from `main` branch
2. Preview deployments from pull requests
3. Branch deployments for feature branches

## Docker Deployment

Deploy using Docker containers for more control over the environment.

### 1. Create Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set permissions
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start application
CMD ["node", "server.js"]
```

### 2. Create Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=scan_ttendance
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### 3. Build and Deploy

```bash
# Build image
docker build -t scan-ttendance .

# Run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f app
```

## Manual Server Deployment

Deploy to a VPS or dedicated server.

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
```

### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/yourusername/scan-ttendance.git
cd scan-ttendance

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'scan-ttendance',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production'
  }]
}
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Database Setup

### PostgreSQL Setup

```sql
-- Create database
CREATE DATABASE scan_ttendance;

-- Create user
CREATE USER scan_ttendance_user WITH PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE scan_ttendance TO scan_ttendance_user;

-- Connect to database
\c scan_ttendance;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Supabase Setup

1. Create new project at [Supabase](https://supabase.com)
2. Configure authentication settings
3. Set up Row Level Security (RLS) policies
4. Configure real-time subscriptions
5. Add environment variables to your deployment

### Database Migrations

```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Backup database
pg_dump scan_ttendance > backup.sql

# Restore database
psql scan_ttendance < backup.sql
```

## SSL Configuration

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Custom SSL Certificate

```bash
# Copy certificate files
sudo cp your-certificate.crt /etc/ssl/certs/
sudo cp your-private.key /etc/ssl/private/

# Set permissions
sudo chmod 644 /etc/ssl/certs/your-certificate.crt
sudo chmod 600 /etc/ssl/private/your-private.key
```

## Monitoring and Logging

### Application Monitoring

```javascript
// Add to your application
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

### Server Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor PM2 processes
pm2 monit

# Check application logs
pm2 logs scan-ttendance

# Monitor Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Health Checks

Create a health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await db.query('SELECT 1')
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    })
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    )
  }
}
```

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version
npm --version
```

#### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in certificate.crt -text -noout

# Test SSL configuration
openssl s_client -connect your-domain.com:443

# Renew Let's Encrypt certificate
sudo certbot renew --dry-run
```

#### Performance Issues

```bash
# Monitor server resources
htop
iotop
df -h

# Check application performance
pm2 monit

# Analyze slow queries
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

### Logs and Debugging

```bash
# Application logs
pm2 logs scan-ttendance --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f

# Database logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Rollback Procedures

```bash
# Rollback with PM2
pm2 stop scan-ttendance
git checkout previous-stable-commit
npm ci --only=production
npm run build
pm2 start scan-ttendance

# Database rollback
psql scan_ttendance < backup-before-deployment.sql
```

## Security Checklist

- [ ] Environment variables secured
- [ ] SSL certificate installed and configured
- [ ] Firewall configured (only necessary ports open)
- [ ] Database access restricted
- [ ] Regular security updates applied
- [ ] Backup procedures in place
- [ ] Monitoring and alerting configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers implemented

## Performance Optimization

### Application Level

```javascript
// next.config.js
module.exports = {
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
  }
}
```

### Database Level

```sql
-- Create indexes for better performance
CREATE INDEX idx_events_organization_id ON events(organization_id);
CREATE INDEX idx_verifications_event_id ON event_verification(event_id);
CREATE INDEX idx_verifications_timestamp ON event_verification(verified_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM events WHERE organization_id = 'org-123';
```

### Server Level

```bash
# Optimize Nginx
sudo nano /etc/nginx/nginx.conf

# Add to http block:
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Enable HTTP/2
listen 443 ssl http2;
```

This deployment guide covers the most common deployment scenarios. Choose the method that best fits your infrastructure and requirements.