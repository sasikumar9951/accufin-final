# Quick Action: Storage Diagnostics

## TL;DR - What to Do Now

### 1. View System Storage Issues
```
Go to Admin Dashboard → User Management Card
Click "Diagnose" button (with RefreshCw icon)
Check browser console for table of storage mismatches
```

### 2. Fix All Storage Counters
```
In same User Management card
Click "Fix Storage" button
Click OK in confirmation dialog
Wait for toast notification showing "Fixed storage for X users"
```

### 3. Check Individual User
```
Find Milan Mandani in user list
Click her "Recalc Storage" button
Check if storage counter updates
If still 0, files are truly missing - may need restore
```

## Expected Results

### Before Fix
```
Milan Mandani:
- Storage Used: 37.48 MB
- Files Shown: 0
- Status: BROKEN
```

### After Fix
```
Milan Mandani:
- Option 1: Storage Used: 0 MB, Files: 0 (files deleted, counter corrected)
- Option 2: Storage Used: 37.48 MB, Files: 52 (files found and displayed)
```

## The Three Buttons

### 1️⃣ "Diagnose" (RefreshCw icon)
- Scans all users
- Finds storage mismatches
- Marks CRITICAL if storage reported but 0 files
- Non-destructive (read-only)
- Results shown in console table + toast

### 2️⃣ "Fix Storage" (Amber button)
- Recalculates storage for all users
- Updates counter to match actual files
- Requires confirmation
- Safe: Only updates counter field
- Fixes cases like Milan (will set to 0 or actual count)

### 3️⃣ Individual "Recalc Storage" (per user)
- Located on each user's row
- Fixes single user's storage
- Use this for targeted fixes
- Recommended after verifying with Diagnose

## Console Output You'll See

### Diagnose Results
```javascript
// Table of mismatches
┌─────────────────────────────────────────────┐
│ userId    │ email         │ reported │ actual│
├───────────┼───────────────┼──────────┼──────┤
│ 55430... │ milan@... │ 37480    │ 0      │
│ 12345... │ user@...  │ 25000    │ 1500   │
└─────────────────────────────────────────────┘

Found 5 storage mismatches (2 critical). Check console for details.
```

### Fix Results
```
Storage recalculated for all users
Updated count: 150
Sample results shown in console
```

## What Gets Fixed

| Issue | Before | After |
|-------|--------|-------|
| Milan's counter | 37.48 MB | 0 MB (or actual if files found) |
| User with orphaned files | 50 MB | Actual MB of real files |
| Mismatch > 100 KB | Not visible | Corrected in database |

## Files You Can Delete or Keep

After running Fix Storage, if:
- Files don't reappear → Files are deleted in filesystem/S3
- Counter was wrong → It's now correct
- Files reappear → They were in DB but display was broken

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Button disabled | Check session/auth |
| Console shows errors | Check server logs |
| Storage still wrong | Run Diagnose again |
| Files still missing | Check S3/filesystem directly |
| Need to restore files | Use backup if available |

## Next: Manual Verification

```bash
# If you need to manually check a user's files in database
# (This would be done by developer)

# Find Milan's files:
SELECT * FROM File 
WHERE uploadedById = 'milan-user-id' 
   OR receivedById = 'milan-user-id';

# Update her storage if needed:
UPDATE User 
SET storageUsed = 0 
WHERE id = 'milan-user-id';
```

## When to Use Each Button

### Use "Diagnose"
- ✅ To see which users have problems
- ✅ Before making any fixes
- ✅ To verify fixes worked
- ✅ Regularly to monitor system health

### Use "Fix Storage"  
- ✅ After reviewing Diagnose results
- ✅ To bulk fix all mismatches
- ✅ When confident about system integrity
- ❌ NOT if you suspect data corruption

### Use Individual "Recalc Storage"
- ✅ For targeted single-user fixes
- ✅ After investigating a specific user
- ✅ For conservative incremental fixing
- ✅ If you want to be extra cautious

## Success Indicators

✅ **Diagnose runs without errors**
✅ **Console shows mismatch table**
✅ **Toast notification appears**
✅ **Fix Storage completes**
✅ **Users can see their files**
✅ **Storage counter matches file count**

## If Something Goes Wrong

1. **Button does nothing** → Check admin session
2. **Console shows 404** → Endpoint not deployed
3. **Database error** → Check Prisma connection
4. **Fix doesn't work** → Check server logs
5. **Still have issues** → Restore from backup + redeploy

## Important Notes

- ⚠️ Takes longer if you have 1000+ users
- ⚠️ Files won't reappear if deleted from S3
- ⚠️ Only fixes counter, doesn't restore deleted files
- ✅ Safe to run multiple times
- ✅ Non-destructive (read-only for Diagnose)

---

**Last Updated**: After adding storage-diagnostics API endpoint and UI buttons
**Status**: Ready to test on production
**Deployment**: Already implemented in FileManagement.tsx
