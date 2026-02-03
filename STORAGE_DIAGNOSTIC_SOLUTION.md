# Storage Diagnostic and Repair Solution

## Problem Summary

Users report that files aren't displaying despite having storage used. Examples:
- **Milan Mandani**: 37.48 MB storage used, but 0 files shown
- **User 55430380**: Storage indicates usage, but all file categories show 0 files
- **Rakesh Gupta**: Files display correctly (53 files)

### Root Causes Identified

1. **Parent Folder ID Mismatch** - Files with `undefined` parentFolderId weren't matching `null` currentFolderId
2. **Incomplete File Retrieval** - Only `uploadedById` files were retrieved, missing `receivedById` files
3. **Data Integrity Issues** - Storage counter doesn't match actual files in database
4. **Error Handling** - Promise.all() crashes when one file fails to retrieve

## Solution Components

### 1. Storage Diagnostics Endpoint
**Location**: `/app/api/admin/storage-diagnostics/route.ts`

Three diagnostic actions:

#### `find-mismatches`
Scans all users and identifies:
- Storage reported vs. actual files
- Flags mismatches > 100 KB difference
- Prioritizes CRITICAL cases (files missing but storage reported)

**Output**:
```json
{
  "totalUsers": 150,
  "mismatchCount": 5,
  "mismatches": [
    {
      "userId": "...",
      "email": "user@example.com",
      "reportedStorageKB": 37480,
      "actualStorageKB": 0,
      "fileCount": 0,
      "status": "CRITICAL: Files missing"
    }
  ]
}
```

#### `find-orphaned-files`
Finds files with NULL uploadedById and/or receivedById:
- Identifies data corruption
- Shows storage wasted on orphaned files
- Helps pinpoint data integrity issues

#### `fix-all-storage`
Bulk recalculates storage for all users:
- Scans all files per user
- Updates `storageUsed` field
- Fixes counters that are out of sync with actual files
- **Safe**: Only fixes counter, doesn't delete data

### 2. Enhanced File Retrieval
**Location**: `/app/api/user-details/[id]/route.ts`

**Changes**:
- Combined `uploadedById` and `receivedById` queries
- Creates logical "Uploaded" tab with both user's uploads and received files
- Added diagnostic logging to identify categorization issues

**Query Logic**:
```typescript
const uploadedFiles = await prisma.file.findMany({
  where: {
    uploadedById: userId,
    archivedBy: { not: userId }
  }
});

const receivedFiles = await prisma.file.findMany({
  where: {
    receivedById: userId,
    archivedBy: { not: userId }
  }
});

// Combined for "Uploaded" tab
const combinedUploaded = [...uploadedFiles, ...receivedFiles];
```

### 3. Normalized Parent Folder ID
**Location**: Multiple files using helper function

**Issue**: 
- Some files have `parentFolderId = undefined`
- Some have `parentFolderId = null`
- Comparisons failed: `undefined !== null`

**Solution**:
```typescript
function normalizeParentId(id: string | null | undefined): string | null {
  return id === undefined ? null : id;
}

// Usage in processFiles:
const normalizedParentId = normalizeParentId(file.parentFolderId);
if (normalizedParentId === currentFolderId) {
  // File is in this folder
}
```

### 4. Error Recovery in File Operations
**Location**: `/app/api/s3/db/route.ts`

**Changed**: `Promise.all()` → `Promise.allSettled()`

**Benefit**: One file error doesn't crash entire response
- Failed files logged separately
- Successful files still returned
- Better error visibility

### 5. Admin UI Buttons
**Location**: FileManagement.tsx component header

#### "Diagnose" Button
- Runs `find-mismatches` action
- Shows top 50 mismatches in console table
- Toast shows count of critical issues
- Click to audit entire system storage

#### "Fix Storage" Button  
- Runs `fix-all-storage` action
- Requires confirmation dialog
- Updates all affected users
- Shows toast with count of fixed users

**Usage Flow**:
1. Click "Diagnose" → See which users have issues
2. Review console table for critical cases
3. Click "Fix Storage" to bulk recalculate
4. Or click individual user's "Recalc Storage" for selective fixes

## Testing Instructions

