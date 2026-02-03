# 🚀 EC2 Deployment Checklist

## ✅ Code Changes Completed

- [x] **lib/prisma.ts** - Added connection handling & process termination
- [x] **lib/auth.ts** - Increased session timeout from 15 min to 30 days
- [x] **.env** - Added connection pool parameters

---

## ⚠️ CRITICAL: Manual Steps Required on EC2

### Before You Deploy:

1. **Update NEXTAUTH_URL in .env on EC2:**

   ```bash
   # SSH into EC2
   ssh -i your-key.pem ec2-user@your-ec2-ip

   # Edit .env file
   nano .env

   # Find this line:
   NEXTAUTH_URL="http://localhost:3000"

   # Change it to ONE of these:
   NEXTAUTH_URL="https://your-domain.com"              # If using domain
   NEXTAUTH_URL="http://ec2-public-ip:3000"           # If using IP
   NEXTAUTH_URL="https://your-domain.com"             # If using HTTPS

   # Save: Ctrl+O, Enter, Ctrl+X
   ```

2. **Optional: Adjust session timeout if needed**
   - Default is 30 days (good for most apps)
   - If you want shorter: Edit `lib/auth.ts` line 301-302
   - Options: 1 hour, 7 days, 30 days

---

## 🐳 Docker Deployment Steps

### Step 1: Pull Latest Code

```bash
cd /path/to/accufin
git pull origin main
# or
git pull origin master
```

### Step 2: Stop Current Container

```bash
docker-compose down
```

### Step 3: Build with New Code

```bash
docker-compose build
```

### Step 4: Start New Container

```bash
docker-compose up -d
```

### Step 5: Verify Everything Started

```bash
# Check containers running
docker ps

# Check app logs
docker-compose logs app | head -50

# Should see:
# - "PRISMA CLIENT INSTANTIATED"
# - No "error" or "connection" errors
# - "ready - started server on 0.0.0.0:3000"
```

---

## 🧪 Testing After Deployment

### Test 1: Immediate Login (T=0 min)

```bash
# Open browser and go to:
https://your-domain.com/login

# Or if using IP:
http://ec2-ip:3000/login

# Log in with credentials
# ✓ Should work
```

### Test 2: After 1 Hour (T=60 min)

```bash
# Go back to the site without closing browser
https://your-domain.com

# ✓ Should still be logged in
```

### Test 3: After 24 Hours (T=1440 min)

```bash
# Still logged in?
# ✓ Yes, session lasts 30 days
```

### Test 4: Check Logs for Errors

```bash
docker-compose logs app | grep -i "error\|connection\|timeout"

# Should show:
# ✓ No connection errors
# ✓ No timeout errors
# ✓ Only normal log messages
```

---

## 🔍 Troubleshooting

### Problem: "ERR_FAILED" when trying to login

**Cause:** NEXTAUTH_URL doesn't match your domain
**Fix:**

```bash
# Check what's set
docker-compose exec app printenv | grep NEXTAUTH_URL

# Should match your domain exactly
# Update .env and redeploy if different
```

### Problem: "Too many connections" in logs

**Cause:** Connection pooling still not working
**Fix:**

```bash
# Verify DATABASE_URL has pool parameters
docker-compose exec app printenv | grep DATABASE_URL

# Should contain: connection_limit=5&pool_timeout=10&statement_cache_size=0

# If not, update .env and redeploy
docker-compose down
docker-compose build
docker-compose up -d
```

### Problem: Docker container keeps restarting

**Cause:** App crashing, likely environment variable issue
**Fix:**

```bash
# Check logs for specific error
docker-compose logs app | tail -20

# Common issues:
# 1. DATABASE_URL wrong → Update .env
# 2. NEXTAUTH_URL wrong → Update .env
# 3. Google credentials wrong → Update .env

# Restart after fix
docker-compose down
docker-compose up -d
```

---

## 📋 Pre-Deployment Verification Checklist

### Verify Code Changes

- [ ] `lib/prisma.ts` has graceful disconnect handlers
- [ ] `.env` has connection_limit=5 in DATABASE_URL
- [ ] `lib/auth.ts` has maxAge: 30 _ 24 _ 60 \* 60
- [ ] `NEXTAUTH_URL` updated in EC2's .env file ⚠️

### Verify EC2 Configuration

- [ ] EC2 security group allows port 3000 inbound
- [ ] RDS security group allows EC2 to connect on port 5432
- [ ] All environment variables set in .env
- [ ] Git repository is cloned on EC2
- [ ] Docker and Docker Compose installed on EC2

### Verify RDS Configuration

- [ ] Database URL is correct
- [ ] Database credentials are correct
- [ ] Database is reachable from EC2
- [ ] SSL mode is set to 'require'

---

## 📊 Quick Status Check Commands

### After Deployment

```bash
# 1. Check app is running
curl http://localhost:3000

# 2. Check database connection
docker-compose exec app psql "$DATABASE_URL" -c "SELECT 1;"

# 3. Check active connections (should be low)
docker-compose exec app psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# 4. Check logs for errors
docker-compose logs app | grep -i error

# 5. Check all containers healthy
docker-compose ps
```

---

## 🆘 Emergency Rollback

If something breaks badly:

```bash
# Stop everything
docker-compose down

# Go back to previous version
git checkout previous-commit

# Rebuild and restart
docker-compose build
docker-compose up -d
```

---

## 📞 Support Reference

**If you see these errors, here's what to do:**

| Error                    | Cause                     | Fix                                   |
| ------------------------ | ------------------------- | ------------------------------------- |
| `ECONNREFUSED`           | Can't reach database      | Check RDS security group              |
| `too many connections`   | Connection pool exhausted | Wait 30s, pool should reset           |
| `ERR_FAILED` on login    | NEXTAUTH_URL wrong        | Update .env and redeploy              |
| `undefined` secrets      | Missing env vars          | Check .env has all required vars      |
| Container keeps crashing | App error                 | Check logs: `docker-compose logs app` |

---

## ✨ Success Indicators

After deployment, you should see:

```
✓ Can login with credentials
✓ Can login with Google OAuth
✓ Can access dashboard
✓ Still logged in after 1 hour
✓ Still logged in after 24 hours
✓ No errors in docker logs
✓ Database connections showing 1-5 active (not 50+)
```

---

## 📝 Documentation Files

- **QUICKFIX_LOGIN_ISSUE.md** - Quick overview of what was fixed
- **EC2_DEPLOYMENT_FIXES.md** - Detailed root cause analysis
- **DOCKER_EC2_SETUP.md** - Complete Docker/EC2 setup guide
- **CODE_CHANGES.md** - Visual summary of code changes
- **DEPLOYMENT_CHECKLIST.md** - This file

---

**Last Updated:** January 2026
**Status:** Ready for deployment ✅
