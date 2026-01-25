# User Deletion System - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Users Tab → Scheduled for Deletion Section                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ User List                    [Refresh] [Purge Expired] ← NEW │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ DEV ITALIYA  │ ...@... │ ... │ ... │ 1/4/26 │ Expired   │   │
│  │              │         │     │     │ 1:30PM │           │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ (Other users with time remaining)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Click "Purge Expired"
                                  ▼
                    ┌──────────────────────┐
                    │ Confirmation Dialog  │
                    │                      │
                    │ Really delete ALL    │
                    │ expired users?       │
                    │                      │
                    │ [Cancel] [Confirm]   │
                    └──────────────────────┘
                                  │
                                  │ Confirm
                                  ▼
                    ┌──────────────────────┐
                    │ Processing... ⏳      │
                    │ (Button disabled)     │
                    └──────────────────────┘
                                  │
                                  ▼
                    API: /api/cron/purge-soft-deleted
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
    Find Users          Process Each User        Clean Up
    ┌──────────┐       ┌──────────────────┐     ┌──────────┐
    │isRestor- │   ├──►│1. Remove DB      │──┐  │1. S3     │
    │able=true │   │   │   records        │  │  │   files  │
    │& expired │   │   ├──►2. Delete      │  │  │2. Emails │
    │          │   │   │   related data   │  │  │   sent   │
    │Result:   │   │   ├──►3. Send emails │  │  │3. Report │
    │1-2 users │   │   └──────────────────┘  │  │   result │
    └──────────┘   │                         │  └──────────┘
                   └─────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────┐
                    │ ✅ Success Message  │
                    │                      │
                    │ "Deleted 1 user(s)" │
                    │                      │
                    │ [Close]              │
                    └──────────────────────┘
                                  │
                                  ▼
                    ✅ List refreshes
                    User gone from table
                    Storage released
```

---

## Data Flow

### Phase 1: Soft Delete (Admin marks for deletion)

```
Admin clicks "Delete" on User
        │
        ▼
POST /api/admin/users/{id}/soft-delete
        │
        ▼
    Prisma.user.update({
      isActive: false,
      isRestorable: true,
      deleteUserAt: now + 24h
    })
        │
        ▼
User shown in "Scheduled for Deletion"
Timer starts: "1d 0h 0m"
```

### Phase 2: Grace Period (24 Hours)

```
        │
    24h ▼
    Timer
    Running
        │
   ┌────┴────┐
   │          │
   ▼          ▼
Admin Can   Time
Restore  Passes
   │          │
   ▼          ▼
   POST       Timer = 0
   Restore    Shows "Expired"
     │        (Red text)
   Active     │
   Again      │
             ▼
         Ready to Delete
```

### Phase 3: Permanent Deletion (Automatic OR Manual)

```
        OPTION A                    OPTION B
    Automatic (Cron)            Manual (Admin)
           │                         │
           ▼                         ▼
    Hourly at :00              Admin clicks
    (top of hour)              "Purge Expired"
           │                         │
           └────────────┬────────────┘
                        ▼
        POST /api/cron/purge-soft-deleted
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    Query DB        Delete Each      S3 Cleanup
    Get expired      user:            
    users            ├─ DB records    ├─ User files
                     ├─ Files         ├─ Folders
                     ├─ Responses     └─ Metadata
                     ├─ Forms
                     └─ Notifications
        │               │               │
        └───────────────┼───────────────┘
                        ▼
                  Send Emails
                  ├─ To deleted user
                  └─ To all admins
                        │
                        ▼
                  ✅ Complete
                  User permanently gone
```

---

## State Diagram

```
User States:

┌─────────────┐
│  ACTIVE     │
│  (Normal    │
│   User)     │
└──────┬──────┘
       │
       │ Admin clicks Delete
       ▼
┌─────────────────────────────┐
│  SOFT DELETED               │
│  (isActive: false)          │
│  (isRestorable: true)       │
│  (deleteUserAt: future)     │
│                             │
│  • In "Scheduled Deletion"  │
│  • Can be RESTORED          │
│  • Timer countdown shown    │
└──────┬──────────────────────┘
       │
       │ 24 hours pass OR
       │ Admin clicks "Restore"
       │
   ┌───┴──────────┐
   │              │
   ▼              ▼
DELETED        ACTIVE
(Gone from DB) (Restored)
   │              │
   │              └──────────────┐
   │                             │
   │                             ▼
   │                          (Back to Normal)
   │
   └─► Files deleted
       Storage freed
       Emails sent