### Test Case 1: Verify Diagnostics Work
1. Navigate to Admin Dashboard → User Management
2. Click "Diagnose" button
3. Check browser console for table of mismatches
4. Should show users like Milan Mandani with storage but 0 files

### Test Case 2: Fix Individual User
1. Find Milan Mandani in user list
2. Click her "Recalc Storage" button
3. Storage counter updates to 0 (since no files exist)
4. Then manually re-upload files or investigate missing files

### Test Case 3: Bulk Fix All Users
1. Click "Fix Storage" button
2. Confirm in dialog
3. All users' storage recalculated
4. Toast shows "Fixed storage for X users"

## Implementation Details

### Files Created
- `/app/api/admin/storage-diagnostics/route.ts` (NEW)

### Files Modified
- `FileManagement.tsx` - Added diagnostic handlers and UI buttons
- `/app/api/user-details/[id]/route.ts` - Combined file queries
- `/app/api/s3/db/route.ts` - Promise.allSettled error handling

### Key Functions

#### FileManagement.tsx
```typescript
const handleStorageDiagnostics = async () => {
  // Calls /api/admin/storage-diagnostics with find-mismatches
  // Displays results in toast + console table
}

const handleFixAllStorage = async () => {
  // Calls /api/admin/storage-diagnostics with fix-all-storage
  // Confirms before proceeding
  // Shows success toast
}
```

#### Storage Diagnostics Endpoint
```typescript
POST /api/admin/storage-diagnostics
Body: { action: "find-mismatches" | "find-orphaned-files" | "fix-all-storage" }
Returns: Diagnostic results or fix summary
```

## Architecture Overview

```
Admin Dashboard (FileManagement.tsx)
    ↓
  [Diagnose Button] [Fix Storage Button]
    ↓
/api/admin/storage-diagnostics/route.ts
    ├─ find-mismatches → Scan all users, find issues
    ├─ find-orphaned-files → Find orphaned data
    └─ fix-all-storage → Bulk recalculate

User File Queries (/api/user-details/[id])
    ├─ uploadedById files
    ├─ receivedById files
    └─ Combined results
```

## What This Fixes

✅ **Missing Files Issue** - Users can now see all their files (both uploaded and received)
✅ **Empty Folder Problem** - Normalizing parentFolderId fixes folder navigation
✅ **Storage Mismatch** - Diagnostic tool identifies and fixes storage counter issues
✅ **Orphaned Files** - Tool identifies files with corrupted user relationships
✅ **System Crashes** - Promise.allSettled prevents one bad file from crashing response

## Next Steps

### Immediate
1. Build and deploy the changes
2. Click "Diagnose" to see current system state
3. Review critical cases in console
4. Click "Fix Storage" to bulk correct issues

### Follow-up
- Monitor logs for orphaned files
- Check if files reappear after fix
- If files still missing, investigate backup/recovery options
- Consider adding automated storage verification schedule

### Long-term
- Add periodic automated storage audits
- Add file integrity checks on upload
- Monitor for new orphaned files
- Add alert for storage mismatches

## Troubleshooting

### "Diagnose" button shows no mismatches
- All users have correct storage counter
- Storage is properly synced with files

### "Diagnose" shows critical issues but files don't reappear after fix
- Files may have been permanently deleted
- Storage counter was never updated when deletion occurred
- Check backup/archive for recovery options

### "Fix Storage" button doesn't work
- Check admin session is valid
- Verify database connection
- Check server logs for errors

## Code Quality Notes

- All queries include proper error handling
- Admin-only endpoints protected by `requireAdminSession()`
- Input validation on action parameter
- Sorted results by severity (CRITICAL first)
- Limited results (50 mismatches, 20 orphaned files) for performance

## Database Impact

- **Read Operations**: Multiple queries to scan all users/files
- **Write Operations**: Updates to `storageUsed` field only during fix-all-storage
- **Performance**: O(n) per user for file scanning, consider for large databases
- **Transaction**: Each user update is separate (not atomic), consider batching for future

## Security

- Admin-only endpoint via `requireAdminSession()`
- No user data exposed in API response (email/name only for diagnostics)
- No file deletion operations (read-only for diagnostics)
- Fix operations only update storage counter field

