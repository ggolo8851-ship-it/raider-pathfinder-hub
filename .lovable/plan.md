## Admin Mode — Full Rebuild

### Already in place (keep)
- `admin_whitelist`, `email_blacklist`, `admin_audit_log`, `user_roles`, `has_role()`, `handle_new_user()` trigger that auto-grants admin to whitelisted emails and blocks blacklisted emails at signup.
- `ggolo8851@gmail.com` and `soccerstar9471@gmail.com` already in `admin_whitelist`.
- Existing `AdminDashboard.tsx` with Dashboard / Access Control / Users / Clubs / Logs panels and audit logging on whitelist/blacklist changes.
- `useAuth` already detects `isAdmin` and `isBlocked`, and signs out blacklisted users automatically.
- "Admin" entry from the top nav (kept per your answer).

### What to build

**1. Access model hardening**
- Keep current login flow (one login page for everyone).
- On login: blacklist check → instant sign-out + "Access Denied" screen (already wired, verify it can't be bypassed).
- Whitelisted email → user gets `admin` role via existing trigger; clicks "Admin" in nav to enter dashboard.
- Block self-blacklist + require typed confirmation when blacklisting (today uses `confirm()`; upgrade to typed-email confirm dialog).
- "Move email between lists" action (one-click whitelist↔blacklist with audit entry on both sides).

**2. New DB tables (one migration)**
- `college_overrides` — `college_id` PK, `tier` (1–4 / hidden_ivy / service_academy), `rankings` jsonb, `known_programs` text[], `cds_url`, `official_url`, `notes`, `updated_by`, timestamps. Public read, admin write.
- `site_settings` — single-row key/value JSON for: `logo_url`, `homepage_hero`, `dropdown_links` jsonb, `mobile_spacing` jsonb. Public read, admin write.
- `admin_nicknames` — `admin_user_id` PK, `nickname`, `assigned_by`. Admin read/write only. (Backs the "assign nicknames to other admins" requirement.)
- All with RLS using `has_role(auth.uid(), 'admin')`.

**3. Dashboard layout (`src/components/admin/`)**
Split the monolithic `AdminDashboard.tsx` into:
```
admin/
  AdminLayout.tsx        ← sidebar + top bar shell
  AdminTopBar.tsx        ← global search, alert bell, profile menu
  sections/
    OverviewSection.tsx
    AccessControlSection.tsx     (refactor of existing)
    CollegesSection.tsx          (new)
    ClubsSection.tsx             (refactor of existing)
    UsersSection.tsx             (expanded)
    FiltersSettingsSection.tsx   (stub - your answer: ignore for now)
    ContentUISection.tsx         (logo, hero text, dropdown links — text/links only)
    DataIntegritySection.tsx
    AuditLogSection.tsx          (refactor of existing, + nickname assignment UI)
```

**4. Section details**

- **Overview**: total users, total admins, blocked count, total colleges, total clubs, last 10 audit entries, simple alert list (e.g. colleges with missing CDS link, duplicate clubs).
- **Access Control**: existing two-panel UI + search + "Move to other list" button + typed-email confirm modal + safeguard preventing self-blacklist.
- **Colleges**: searchable table of all colleges (from `college-api.ts` source); per-row "Edit" opens drawer to set tier, rankings (US News / Niche / QS), known-programs tags, CDS URL, official URL. Saves to `college_overrides`. `college-api.ts` reads overrides and merges them into every result so user-side search/match instantly reflects edits.
- **Clubs**: keep the Google-Sheet sync + table. Add inline edit for classification, delete for duplicates, "Add club" button.
- **Users**: searchable list, per-row actions: reset security code (calls existing `set-security-code` edge fn in admin mode), delete account (admin RPC that cascades), flag suspicious (boolean column in profiles).
- **Content & UI**: form to edit logo URL, homepage hero headline/subhead, dropdown link list. No layout/visual editor (deferred — too broad for this pass; called out in UI with a note).
- **Filters & Settings**: stub with "Coming soon" copy per your answer.
- **Data Integrity**: button "Sync clubs", button "Re-scan colleges for missing data", "Test search" input that runs the match engine on a sample profile and shows top 10 results.
- **Audit Log**: existing table + new "Admin Nicknames" panel (admins can assign friendly names to other admins; nickname shown in log rows).

**5. Top bar (always visible across sections)**
- Global search input (debounced) — searches users by email and colleges by name; results dropdown jumps to that record.
- Alert bell with red dot if `data integrity` checks find issues.
- Profile menu: shows `nickname (email)`, links to "Security Settings" (change own security code), Logout, Exit Admin.

**6. User-side wiring**
- `MatchesPage` / college list: import overrides and merge so admin tier/ranking/program edits show up live.
- `HomePage` / nav: read `site_settings` for logo URL, hero text, dropdown links.
- No changes to filter UI (per your answer).

**7. Safety + audit**
- Every mutation in every admin section calls `admin_audit_log` with `{action, target, details}`.
- All sensitive actions (delete user, blacklist, remove admin) gated behind a confirm modal.

### Technical notes
- All edits use `supabase` client; no new edge functions required except optional `admin-delete-user` (uses service role) for hard user deletion. If skipped, "delete account" only deletes the profile row, not `auth.users`.
- College overrides merge happens in `src/lib/college-api.ts` via a single `getOverrides()` cached call; small perf cost, big UX win.
- `Content & UI` section deliberately avoids freeform HTML/CSS — we render only known fields to prevent admins from breaking the site.

### Out of scope (will note in chat after build)
- Full visual layout editor (Content & UI question went unanswered → defaulting to text/links only).
- Filter on/off toggles (you said ignore).
- Email-based password reset (already replaced by security code).