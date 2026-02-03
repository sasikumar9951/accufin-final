# Implementation Summary: File Display and Storage Issues

## Overview
Fixed multiple issues preventing users from seeing their files and reporting correct storage usage.

## Problems Solved

### 1. Parent Folder ID Mismatch ✅
**Problem**: Files with `parentFolderId: undefined` didn't match `currentFolderId: null` in folder navigation
**Impact**: Files appeared to disappear when navigating folders
**Solution**: Normalized undefined → null in all folder comparisons

**Code locations**:
- `FileManagement.tsx` - `processFiles()` function
- `FileBrowser.tsx` - Storage banner logic
- All delete/create folder operations

**Before**:
```typescript
if (file.parentFolderId === currentFolderId) // undefined !== null = false
```

**After**:
```typescript
const normalizeParentId = (id: string | null | undefined) => 
  id === undefined ? null : id;
if (normalizeParentId(file.parentFolderId) === currentFolderId) // null === null = true
```

---

### 2. Incomplete File Retrieval ✅
**Problem**: User file display only showed `uploadedById` files, missing `receivedById` files
**Impact**: Files sent to user from admin were invisible in "Uploaded" tab
**Solution**: Combined both file queries in user-details API

**Code location**: `/app/api/user-details/[id]/route.ts`

**Before**:
```typescript
const uploadedFiles = await prisma.file.findMany({
  where: { uploadedById: userId }
});
// Missing: Files where receivedById: userId
```

**After**:
```typescript
const uploadedFiles = await prisma.file.findMany({
  where: { uploadedById: userId }
});

const receivedFiles = await prisma.file.findMany({
  where: { receivedById: userId }
});

// Combine for display
const combinedUploadedFiles = [...uploadedFiles, ...receivedFiles];
```

---

### 3. Storage Counter Mismatch 🔴
**Problem**: Users report storage used but 0 files shown (example: Milan 37.48 MB → 0 files)
**Impact**: Can't validate if files exist or counter is wrong
**Solution**: Created diagnostic endpoint to identify and fix mismatches

**Code location**: `/app/api/admin/storage-diagnostics/route.ts` (NEW)

**Diagnostic approach**:
1. **find-mismatches**: Compare `User.storageUsed` vs actual files count
2. **find-orphaned-files**: Find files with NULL user IDs
3. **fix-all-storage**: Recalculate all users' storage from actual files

**Database query**:
```typescript
const userFiles = await prisma.file.findMany({
  where: {
    OR: [
      { uploadedById: user.id },
      { receivedById: user.id }
    ]
  }
});

const actualStorageKB = userFiles.reduce(
  (sum, f) => sum + parseSizeToKB(f.size), 0
);

// Compare with reported
if (Math.abs(actualStorageKB - user.storageUsed) > 100) {
  // Mismatch found
}
```

---

### 4. File Operation Error Handling ✅
**Problem**: `Promise.all()` crashes if one file can't fetch URL/metadata
**Impact**: Error on single file breaks entire response for all files
**Solution**: Changed to `Promise.allSettled()` for resilient error handling

**Code location**: `/app/api/s3/db/route.ts`

**Before**:
```typescript
const results = await Promise.all([
  signUrl(file1), // If this fails...
  signUrl(file2), // ...these never run
  signUrl(file3)
]);
// CRASH: entire response fails
```

**After**:
```typescript
const results = await Promise.allSettled([
  signUrl(file1), // Fails gracefully
  signUrl(file2), // Continues
  signUrl(file3)  // Continues
]);

// Filter out rejected promises
const signedFiles = results
  .map((r, i) => r.status === 'fulfilled' ? r.value : null)
  .filter(Boolean); // Still return successful files
```

---

## Admin Features Added

### 1. Storage Diagnostics Endpoint
**Path**: `POST /api/admin/storage-diagnostics`
**Actions**:
- `find-mismatches` - Scan all users for storage inconsistencies
- `find-orphaned-files` - Find files with NULL user associations
- `fix-all-storage` - Bulk recalculate all users' storage

