## Real root cause of the missing admin toggle

Your account `ggolo8851@gmail.com` IS admin in the database. But the browser can't tell, because every role lookup is returning **403 "permission denied for function has_role"**.

The RLS policies on `user_roles`, `email_blacklist`, `profiles`, etc. all call `public.has_role(auth.uid(), 'admin')`. The function exists and is `SECURITY DEFINER`, but the `authenticated` Postgres role was never granted `EXECUTE` on it. So every policy evaluation throws 403 → `useAuth` sets `isAdmin=false` → AppNav hides the 🛡️ Admin Dashboard button.

That's why no whitelisted user is getting admin mode.

## What I'll fix

### 1. Grant EXECUTE on `has_role` (DB migration — fixes admin mode)

```sql
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_blacklisted(text) TO authenticated, anon;
```

After this, sign out and back in with `ggolo8851@gmail.com` → click "RaidersMatch ▼" top-left → 🛡️ Admin Dashboard button appears.

### 2. Clubs sync — actually load all 80 clubs

Database currently has **0** clubs (sync silently failed). I'll rewrite `supabase/functions/sync-clubs/index.ts` to:

- Loop through **every tab** in the spreadsheet, not just `sheets[0]`
- Widen range to `A1:ZZ5000`
- Add more header aliases ("organization", "title", "club name", etc.)
- Trim + lowercase-dedupe names so we don't lose rows to the upsert key
- Log the detected header row + total rows read per tab so we can see exactly why anything was dropped
- Then I'll invoke it and verify count is 80 (or report which 6 are dropped and why)

### 3. Remove broken ESS logo

In `src/components/AppNav.tsx`, remove the `<img src="/ess-logo.png" />` next to "RaidersMatch". Keep the dropdown caret.

### 4. Eye icon on every password field

- Create `src/components/ui/password-input.tsx` — Input + Eye/EyeOff toggle (lucide-react, already in project)
- Replace every `<Input type="password">` in `src/components/AuthPage.tsx` with `<PasswordInput>`:
  - Sign In → password
  - Sign Up → password, security code, confirm security code
  - Forgot Password → security code, new password, confirm new password

## How admin mode works (so you know what to expect after the fix)

- The `admin_whitelist` table currently contains: `ggolo8851@gmail.com`, `soccerstar9471@gmail.com`
- When anyone signs up, a DB trigger checks the whitelist. Match → they automatically get the `admin` role.
- On the Home page, click **"RaidersMatch ▼"** in the top-left of the nav. The dropdown shows a **🛡️ Admin Dashboard** button — but only if your account has the `admin` role.
- Inside the Admin Dashboard there's an "Exit" button to switch back to user view.
- A regular user can't promote themselves — that would be a security hole. To grant admin to a new email, add it to `admin_whitelist` (I can do that anytime, just tell me which email).

After the EXECUTE grant in step 1, signing out and signing back in as `ggolo8851@gmail.com` will make the toggle appear.

## Files touched

- DB migration — grant EXECUTE on `has_role` and `is_blacklisted`
- `supabase/functions/sync-clubs/index.ts` — multi-tab + better diagnostics
- `src/components/AppNav.tsx` — remove logo `<img>`
- `src/components/ui/password-input.tsx` — new component
- `src/components/AuthPage.tsx` — swap password inputs