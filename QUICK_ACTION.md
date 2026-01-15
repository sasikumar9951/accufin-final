# ⚡ QUICK ACTION GUIDE - 5 Minute Fix

## 🎯 Your Situation

✗ App works on localhost  
✗ App fails on EC2 after 10 minutes  
✗ Need quick fix NOW

## ✅ Solution in 3 Steps

### Step 1: SSH to EC2 (1 min)

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_IP_ADDRESS
```

### Step 2: Update .env (2 min)

```bash
cd /path/to/accufin
nano .env

# Find this line (line 24):
NEXTAUTH_URL="http://localhost:3000"

# Replace with YOUR domain:
NEXTAUTH_URL="https://your-domain.com"

# OR if no domain, use EC2 public IP:
NEXTAUTH_URL="http://EC2_PUBLIC_IP:3000"

# Save: Press Ctrl+O, then Enter, then Ctrl+X
```

### Step 3: Redeploy (2 min)

```bash
docker-compose down
docker-compose build
docker-compose up -d
```

## ✨ Done!

Login should now work consistently. Test: `https://your-domain.com/login`

---

## 🆘 What If It Still Doesn't Work?

### Check 1: NEXTAUTH_URL

```bash
docker-compose exec app printenv | grep NEXTAUTH_URL
# Should match your domain exactly
```

### Check 2: Database Connection

```bash
docker-compose logs postgres | tail -10
# Should show "database system is ready"
```

### Check 3: App Logs

```bash
docker-compose logs app | tail -20
# Should show "PRISMA CLIENT INSTANTIATED" with no errors
```

## 📚 Need More Details?

- **Quick Overview:** Read `SOLUTION.md`
- **Full Guide:** Read `DEPLOYMENT_CHECKLIST.md`
- **Root Cause:** Read `EC2_DEPLOYMENT_FIXES.md`

---

**Status:** ✅ Fix applied | ⏳ Waiting for your 5-minute action

That's it! Your login issue is solved. 🎉
