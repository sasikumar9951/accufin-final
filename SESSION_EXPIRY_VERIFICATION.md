# Session Expiry Verification Report

## Current Configuration

### Session Timeout Settings (in .env)
- **Warning Time**: 5 minutes of inactivity
- **Session Expiry Time**: 30 minutes of inactivity
- Variables: `NEXT_PUBLIC_USER_SESSION_WARNING` and `NEXT_PUBLIC_USER_SESSION_EXPIRY`

## How Session Expiry Works

### Protected Routes Affected
The auto-logout feature is active on:
- `/dashboard/*` routes
- `/forms/*` routes
- `/api/*` routes

### Activity Detection
The system monitors user activity through these events:
- `mousedown`
- `mousemove`
- `keypress`
- `scroll`
- `touchstart`
- `click`
- `keydown`

### Session Flow

1. **Idle State Triggered**: When user is inactive for 5 minutes (NEXT_PUBLIC_USER_SESSION_WARNING)
   - Warning dialog appears
   - Toast notification shows remaining time

2. **Extension Possible**: User can extend session by any activity (click, mouse move, typing)
   - Dialog closes
   - Timers reset
   - Activity counter resets

3. **Auto Logout**: If no activity for 30 minutes (NEXT_PUBLIC_USER_SESSION_EXPIRY)
   - User is automatically logged out
   - Session token is cleared
   - Redirected to `/session-expired?at={timestamp}`

## Component Implementation

**File**: `components/IdleTimeout.tsx`

### Key Features
✅ Idle-based timeout (not absolute time)
✅ Activity detection resets timer
✅ Warning dialog with countdown
✅ Toast notifications
✅ Environment variable configuration
✅ Protected route detection
✅ Proper cleanup on unmount
✅ Global state management for cross-component sync

### Testing Checklist

- [ ] Login to dashboard
- [ ] Verify warning dialog appears after 5 minutes of inactivity
- [ ] Confirm countdown timer shows remaining time in dialog
- [ ] Move mouse/type to extend session
- [ ] Verify session extends (dialog closes, timers reset)
- [ ] Wait 30 minutes of inactivity to verify auto-logout
- [ ] Confirm redirect to `/session-expired` page
- [ ] Verify session data is cleared from storage
- [ ] Test on protected routes only (/dashboard, /forms)
- [ ] Test that public routes are NOT affected

## Browser Console Debugging

When session timeout is active, you'll see console logs:
```
SessionTimeout: WARNING - Session will expire in 5 minutes
SessionTimeout: Session will expire in [X] seconds
SessionTimeout: Error during logout: [error]
```

## Configuration Notes

- Times are in **minutes** in .env file
- Converted to milliseconds internally
- Invalid or missing values use safe defaults (5 and 30 minutes)
- Changes require application restart to take effect

## Files Modified
- `components/IdleTimeout.tsx` - Session timeout logic
- `.env` - Added session configuration variables
- No changes needed to other components (already integrated in provider.tsx)
