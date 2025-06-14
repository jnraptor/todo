# User Profile Creation Error Fix

## Problem
The application was experiencing a database error when creating new users:

```
error saving new user to user_profiles table due to: {"component":"api","error":"failed to close prepared statement: ERROR: current transaction is aborted, commands ignored until end of transaction block (SQLSTATE 25P02): ERROR: record \"new\" has no field \"device_id\" (SQLSTATE 42703)","level":"error","method":"GET","msg":"500: Database error saving new user","path":"/callback","referer":"http://localhost:3000","remote_addr":"39.109.239.99","request_id":"94fc7f88737a5fec-SIN","time":"2025-06-14T20:15:10Z"}
```

## Root Cause
There were **two functions** trying to access a `device_id` field that doesn't exist in the `user_profiles` table:

1. **`handle_new_user()` function** - was trying to insert a `device_id` field during user creation
2. **`audit_trigger_function()` function** - was trying to access `device_id` for audit logging when user profiles were modified

The `user_profiles` table only has these columns:
- id (uuid, NOT NULL)
- email (text, NOT NULL) 
- full_name (text, nullable)
- avatar_url (text, nullable)
- provider (text, nullable)
- created_at (timestamp, default now())
- updated_at (timestamp, default now())

## Solution Applied

### Fix 1: handle_new_user() Function
1. **Recreated the `handle_new_user()` function** to only insert the correct fields that exist in the `user_profiles` table
2. **Added proper error handling** with exception catching to prevent user creation from failing
3. **Added null coalescing** to handle cases where user metadata might be missing
4. **Set search_path security** to prevent SQL injection
5. **Added NOT NULL constraint** on the email field for data integrity

### Fix 2: audit_trigger_function() Function
1. **Made the audit function table-aware** by checking if `device_id` column exists before accessing it
2. **Added dynamic field checking** for different table schemas (todos vs user_profiles)
3. **Added exception handling** to prevent audit failures from blocking operations
4. **Updated field tracking** to handle user_profiles specific fields (email, full_name, avatar_url, provider)

## Migration Details
- **Migration 1**: `fix_user_profile_device_id_error`
  - **Function**: `public.handle_new_user()` recreated with proper error handling
  - **Trigger**: `on_auth_user_created` recreated and enabled

- **Migration 2**: `fix_audit_trigger_device_id_error`
  - **Function**: `public.audit_trigger_function()` made table-aware and flexible
  - **Trigger**: `audit_user_profiles_changes` now works with updated function

## Verification
✅ `handle_new_user()` function exists and has correct definition
✅ `on_auth_user_created` trigger is enabled and properly configured
✅ `audit_trigger_function()` updated to handle tables without device_id
✅ `audit_user_profiles_changes` trigger is enabled and working
✅ Table structure is correct (no device_id column)
✅ Email field has NOT NULL constraint

## Expected Result
New user registration should now work without database errors. The system will:

**User Creation (`handle_new_user()` function):**
- Create user profiles with available metadata
- Handle missing metadata gracefully with default values
- Log warnings for any issues without failing user creation
- Maintain data integrity with proper constraints

**Audit Logging (`audit_trigger_function()` function):**
- Track changes to user profiles without trying to access non-existent device_id
- Log appropriate fields for each table type (todos vs user_profiles)
- Handle errors gracefully without blocking the main operation
- Maintain audit trail for security and debugging

## Files Modified
- `plans/fix_user_profile_device_id_error.sql` - First migration script
- Database: `public.handle_new_user()` function updated
- Database: `on_auth_user_created` trigger recreated
- Database: `public.audit_trigger_function()` function updated (second migration)
- Database: `audit_user_profiles_changes` trigger now works correctly