**Response format**:
```json
{
  "totalUsers": 150,
  "mismatchCount": 5,
  "mismatches": [
    {
      "userId": "...",
      "email": "milan@company.com",
      "reportedStorageKB": 37480,
      "actualStorageKB": 0,
      "fileCount": 0,
      "difference": -37480,
      "status": "CRITICAL: Files missing"
    }
  ]
}
```

### 2. UI Buttons in FileManagement Component
**Location**: User Management card header

**Button 1: "Diagnose"**
- Calls: `POST /api/admin/storage-diagnostics` with action `find-mismatches`
- Shows: Toast with count, console table with details
- Non-destructive: Read-only operation

**Button 2: "Fix Storage"**
- Calls: `POST /api/admin/storage-diagnostics` with action `fix-all-storage`
- Shows: Toast with count of fixed users
- Requires: Confirmation dialog
- Safe: Only updates counter, doesn't delete files

**Button 3: Individual "Recalc Storage" (per user)**
- Already existed, enhanced with diagnostics

---

## Technical Details

### Normalized Parent ID Helper
Used across multiple files:
```typescript
function normalizeParentId(
  id: string | null | undefined
): string | null {
  return id === undefined ? null : id;
}
```

**Applied to**:
- Folder navigation comparisons
- Delete folder descendant checks
- Create/rename folder operations

### File Size Parsing
Handles multiple size formats:
```typescript
function parseSizeToKB(size: string | null | undefined): number {
  // Parses: "1.5 MB", "512 KB", "1024 B", "1.2", "100"
  // Returns: Kilobytes as number
}
```

### User File Categorization
Diagnostics logs file categorization:
```
Fetching files for user: {
  uploadedOnlyCount: 45,      // Files only uploaded by user
  receivedCount: 8,           // Files only received
  combinedUploadedCount: 53,  // Total in "Uploaded" tab
  totalCount: 53
}
```

---

## Files Modified

### 1. FileManagement.tsx
**Changes**:
- Added `handleStorageDiagnostics()` function
- Added `handleFixAllStorage()` function
- Added UI buttons for both functions
- Enhanced individual user recalc with diagnostics

**Key functions**:
```typescript
const handleStorageDiagnostics = async () => {
  // Runs find-mismatches
  // Shows toast + console table
}

const handleFixAllStorage = async () => {
  // Runs fix-all-storage with confirmation
  // Shows success toast
}

const handleRecalculateStorage = async (userId: string) => {
  // Individual user fix with diagnostics output
}
```

### 2. user-details/[id]/route.ts
**Changes**:
- Split `uploadedFiles` and `receivedFiles` queries
- Combined results for "Uploaded" tab
- Added diagnostic logging
- Added orphaned file detection

**Query logic**:
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

// Returns both separately and combined
```

### 3. s3/db/route.ts  
**Changes**:
- Changed `Promise.all()` to `Promise.allSettled()`
- Added error recovery logic
- Improved error logging

**Error handling**:
```typescript
const results = await Promise.allSettled(
  signUrlPromises
);

const signedFiles = results
  .map((result, idx) => {
    if (result.status === 'rejected') {
      console.error(`File ${files[idx].id}: ${result.reason}`);
      return null;
    }
    return result.value;
  })
  .filter(Boolean);
```

### 4. storage-diagnostics/route.ts (NEW)
**Purpose**: Comprehensive diagnostic and repair endpoint
**Size**: 204 lines
**Security**: Admin-only via `requireAdminSession()`

---

## Data Flow

### File Display Flow
```
User views folder
    ↓
FileManagement.tsx calls /api/user-details/[id]
    ↓
API queries uploadedById + receivedById files
    ↓
Normalizes parentFolderId (undefined → null)
    ↓
Returns combined files to component
    ↓
processFiles() builds folder tree
    ↓
Files display correctly ✅
```

### Storage Diagnostic Flow
```
Admin clicks "Diagnose"
    ↓
FileManagement calls /api/admin/storage-diagnostics
    ↓
