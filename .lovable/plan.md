
# RaidersMatch Major Overhaul

A large request broken into 7 independent workstreams. Each can be implemented and tested separately.

---

## 1. Wipe all users (fresh start)

**What happens:**
- Delete every row from `auth.users` (cascades to `profiles`, `bookmarks`, `user_roles`, `user_security_codes`, `admin_audit_log` user refs).
- Keep `admin_whitelist`, `clubs`, `college_overrides`, `site_settings`, `email_blacklist` intact.
- Existing localStorage data (`getUsers()`/`saveUsers()` in `src/lib/store.ts`) is per-browser; clear it on first load by bumping a `STORAGE_VERSION` key so any cached profile is wiped client-side too.
- The existing `handle_new_user` trigger + `sync_admin_from_whitelist` trigger already auto-grant admin to whitelisted emails, so admins re-signup → instantly admin.

**Risk:** Irreversible. After this you'll need to re-create your account and re-onboard.

---

## 2. AI-powered college matching (Lovable AI re-ranks)

**Approach:** Hybrid — keep fast Department-of-Ed Scorecard search for the candidate pool, then have Gemini re-rank the top 30 using the user's full profile.

**Backend:** new edge function `ai-rank-colleges` (verify_jwt = true)
- Input: full user profile (major, GPA, SAT/ACT, APs, clubs, sports, extracurriculars, achievements, interests, vibe answers, address) + array of ~30 candidate colleges with their key stats.
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with structured tool-calling output:
  ```
  { rankings: [{ college_id, ai_fit_score (0-100), reason (1-2 sentences) }] }
  ```
- System prompt emphasizes: weigh THIS student's specific clubs/achievements/major-alignment over generic prestige; explain fit in plain English referencing the student's own data.
- Handle 429/402 by falling back to current rule-based score.

**Frontend:** `src/lib/college-api.ts` + `src/components/MatchesPage.tsx`
- After local `searchColleges()` returns candidates, call `ai-rank-colleges` with top 30.
- Replace `fitScore` with AI score, sort by it, store `aiReason` on each result.
- Show the AI reason inside the expanded "More Info" panel as **🤖 Why this fits you:** ...
- Loading state: "🤖 AI personalizing your matches…"

**Personalization guarantee:** because the AI prompt receives every input the user filled out, two different students with overlapping major but different clubs/achievements get genuinely different rankings and explanations.

---

## 3. Fix college name search

**Current bug:** `collegeSearch` in `MatchesPage.tsx` is passed as a filter, but the Scorecard request only loads a single page — searches like "Maryland" miss schools beyond the first page.

**Fix in `src/lib/college-api.ts`:**
- When `searchQuery` is non-empty, switch the Scorecard query from `school.name` substring to the API's built-in `school.name=...` operator with `__icontains` and bump `per_page=100`, paginating up to 3 pages (300 results).
- Keep all other filters (location override, tuition type, etc.) live so the user can still narrow results.
- Treat search as an OR-with-name: if the search box has text, ignore distance/state restrictions by default but show a "Filters still applied" toggle so the user can re-enable them.
- Run AI re-rank only on top 30 of the search results.

---

## 4. Department of Education API health

- `API_KEY` in `src/lib/college-api.ts` is currently hardcoded — verify it still returns 200 with a quick fetch in the edge function on deploy. If it's expired, rotate it and store as `COLLEGE_SCORECARD_API_KEY` secret + read it in a thin proxy edge function so we never block on browser CORS.
- Add explicit error surfacing: when Scorecard returns 0 results or HTTP error, show an inline banner instead of silently returning `[]`.

---

## 5. Clubs ↔ Google Sheet daily sync

The connector + `sync-clubs` edge function already exist (see `supabase/functions/sync-clubs/index.ts`). What's missing: the URL is passed in the request body, and there's no schedule.

**Steps:**
1. Confirm the Google Sheets connector is linked (you provided the sheet URL: `https://docs.google.com/spreadsheets/d/1mCnzMpRY0l1TbBooJl2MVQxCCLrq7dnL/`).
2. Hardcode that sheet URL inside `sync-clubs` as the default when the body is empty (so cron can call it with no args).
3. Enable `pg_cron` + `pg_net` extensions, then schedule via `supabase--insert`:
   ```
   cron.schedule('sync-clubs-daily', '0 6 * * *', $$ select net.http_post(url:='.../sync-clubs', ...) $$)
   ```
4. Profile clubs list source: `src/lib/store.ts` exports `ERHS_CLUBS` as a hardcoded array. Replace it with a runtime fetch from the `clubs` table (cached in React Query or simple `useEffect`). `OnboardingFlow.tsx` already uses `ERHS_CLUBS` — switch to the live list. Same for any portfolio club picker.

---

## 6. Career matches — personalize with user data

Currently `getCareerMatches()` in `college-api.ts` runs a static rule engine. Make it AI-driven the same way:
- New edge function `ai-rank-careers` calls Gemini with the full profile + a curated list of careers.
- Returns `{ careers: [{ title, fit_score, reason, related_majors }] }` ranked specifically for THIS student.
- `MatchesPage.tsx` careers tab calls it and renders.
- Fallback to the existing rule-based list on any AI error.

---

## 7. UI cleanups

| Where | Change |
|---|---|
| `src/components/AuthPage.tsx` | Remove the `<img src="/ess-logo.png">` next to "RaidersMatch" |
| `src/components/AppNav.tsx` | Remove "📸 ESS Instagram" item from dropdown; remove "⚙️ Settings" item from dropdown |
| Instagram link wherever it remains | Replace href with `https://www.instagram.com/erhsstudentsforsuccess/` (no `target` change needed — the "blocked" message is from the previous URL) |
| `src/components/OnboardingFlow.tsx` AP step | Add a search input above the AP checkbox list (mirrors existing club search) |
| Same file, clubs step | Already has search; verify works against the new live clubs list |
| Portfolio AP/club editors | Add the same search filters there |

---

## Admin/User mode toggle (already works)

The home dropdown already shows **🛡️ Admin Dashboard** when `isAdmin === true` (`AppNav.tsx` lines 48-53), and `Index.tsx` switches on `adminMode`. After the wipe + your re-signup, the whitelist trigger fires → role granted → button appears. No changes needed beyond confirming after the wipe.

---

## Technical details

**Files created:**
- `supabase/functions/ai-rank-colleges/index.ts`
- `supabase/functions/ai-rank-careers/index.ts`
- Migration: enable pg_cron, pg_net, schedule sync-clubs

**Files modified:**
- `src/lib/college-api.ts` — paginated search, AI re-rank wiring, live clubs fetch helper
- `src/lib/store.ts` — bump STORAGE_VERSION; deprecate hardcoded `ERHS_CLUBS` (keep as fallback)
- `src/components/MatchesPage.tsx` — call AI rank, show AI reason, careers from new function
- `src/components/AuthPage.tsx` — remove logo
- `src/components/AppNav.tsx` — drop Instagram + Settings menu items
- `src/components/OnboardingFlow.tsx` — AP search input, clubs from DB
- `supabase/functions/sync-clubs/index.ts` — default sheet URL constant

**SQL operations:**
- `delete from auth.users` (cascades) — via `supabase--insert`
- Enable extensions + cron schedule — via `supabase--insert`

**Order of execution:** wipe users last, after everything else is verified, so you don't lose your test account mid-build.
