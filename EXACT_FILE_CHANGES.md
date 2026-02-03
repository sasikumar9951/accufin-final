# Exact File Changes Reference

## Quick Navigation

| File | Type | Changes | Lines |
|------|------|---------|-------|
| FileManagement.tsx | Modified | Diagnostic handlers + buttons | 1537-1770 |
| user-details/[id]/route.ts | Modified | Combined file queries | 45-90 |
| s3/db/route.ts | Modified | Promise.allSettled error handling | 120-155 |
| storage-diagnostics/route.ts | NEW | Diagnostic endpoint | 1-204 |

---

## 1. FileManagement.tsx
**Path**: `/app/(auth-pages)/dashboard/_components/admin/FileManagement.tsx`

### Change 1: Handler for Storage Diagnostics (Line 1537)
```typescript
const handleStorageDiagnostics = async () => {
  try {
    setLoading(true);
    
    const res = await apiFetch(`/api/admin/storage-diagnostics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "find-mismatches" }),
      logoutOn401: false,
    });

    if (!res.ok) {
      throw new Error("Failed to run diagnostics");
    }

    const data = await res.json();
    
    if (data.mismatchCount === 0) {
      toast.success("✓ All users' storage is correct!");
      return;
    }

    const criticalCount = data.mismatches.filter(
      (m: any) => m.status === "CRITICAL: Files missing"
    ).length;

    toast.error(
      `Found ${data.mismatchCount} storage mismatches (${criticalCount} critical). Check console for details.`
    );
    
    console.table(data.mismatches);
    console.log("Full diagnostics data:", data);
  } catch (error) {
    console.error("Error running diagnostics:", error);
    toast.error("Failed to run storage diagnostics");
  } finally {
    setLoading(false);
  }
};
```

### Change 2: Handler for Fixing All Storage (Line 1575)
```typescript
const handleFixAllStorage = async () => {
  const confirmed = window.confirm(
    "This will recalculate storage for ALL users. Continue?"
  );
  if (!confirmed) return;

  try {
    setLoading(true);
    
    const res = await apiFetch(`/api/admin/storage-diagnostics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fix-all-storage" }),
      logoutOn401: false,
    });

    if (!res.ok) {
      throw new Error("Failed to fix storage");
    }

    const data = await res.json();
    
    toast.success(`Fixed storage for ${data.updatedCount} users`);
    console.log("Storage fix results:", data);
    
    // Refresh user list to show updated storage
    refetchUsers();
  } catch (error) {
    console.error("Error fixing storage:", error);
    toast.error("Failed to fix storage");
  } finally {
    setLoading(false);
  }
};
```

### Change 3: UI Buttons (Line 1740-1770)
**Location**: User Management card header, next to collapse button

```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => setIsUsersCollapsed(!isUsersCollapsed)}
  className="h-8 w-8 p-0"
>
  {isUsersCollapsed ? (
    <ChevronDown className="h-4 w-4" />
  ) : (
    <ChevronUp className="h-4 w-4" />
  )}
</Button>
<Button
  variant="outline"
  size="sm"
  onClick={handleStorageDiagnostics}
  disabled={loading}
  title="Check storage consistency"
  className="text-xs"
>
  <RefreshCw className="w-3 h-3 mr-1" />
  Diagnose
</Button>
<Button
  variant="outline"
  size="sm"
  onClick={handleFixAllStorage}
  disabled={loading}
  title="Fix all storage issues"
  className="text-xs bg-amber-50 hover:bg-amber-100"
>
  Fix Storage
</Button>
```

---

## 2. user-details/[id]/route.ts
**Path**: `/app/api/(auth-pages)/user-details/[id]/route.ts`

### Change: Combined File Queries (Around line 45-90)

**BEFORE**:
```typescript
const uploadedFiles = await prisma.file.findMany({
  where: {
    uploadedById: userId,
    archivedBy: { not: userId },
  },
  orderBy: { createdAt: "desc" },
});

return NextResponse.json({
  uploadedFiles,
  receivedFiles: [], // Missing!
  archivedFiles: archiveData,
  totalStorageUsed: user.storageUsed,
});
```

**AFTER**:
```typescript
const uploadedFiles = await prisma.file.findMany({
  where: {
    uploadedById: userId,
    archivedBy: { not: userId },
  },
  orderBy: { createdAt: "desc" },
});

// NEW: Fetch files received by user
const receivedFiles = await prisma.file.findMany({
  where: {
    receivedById: userId,
    archivedBy: { not: userId },
  },
  orderBy: { createdAt: "desc" },
});

// NEW: Combine for "Uploaded" tab display
const combinedUploadedFiles = [...uploadedFiles, ...receivedFiles]
  .sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

// NEW: Diagnostic logging
console.log(
  `Fetching files for user ${userId}:`,
  {
    uploadedOnlyCount: uploadedFiles.length,
    receivedCount: receivedFiles.length,
    combinedUploadedCount: combinedUploadedFiles.length,
    totalCount: combinedUploadedFiles.length + (archivedFiles?.length || 0),
  }
);

return NextResponse.json({
  uploadedFiles: combinedUploadedFiles,
  receivedFiles, // Now populated
  archivedFiles: archiveData,
  totalStorageUsed: user.storageUsed,
});
```

**Key Addition**: 
- Separate query for `receivedById` files
- Combine results sorted by date
- Return both combined and separate

---

## 3. s3/db/route.ts
**Path**: `/app/api/s3/db/route.ts`

### Change: Promise Error Handling (Around line 120-155)

**BEFORE**:
```typescript
try {
  const signUrlPromises = files.map(file =>
    s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.key,
      Expires: 3600,
    })
  );

  const signedUrls = await Promise.all(signUrlPromises);
  // If ANY promise rejects, entire response fails
  
  const result = files.map((file, index) => ({
    ...file,
    url: signedUrls[index],
  }));

  return NextResponse.json(result);
} catch (error) {
  // ONE FAILURE = COMPLETE FAILURE
  return NextResponse.json({ error: 'Failed to sign URLs' }, { status: 500 });
}
```

**AFTER**:
```typescript
try {
  const signUrlPromises = files.map(file =>
    s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.key,
      Expires: 3600,
    })
  );

  // NEW: Use Promise.allSettled instead of Promise.all
  const signedResults = await Promise.allSettled(signUrlPromises);
  
  // NEW: Handle mixed success/failure
  const result = files.map((file, index) => {
    const urlResult = signedResults[index];
    
    if (urlResult.status === 'fulfilled') {
      return {
        ...file,
        url: urlResult.value,
      };
    } else {
      console.error(`Failed to sign URL for ${file.key}:`, urlResult.reason);
      return {
        ...file,
        url: null, // Indicate failure
        error: 'Failed to generate URL',
      };
    }
  });

  // NEW: Filter out failed URLs if needed
  const successfulFiles = result.filter(f => f.url !== null);
  
  return NextResponse.json({
    total: result.length,
    successful: successfulFiles.length,
    files: successfulFiles,
  });
} catch (error) {
  console.error('Critical error in s3/db:', error);
  return NextResponse.json(
    { error: 'Failed to process files' },
    { status: 500 }
  );
}
```

**Key Change**:
- `Promise.all()` → `Promise.allSettled()`
- Individual error handling per file
- Still returns successful results
- Better error logging

---

## 4. storage-diagnostics/route.ts (NEW FILE)
**Path**: `/app/api/admin/storage-diagnostics/route.ts`
**Size**: 204 lines
**Status**: NEW - Create this file

### File Content:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

function parseSizeToKB(size: string | null | undefined): number {
  if (!size) return 0;
  const trimmed = size.trim();
  const sizeRegex = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i;
  const match = sizeRegex.exec(trimmed);
  if (!match) return 0;
  const value = Number.parseFloat(match[1]);
  const unit = (match[2] || "KB").toUpperCase();
  switch (unit) {
    case "B":
      return value / 1024;
    case "KB":
      return value;
    case "MB":
      return value * 1024;
    case "GB":
      return value * 1024 * 1024;
    default:
      return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    const { action } = await request.json();

    if (action === "find-mismatches") {
      // Find all users with storage mismatches
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          storageUsed: true,
          maxStorageLimit: true,
          _count: {
            select: {
              uploadedFiles: true,
              receivedFiles: true,
            },
          },
        },
      });

      const mismatches = [];

      for (const user of users) {
        // Find actual files for this user
        const userFiles = await prisma.file.findMany({
          where: {
            OR: [
              { uploadedById: user.id },
              { receivedById: user.id },
            ],
          },
          select: {
            id: true,
            size: true,
          },
        });

        const actualStorageKB = userFiles.reduce(
          (sum, f) => sum + parseSizeToKB(f.size),
          0
        );
        const roundedActual = Math.round(actualStorageKB);
        const reportedStorage = user.storageUsed || 0;

        // Flag if there's a mismatch
        if (Math.abs(roundedActual - reportedStorage) > 100) {
          // More than 100KB difference
          mismatches.push({
            userId: user.id,
            email: user.email,
            name: user.name,
            reportedStorageKB: reportedStorage,
            actualStorageKB: roundedActual,
            fileCount: userFiles.length,
            difference: roundedActual - reportedStorage,
            status:
              roundedActual === 0 && reportedStorage > 0
                ? "CRITICAL: Files missing"
                : "MISMATCH",
          });
        }
      }

      // Sort by severity (missing files first, then largest mismatches)
      mismatches.sort((a, b) => {
        const aIsCritical = a.status === "CRITICAL: Files missing" ? 1 : 0;
        const bIsCritical = b.status === "CRITICAL: Files missing" ? 1 : 0;
        if (aIsCritical !== bIsCritical) return bIsCritical - aIsCritical;
        return Math.abs(b.difference) - Math.abs(a.difference);
      });

      return NextResponse.json({
        totalUsers: users.length,
        mismatchCount: mismatches.length,
        mismatches: mismatches.slice(0, 50), // Return top 50
      });
    }

    if (action === "find-orphaned-files") {
      // Find files with NULL user IDs
      const orphanedFiles = await prisma.file.findMany({
        where: {
          AND: [
            {
              OR: [
                { uploadedById: null },
                { receivedById: null },
              ],
            },
            {
              type: { not: "folder" },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          size: true,
          uploadedById: true,
          receivedById: true,
          createdAt: true,
        },
      });

      const orphanedStorageKB = orphanedFiles.reduce(
        (sum, f) => sum + parseSizeToKB(f.size),
        0
      );

      return NextResponse.json({
        orphanedFileCount: orphanedFiles.length,
        orphanedStorageKB: Math.round(orphanedStorageKB),
        files: orphanedFiles.slice(0, 20),
      });
    }

    if (action === "fix-all-storage") {
      // Recalculate storage for ALL users
      const users = await prisma.user.findMany({
        select: { id: true },
      });

      const results = [];

      for (const user of users) {
        const userFiles = await prisma.file.findMany({
          where: {
            OR: [
              { uploadedById: user.id },
              { receivedById: user.id },
            ],
          },
          select: {
            size: true,
          },
        });

        const totalKB = Math.round(
          userFiles.reduce((sum, f) => sum + parseSizeToKB(f.size), 0)
        );

        await prisma.user.update({
          where: { id: user.id },
          data: { storageUsed: totalKB },
        });

        results.push({
          userId: user.id,
          newStorageUsed: totalKB,
          fileCount: userFiles.length,
        });
      }

      return NextResponse.json({
        message: "Storage recalculated for all users",
        updatedCount: results.length,
        results: results.filter(r => r.newStorageUsed > 0).slice(0, 20),
      });
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    );
  } catch (e) {
    console.error("Error in storage diagnostics:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## Implementation Checklist

### Phase 1: Copy Files
- [ ] Copy storage-diagnostics/route.ts content to `/app/api/admin/storage-diagnostics/route.ts`
- [ ] Create `/app/api/admin/` directory if it doesn't exist

### Phase 2: Update FileManagement.tsx
- [ ] Find line 1537 (search for "handleRecalculateStorage" function)
- [ ] Add `handleStorageDiagnostics` function before `handleRecalculateStorage`
- [ ] Add `handleFixAllStorage` function after `handleStorageDiagnostics`
- [ ] Find line 1740 (User Management card header, collapse button)
- [ ] Add the two new diagnostic buttons after collapse button
- [ ] Verify `RefreshCw` is imported (line 14)

### Phase 3: Update user-details/[id]/route.ts
- [ ] Find the uploadedFiles query (around line 50)
- [ ] Add receivedFiles query after uploadedFiles query
- [ ] Combine results in return statement
- [ ] Add diagnostic logging console.log

### Phase 4: Update s3/db/route.ts
- [ ] Find Promise.all() call (around line 130)
- [ ] Replace with Promise.allSettled()
- [ ] Add error handling for rejected promises
- [ ] Update return structure

### Phase 5: Testing
- [ ] Build project: `npm run build`
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to Admin Dashboard
- [ ] Verify "Diagnose" button appears
- [ ] Verify "Fix Storage" button appears
- [ ] Click "Diagnose" → check console
- [ ] Test on sample user data first

---

## Line-by-Line Validation

### FileManagement.tsx
```
Imports: ✓ Line 14 - RefreshCw imported
Handler 1: Line 1537-1573 - handleStorageDiagnostics
Handler 2: Line 1575-1618 - handleFixAllStorage
Button 1: Line 1751-1759 - Diagnose button
Button 2: Line 1760-1768 - Fix Storage button
```

### user-details/[id]/route.ts
```
Uploaded query: ~Line 50-58
Received query: ~Line 60-68 (NEW)
Combine logic: ~Line 70-75 (NEW)
Logging: ~Line 77-85 (NEW)
Return: ~Line 87-92
```

### s3/db/route.ts
```
Promise.all: Line 130 → Promise.allSettled
Error handling: Lines 132-145 (NEW)
Return structure: Lines 147-155 (NEW)
```

### storage-diagnostics/route.ts
```
NEW FILE: /app/api/admin/storage-diagnostics/route.ts
Total lines: 204
Three actions: find-mismatches, find-orphaned-files, fix-all-storage
```

---

## Dependencies Check

### Imports Verified
- ✅ NextRequest, NextResponse - Built-in
- ✅ requireAdminSession, error - Existing in lib/api-helpers
- ✅ prisma - Already configured
- ✅ apiFetch - Already imported in FileManagement
- ✅ toast - Already imported in FileManagement
- ✅ RefreshCw - Already imported in FileManagement
- ✅ Button - Already imported in FileManagement

### No New Dependencies Required
- ✅ No npm packages to install
- ✅ No new environment variables
- ✅ No database migrations needed
- ✅ No schema changes required

---

**Ready to implement**: All changes documented and ready to apply
**Verification**: After each change, rebuild to catch errors early
**Testing priority**: Run on dev environment first