Endpoint scans all users
    ↓
Compares User.storageUsed vs actual files
    ↓
Flags mismatches > 100 KB
    ↓
Sorts CRITICAL first (0 files, storage reported)
    ↓
Returns top 50 mismatches
    ↓
UI shows toast + console table ✅
```

### Storage Fix Flow
```
Admin clicks "Fix Storage"
    ↓
Confirms in dialog
    ↓
API iterates all users
    ↓
For each user:
  - Finds all uploadedById + receivedById files
  - Calculates actual storage in KB
  - Updates User.storageUsed field
    ↓
Returns count of fixed users
    ↓
UI shows success toast ✅
```

---

## Performance Considerations

### Diagnostic Operations
- **find-mismatches**: O(n) users × O(m) files per user
- **Recommended for**: Up to ~10,000 users
- **Optimization**: Batch queries, add pagination if needed

### File Queries
- **uploadedById + receivedById**: Two separate queries
- **Could be optimized**: Single query with OR clause
- **Current trade-off**: Clearer code, slightly more DB hits

### Storage Recalculation
- **fix-all-storage**: Sequential user updates
- **Recommendation**: Consider batch inserts for large systems
- **Current approach**: Safe but slower for 10k+ users

---

## Testing Checklist

- [ ] Build succeeds (may have Prisma engine issues on Windows)
- [ ] Admin Dashboard loads
- [ ] "Diagnose" button appears and is clickable
- [ ] "Fix Storage" button appears and is clickable
- [ ] Click "Diagnose" → console shows table
- [ ] Click "Diagnose" → toast shows count
- [ ] Review mismatches in console
- [ ] Click "Fix Storage" → confirmation dialog appears
- [ ] Click OK → toast shows "Fixed X users"
- [ ] Refresh page → see updated storage counters
- [ ] Individual "Recalc Storage" buttons still work

---

## Deployment Checklist

- [ ] Deploy API route: `/api/admin/storage-diagnostics/route.ts`
- [ ] Deploy modified FileManagement.tsx
- [ ] Deploy modified user-details/[id]/route.ts
- [ ] Deploy modified s3/db/route.ts
- [ ] Verify routes are accessible in production
- [ ] Test with sample user data
- [ ] Run "Diagnose" to baseline current state
- [ ] Review console output for issues
- [ ] Optional: Run "Fix Storage" if needed

---

## Rollback Plan

If issues occur:
1. Revert FileManagement.tsx → buttons disappear
2. Revert user-details/[id]/route.ts → files may disappear again
3. Delete storage-diagnostics/route.ts → endpoint unavailable
4. Revert s3/db/route.ts → error handling back to Promise.all

All changes are additive (new features, not breaking changes).

---

## Future Enhancements

1. **Automated Scheduling**: Run diagnostics nightly
2. **Alerts**: Notify admins of critical storage mismatches
3. **Batch Operations**: Optimize fix-all-storage for large systems
4. **Orphaned File Cleanup**: Add ability to delete orphaned files
5. **Audit Logging**: Log all diagnostic/fix operations
6. **File Recovery**: Integrate with backup system for restoration

---

## Code Quality Notes

✅ **Error handling**: All endpoints have try-catch  
✅ **Type safety**: TypeScript interfaces for responses  
✅ **Security**: Admin-only checks on all diagnostic endpoints  
✅ **Logging**: Comprehensive console logs for debugging  
✅ **Normalization**: Consistent parentFolderId handling  
✅ **Resilience**: Promise.allSettled prevents cascading failures  

---

## Known Limitations

- **No atomic transactions**: fix-all-storage updates users sequentially
- **Large dataset handling**: May be slow with 100k+ users
- **File restoration**: Diagnostic tool doesn't restore deleted files
- **S3 sync**: Doesn't verify files actually exist in S3
- **Orphaned file cleanup**: Separate operation needed

---

**Status**: Implementation complete, ready for testing
**Last updated**: After adding diagnostic buttons to UI
**Next step**: Deploy and run "Diagnose" on production
