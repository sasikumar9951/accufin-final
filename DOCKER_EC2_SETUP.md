# Docker & EC2 Production Optimization Guide

## 🐳 **Recommended Dockerfile Configuration**

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN pnpm run build

FROM base AS runtime
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built application
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

# Set health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

# Run the application
CMD ["pnpm", "start"]
```

---

## 🐳 **Recommended docker-compose.yml for EC2**

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/postgres?connection_limit=5&pool_timeout=10&statement_cache_size=0
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - NODEMAILER_EMAIL=${NODEMAILER_EMAIL}
      - NODEMAILER_PASSKEY=${NODEMAILER_PASSKEY}
      - SECRET_AWS_ACCESS_KEY_ID=${SECRET_AWS_ACCESS_KEY_ID}
      - SECRET_AWS_SECRET_ACCESS_KEY=${SECRET_AWS_SECRET_ACCESS_KEY}
      - SECRET_AWS_REGION=${SECRET_AWS_REGION}
      - SECRET_AWS_S3_BUCKET=${SECRET_AWS_S3_BUCKET}
      - SECRET_MFA_ENCRYPTION_KEY=${SECRET_MFA_ENCRYPTION_KEY}
    restart: unless-stopped
    depends_on:
      - postgres
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
```

---

## 📋 **EC2 Deployment Steps**

### **1. SSH into EC2:**

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### **2. Install Docker and Docker Compose:**

```bash
sudo yum update -y
sudo yum install docker -y
sudo usermod -aG docker ec2-user
sudo systemctl start docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### **3. Clone and setup project:**

```bash
cd /opt
sudo git clone https://github.com/your-repo/accufin.git
cd accufin
```

### **4. Create `.env.production` file:**

```bash
sudo nano .env.production
```

**Add these values:**

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres?connection_limit=5&pool_timeout=10&statement_cache_size=0
NEXTAUTH_URL=https://your-domain.com  # OR http://your-ec2-ip:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
NODEMAILER_EMAIL=your-email
NODEMAILER_PASSKEY=your-passkey
SECRET_AWS_ACCESS_KEY_ID=your-aws-key
SECRET_AWS_SECRET_ACCESS_KEY=your-aws-secret
SECRET_AWS_REGION=ap-south-1
SECRET_AWS_S3_BUCKET=your-bucket
SECRET_MFA_ENCRYPTION_KEY=your-mfa-key
DB_PASSWORD=your-db-password
```

### **5. Start the application:**

```bash
docker-compose up -d
```

### **6. Monitor logs:**

```bash
docker-compose logs -f app

# Check database connection:
docker-compose logs postgres
```

---

## 🔍 **Health Checks**

### **Check if app is running:**

```bash
curl http://localhost:3000

# Check database connectivity:
docker exec accufin-postgres-1 psql -U postgres -c "SELECT 1"
```

### **Check Docker container status:**

```bash
docker ps
docker stats
```

---

## 🚨 **Troubleshooting**

### **"Too many connections" error:**

```bash
# Restart docker containers
docker-compose restart app

# Or rebuild everything
docker-compose down
docker-compose up -d
```

### **App keeps crashing:**

```bash
# Check logs
docker-compose logs app | tail -100

# Increase memory in docker-compose.yml and restart
docker-compose down
docker-compose up -d
```

### **Database connection timeout:**

```bash
# Verify DATABASE_URL is correct
docker-compose exec app printenv | grep DATABASE

# Test connection from container
docker-compose exec app psql -c "SELECT 1" $DATABASE_URL
```

---

## 🔐 **Security Notes**

1. **Use environment variables, NOT .env in production**
2. **Set AWS RDS to private subnet**
3. **Use security groups to restrict access**
4. **Store secrets in AWS Secrets Manager**
5. **Enable RDS encryption**
6. **Use HTTPS with CloudFront**

---

## 📊 **Performance Monitoring**

### **Set up CloudWatch monitoring:**

```bash
# Install CloudWatch agent on EC2
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm
```

### **Monitor these metrics:**

- RDS database connections (max: 100)
- EC2 CPU usage (should stay < 70%)
- EC2 memory usage (should stay < 80%)
- Docker container restart count (should be 0)

---

**Status:** Ready for EC2 deployment!
