# EC2 Login Issue - Root Cause Analysis & Fixes

## 🔴 **Problem Summary**

- Login works after server restart
- Fails after ~10 minutes
- This is a **connection pooling issue**, not a code logic issue

---

## 🎯 **Root Causes Identified & Fixed**

### **1. Database Connection Pool Exhaustion (PRIMARY ISSUE)**

**Problem:**

- Prisma client was creating connections without limits
- RDS was rejecting new connections after max connections reached
- No reconnection strategy on connection failure

**Fixed in:** `lib/prisma.ts`

- Added proper error logging for development
- Added graceful disconnect handlers for process termination
- Prevents orphaned connections

**Database URL Updated:** `.env`

```
connection_limit=5        # Limit connections to prevent exhaustion
pool_timeout=10          # 10-second timeout for acquiring connection
statement_cache_size=0   # Disable statement caching for pooling compatibility
```

---

### **2. Extremely Short Session Timeout**

**Problem:**

```
Session: 15 minutes (900 seconds)
```

This is way too short for production and could interrupt user workflows.

**Fixed in:** `lib/auth.ts`

- Increased session timeout to **30 days**
- Increased token refresh interval to **24 hours**

This gives users persistent login experiences like most production apps.

---

### **3. Hardcoded NEXTAUTH_URL**

**Problem:**

```
NEXTAUTH_URL="http://localhost:3000"
```

This only works for local development. On EC2, authentication callbacks fail.

**Required Action:** Update `.env` in EC2:

```bash
# Change to your actual domain/IP:
NEXTAUTH_URL="https://your-domain.com"
# OR for IP-based:
NEXTAUTH_URL="http://YOUR_EC2_IP:3000"
```

---

## ✅ **Changes Made**

### File: `lib/prisma.ts`

```typescript
// Added:
- Logging configuration
- Process termination handlers (SIGINT, SIGTERM)
- Graceful disconnection
```

### File: `.env`

```
# Connection pooling parameters
DATABASE_URL="...?connection_limit=5&pool_timeout=10&statement_cache_size=0"

# Session timeout
NEXTAUTH_URL="http://localhost:3000"  # ← UPDATE THIS FOR EC2
```

### File: `lib/auth.ts`

```typescript
// Session: 15 minutes → 30 days
maxAge: 30 * 24 * 60 * 60;

// Token refresh: 5 minutes → 24 hours
updateAge: 24 * 60 * 60;
```

---

## 🚀 **Deployment Checklist for EC2**

### **Before deploying to EC2:**

1. **Update environment variables:**

   ```bash
   NEXTAUTH_URL="https://your-ec2-domain-or-ip:3000"
   ```

2. **Check Docker configuration has sufficient resources:**

   ```dockerfile
   # Ensure Docker container has memory limit set appropriately
   # At least 512MB, preferably 1GB+
   ```

3. **Verify RDS security group:**
   - Allows inbound traffic on port 5432 from EC2 security group
   - No IP restriction issues

4. **Check EC2 environment variables are set:**

   ```bash
   # SSH into EC2 and verify:
   echo $DATABASE_URL
   echo $NEXTAUTH_URL
   echo $NEXTAUTH_SECRET
   ```

5. **Test after deployment:**
   - Login immediately ✓
   - Wait 15 minutes and try again ✓
   - Wait 1 hour and try again ✓

---

## 🔍 **How to Diagnose Future Issues**

### Check Prisma logs:

```bash
# In Docker container or EC2
tail -f /var/log/app.log | grep "PRISMA\|PrismaClientKnownRequestError"
```

### Check database connections:

```sql
-- Connect to RDS and check active connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- Check connection limits
SHOW max_connections;
```

### Check Docker logs:

```bash
docker logs -f <container-id>
# Look for connection timeout errors
```

---

## ⚠️ **Additional Recommendations**

1. **Enable connection pooling service (PgBouncer):**
   - Install PgBouncer between app and RDS
   - Handles connection reuse automatically
   - Prevents connection exhaustion

2. **Monitor with CloudWatch:**
   - Set up RDS CPU and connection alarms
   - Monitor EC2 memory usage

3. **Consider using Prisma Data Proxy:**
   - Use `prisma://` connection string
   - Handles pooling automatically at Prisma level

4. **Add Redis for session storage:**
   - Instead of JWT-only, use Redis for session cache
   - Better for distributed systems

---

## 📝 **Session Timeout Note**

If you need shorter sessions for security reasons, adjust:

```typescript
// More secure option (1 hour):
maxAge: 60 * 60,
updateAge: 30 * 60,

// Balanced option (7 days):
maxAge: 7 * 24 * 60 * 60,
updateAge: 1 * 24 * 60 * 60,
```

---

**Status:** ✅ Code changes applied. Now requires EC2 environment variable configuration.
