# Permanent Environment Variable Fix for EC2 Deployment

## THE ROOT PROBLEM
PM2 doesn't inherit exported variables from bash scripts. `pm2 env 0` shows nothing because variables are exported in the child process, not captured by PM2.

## PERMANENT SOLUTION (Foolproof)

Run these commands on EC2:

```bash
cd /home/ubuntu/accufin-final

# STEP 1: Copy .env to .env.production.local (Next.js will auto-load this)
cp .env .env.production.local

# STEP 2: Create simple launcher that doesn't rely on variable export
cat > start-prod.sh << 'EOF'
#!/bin/bash
exec npm start
EOF

chmod +x start-prod.sh

# STEP 3: Update ecosystem config - let Next.js load .env naturally
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: "accufin",
      script: "/home/ubuntu/accufin-final/start-prod.sh",
      interpreter: "bash",
      cwd: "/home/ubuntu/accufin-final",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      autorestart: true,
      max_memory_restart: "500M"
    }
  ]
};
EOF

# STEP 4: Restart PM2
pm2 stop accufin
pm2 delete accufin
pm2 start ecosystem.config.cjs
pm2 save

# STEP 5: Verify it works
sleep 3
pm2 status
curl -s https://accufinservices.ca/api/auth/signin/google -w "\n%{http_code}\n"
```

## WHY THIS WORKS
1. **Next.js automatically loads** `.env.production.local` when running in production mode
2. **No reliance on PM2 env passing** - the app loads its own config
3. **Simple, minimal launcher script** - nothing fancy, just runs npm start
4. **Auto-restart enabled** - if it crashes, PM2 restarts it automatically

## HOW NEXT.JS LOADS .env
When you run `npm start` (Next.js production server):
- Automatically loads `.env` files in order: `.env.local` → `.env.production.local` → `.env`
- This happens BEFORE any of your code runs
- Variables are available to NextAuth.js, Prisma, and all APIs

## TEST AFTER APPLYING FIX
```bash
# Verify app is online
pm2 status

# Test login endpoint (should return 302, not 502/504)
curl -v https://accufinservices.ca/api/auth/signin/google

# Check app logs for any errors
pm2 logs accufin --err
```

## IF LOGIN STILL FAILS
The issue would be the `.env` values themselves, not loading. Check:
```bash
# Verify .env.production.local exists
ls -la .env.production.local

# Check content (first line)
head -1 .env.production.local

# Check if NEXTAUTH_URL is set to production domain
grep NEXTAUTH_URL .env.production.local
```

## AUTOMATED HEALTH CHECK
Create health-check.sh to auto-detect and restart:
```bash
cat > health-check.sh << 'EOF'
#!/bin/bash
RESPONSE=$(curl -s https://accufinservices.ca/api/auth/signin/google -w "%{http_code}" -o /dev/null)
if [ "$RESPONSE" != "302" ]; then
  echo "Health check failed: $RESPONSE. Restarting..."
  cd /home/ubuntu/accufin-final
  pm2 restart accufin
fi
EOF

chmod +x health-check.sh

# Add to crontab (check every 2 minutes)
crontab -e
# Add line: */2 * * * * /home/ubuntu/accufin-final/health-check.sh
```

This is the PERMANENT, RELIABLE approach. No more variable passing issues.
