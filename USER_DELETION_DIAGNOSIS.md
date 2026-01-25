# User Permanent Deletion Issue Analysis & Fix

## Problem Identified

User "DEV ITALIYA" is showing as "Expired" but hasn't been permanently deleted from the database.

### Root Cause
The automatic permanent deletion cron job may not be running properly:

1. **Scheduled Frequency**: Currently set to run hourly at the top of the hour (`scheduleHourlyTopOfHour`)
2. **Issue**: The cron script at `/scripts/index.js` runs in a separate Node process that must be started manually
3. **Missing**: No monitoring/restart mechanism if the cron process dies
4. **Risk**: If the server restarts, the cron job doesn't automatically restart

## Current Flow

### Soft Delete (Admin Action)
1. Admin clicks delete on user
2. API: `/api/admin/users/[id]/soft-delete`
3. Sets: `isRestorable: true`, `deleteUserAt: now + 24h`, `isActive: false`
4. Database: User still exists, marked for deletion

### Scheduled Permanent Deletion (Should happen automatically)
1. Cron triggers hourly: `/api/cron/purge-soft-deleted`
2. Queries: Users where `isRestorable: true` AND `deleteUserAt <= now`
3. For each expired user:
   - Calls: `/api/admin/users/[id]/delete` (actual deletion)
   - Sends: Permanent deletion emails
   - Result: User completely removed from DB + S3 files deleted

## Solutions

### Solution 1: Manual Trigger (Immediate)
You can manually trigger the deletion of expired users without waiting for the cron job.

**Via curl:**
```bash
curl -X POST 'http://localhost:3000/api/cron/purge-soft-deleted' \
  -H 'x-admin-secret: admin'
```

**Or manually in admin dashboard** (if UI button exists)

### Solution 2: Ensure Cron Script is Running (Required)
The cron script must be running in the background:

**Start the cron job:**
```bash
npm run cron
```

This should output:
```
[cron] Loaded environment variables from .env file
[cron] will run hourly at the top of the hour
[cron] next run in XX seconds
```

**For production:**
- Use PM2, systemd, or Docker to keep cron running
- Monitor the process and auto-restart on failure

### Solution 3: Add Verification Endpoint (Recommended)
I recommend adding a dashboard button to check and trigger manual purge.

## Testing the Fix

1. **Check Current Status:**
   ```bash
   # In your app browser dev tools console:
   fetch('/api/cron/purge-soft-deleted', {
     method: 'POST',
     headers: { 'x-admin-secret': 'admin' }
   })
   .then(r => r.json())
   .then(d => console.log(d))
   ```

2. **Expected Response if users are deleted:**
   ```json
   {
     "count": 1,
     "purged": [
       {
         "id": "user_id_here",
         "email": "user@example.com"
       }
     ]
   }
   ```

3. **Refresh the Users page** - expired users should be gone from "Scheduled for Deletion" section

## Files Involved

- `scripts/index.js` - Cron scheduler
- `app/api/cron/purge-soft-deleted/route.ts` - Finds expired users
- `app/api/admin/users/[id]/delete/route.ts` - Performs actual deletion
- `app/api/admin/users/[id]/soft-delete/route.ts` - Initial soft delete
- `lib/email.ts` - Sends deletion notification emails

## Configuration

### .env Variables Used
```
ADMIN_SECRET=admin  # Required for cron authentication
NEXTAUTH_URL=http://localhost:3000  # Required for cron to call API
```

### Check Logs
Monitor these for issues:
```
[cron] Next run in X seconds
[cron] POST /api/cron/purge-soft-deleted -> 200
Cron purge failed for user: [id]
```

## Verification Checklist

✅ Soft delete sets `isRestorable: true` and `deleteUserAt`
✅ User shows "Expired" after 24 hours  
❌ User NOT being deleted (ISSUE) - Cron not running
⚠️ Check: Is cron script running in background?
⚠️ Check: Can API endpoint reach `/api/cron/purge-soft-deleted`?

## Quick Fix Commands

```bash
# Start cron job
npm run cron

# Manually trigger purge in another terminal
curl -X POST 'http://localhost:3000/api/cron/purge-soft-deleted' \
  -H 'x-admin-secret: admin'

# Check npm processes
npm ls -g pm2
ps aux | grep node
```