```

---

## Button Location on Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Users | File Management | Notifications | Blogs | ... | ⓘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ✓ Scheduled for Deletion                                    │
│                                                              │
│ Users that can be restored before permanent deletion         │
│                     ▲                                        │
│                     │ ← Section Title                        │
│                                                              │
│                       [Refresh] [Purge Expired] ← BUTTONS   │
│                       ▲                    ▲                 │
│                       │                    │                 │
│                       Existing          NEW BUTTON           │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Name       Email    Phone  SIN  ...  Time Left     Actions   │
├─────────────────────────────────────────────────────────────┤
│ DEV ITALIYA  ...    ...    ...  ...  Expired       [Restore] │
│ (other users)                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Time Display Examples

```
┌────────────────────────────────┐
│ Time Left Column Display        │
├────────────────────────────────┤
│ "1d 2h 30m"  - 1 day remaining │
│ "5h 45m"     - 5 hours remaining│
│ "30m"        - 30 mins remaining│
│ "Expired"    - Ready to delete  │
│ (in RED)                        │
└────────────────────────────────┘
```

---

## API Call Sequence

```
BROWSER              SERVER              DATABASE

┌─────────────┐
│ Click Button│
└──────┬──────┘
       │
       │ POST /api/cron/purge-soft-deleted
       │ Headers: x-admin-secret
       ├─────────────────────────────────►
       │                    ┌──────────────────────┐
       │                    │ Check Admin Secret   │
       │                    │ (Security Check)     │
       │                    └──────────────────────┘
       │                           │
       │                           ├──► SELECT * FROM users
       │                           │    WHERE isRestorable=true
       │                           │    AND deleteUserAt <= now
       │                           │
       │                           ├──────────────────────────►
       │                           │
       │                           │ (Found expired users)
       │                           │◄──────────────────────────
       │                           │
       │                           ├──► DELETE FROM users
       │                           │    WHERE id IN (...)
       │                           │
       │                           ├──► DELETE FROM files
       │                           │    WHERE userId IN (...)
       │                           │
       │                           ├──► ... more cleanup ...
       │                           │
       │                           ├──────────────────────────►
       │                           │
       │                           │ (Data deleted)
       │                           │◄──────────────────────────
       │
       │ {count: 2, purged: [...]}
       │◄─────────────────────────────────
       │
       ├──► Show Toast:
       │    "Deleted 2 user(s)"
       │
       └──► Refresh List
            (Call API again to get
             current users)
```

---

## Error Handling Flow

```
Admin clicks "Purge Expired"
        │
        ▼
    Confirm?
        │
    ┌───┴─────────┐
    │             │
   No            Yes
    │             │
    │             ▼
    │         Try Purge
    │         │
    │    ┌────┴─────┐
    │    │           │
    │    │       Success?
    │    │    ┌──────┴──────┐
    │    │    │             │
    │    │   Yes           No
    │    │    │             │
    │    │    ▼             ▼
    │    │  ✅ Toast    ❌ Toast
    │    │  "Deleted    "Error:
    │    │   X users"    Message"
    │    │    │             │
    │    └────┴─────────────┤
    │                       │
    └───────────────────────┤
                            ▼
                    Refresh UI
                    Button Enabled
```

---

## Success Workflow

```
✅ SUCCESSFUL PURGE FLOW:

1. Admin navigates to Users tab
   └─ Dashboard opens normally

2. Scrolls to "Scheduled for Deletion"
   └─ Sees list of expired users

3. Clicks "Purge Expired" button
   └─ Button shows loading state

4. Confirms in dialog
   └─ Dialog closes, processing begins

5. API processes deletion
   ├─ Finds expired users
   ├─ Deletes from database
   ├─ Cleans S3 files
   └─ Sends emails

6. Gets response
   └─ Toast shows: "Deleted X user(s)"

7. List auto-refreshes
   └─ Deleted users gone

8. Button returns to normal
   └─ Admin can purge again if needed

✅ COMPLETE SUCCESS
```

---

## Implementation Summary

| Component | Status | Location |
|-----------|--------|----------|
| State Variable | ✅ Added | Line 718 |
| Handler Function | ✅ Added | Lines 803-828 |
| UI Button | ✅ Added | Lines 1617-1630 |
| Existing APIs | ✅ Using | No changes |
| Error Handling | ✅ Implemented | In handler |
| Toast Notifications | ✅ Configured | In handler |
| Auto-Refresh | ✅ Working | In handler |
| Mobile Responsive | ✅ Supported | Button styling |

**Status**: ✅ COMPLETE AND READY TO USE
