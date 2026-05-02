# Build Plan

This is a lot — I'll deliver it in phases so each piece is testable. Phase 1 is the cleanup + new security-code reset (the most urgent change). Phases 2–4 add the bigger features.

---

## Phase 1 — Auth & Cleanup (do first)

### 1A. Security-code password reset (replaces email reset)

**Flow**
1. **Signup** — user picks a 6+ digit/character **Security Code** (with confirm field). Stored hashed in DB.
2. **Forgot password** — user enters email + their security code + new password. If code matches, password is updated. No email needed.
3. **Profile page** — logged-in users can change their security code (must enter current code).

**Database**
- New table `user_security_codes` (user_id, code_hash, created_at, updated_at) with RLS: users see/update only their own row.
- Hashing done in an edge function using Web Crypto SHA-256 + per-user salt (stored as `code_salt`).
- Edge function `verify-security-code-reset` (public) — takes email + code + new password, looks up user, verifies hash, calls `auth.admin.updateUserById`.
- Rate-limit attempts (max 5 per email per hour) using a small `security_code_attempts` table.

**UI changes**
- `AuthPage` signup form: add Security Code + Confirm fields. Block submit if missing/mismatched.
- `AuthPage` forgot view: replace "send code" flow with "enter email + security code + new password" form.
- New small section in user settings to change the security code.

### 1B. Remove email reset + newsletter

- Delete edge functions: `send-password-reset`, `request-password-reset`, `verify-password-reset`, `subscribe-newsletter`, `auth-email-hook`, `process-email-queue`.
- Delete `src/components/EmailSubscriptionBox.tsx` and any references.
- Delete `src/pages/ResetPassword.tsx` and its route in `App.tsx`.
- Drop `password_reset_requests`, `email_subscriptions`, and email-infra tables (`email_send_log`, `email_send_state`, `suppressed_emails`, `email_unsubscribe_tokens`).
- Remove email-template files under `supabase/functions/_shared/email-templates/`.
- Tell user: after this, no emails are sent from the app at all (intentional).

### 1C. Favicon/logo

- I need the actual image file uploaded into chat (the ibb.co URL alone won't reliably embed). Once uploaded, I'll wire it as `/favicon.png` and use it in the auth/nav header.

---

## Phase 2 — College Match Engine (the meaty one)

### 2A. Math-based fit %

Real weighted scoring (0–100) per college using user profile vs college data:
- Academic fit (35%): GPA vs college 25/75 GPA range, SAT vs 25/75 SAT range, rigor.
- Financial fit (15%): net price vs user budget, aid generosity.
- Size/setting fit (10%): preferred enrollment range, urban/suburban/rural match.
- Program fit (20%): intended major present + strength signal.
- Outcomes (10%): grad rate, median salary 10y out.
- Selectivity realism (10%): admit rate banded against student profile (reach/match/safety).

Each component returns 0–100; final = weighted sum, rounded. Show breakdown on hover/expand.

### 2B. New filters & data fields

Add to college records (cached in `colleges_cache` table, refreshed by sync job):
- **Tier**: Tier 1 / Tier 2 / Tier 3 / Tier 4 / Hidden Ivies / Service Academies / International
- CDS (Common Data Set) link
- US News / Forbes / WSJ ranking (whichever available)
- "Programs known for" (top 3-5 majors by reputation)
- Setting (urban/suburban/rural)
- NCAA Division (I/II/III/NAIA/none)
- Test-optional flag (current cycle)
- Median salary 10y after entry (Scorecard PAYBYR_MEDIAN)

Filter UI: collapsible sidebar on Matches page with these as multi-select chips.

### 2C. Per-college YouTube virtual tour

- Add `tour_video_id` text column on college record.
- Admin can paste a YouTube URL/ID per college from the admin dashboard.
- College detail page embeds the video (lazy-loaded iframe).

---

## Phase 3 — Other Features

### 3A. Mobile layout polish
Sweep Matches, Portfolio, Essay, Transcripts, SAT, Clubs, Graduation, Home, Admin pages for sub-768px issues (overflow tables → cards, sticky header behavior, touch targets ≥44px, modals fit screen).

### 3B. Job search beyond Indeed
Add LinkedIn Jobs link generator + Glassdoor + Handshake (for college students). Each opens in new tab with prefilled search. (No scraping — just deep links.)

### 3C. Essay grader rebuild
Rebuild scoring rubric using Gemini 2.5 Pro:
- Hook (10), Voice/authenticity (20), Specificity & detail (20), Structure & pacing (15), Insight/reflection (20), Mechanics (10), College fit signal (5).
- Returns /100 + per-criterion score + 3 brutal but actionable critiques + 1 "rewrite this line" example.

### 3D. ESS Faculty page (admin-editable)
- New `faculty` table (name, title, photo_url, bio, email, subjects).
- Public `/faculty` route — card grid.
- Admin CRUD in AdminDashboard.

---

## Phase 4 — Infra & Bookmarks

### 4A. Monthly auto-sync cron
- pg_cron job, 1st of month, calls `sync-clubs` + new `sync-colleges` edge functions.
- Logs run results to `sync_log` table; admin can see last run + status.

### 4B. CIPA content filter
- Edge function that screens user-generated text (essays, profile) against a denylist + AI moderation (Gemini safety filter).
- Blocks save + shows friendly error if content violates.

### 4C. AI learning model
This is vague — I'll interpret as "match results improve as user bookmarks/dismisses colleges." Implementation: store bookmark/dismiss signals, adjust the fit % weights per user (e.g., if user only bookmarks small rural colleges, bump those component weights). Want a different interpretation? Tell me in your reply.

### 4D. Bookmarks migration
You said keep local — I'll **leave bookmarks in localStorage for now** and just leave the existing `bookmarks` table untouched until you're ready to flip the switch. No work this phase.

---

## What I need from you to start

1. **Confirm Phase 1 first** — I'll do auth + cleanup in the next message, ship it, you test, then I move to Phase 2.
2. **Upload the favicon image** (drag-drop into chat). Without the file I can't wire it.
3. **Security code rules** — minimum 6 chars, alphanumeric, case-insensitive? (Default: 6+ chars, alphanumeric, case-insensitive unless you say otherwise.)
4. **AI learning model** — confirm the interpretation above or describe what you actually want.

Reply "go phase 1" (or with answers above) and I'll start.

---

## Why phased

Doing all of this in one shot would: (a) take hours, (b) make any single bug hard to isolate, (c) ship untested code. Each phase is ~30–60 min of work and ends at a testable state.
