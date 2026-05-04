## Goal

Ship a multi-part platform upgrade: editable copy across Auth/Home/Nav, fix international-college matching (Imperial College London tier), strip salary data, add a stronger admission-chance algorithm with a clearer disclaimer, track site visits, detect in-app browsers, surface Google↔email account-linking, and tighten matching math.

---

## 1. Wrap Auth, Home, and Nav text in `EditableText`

Wrap the top headings, button labels, hero copy, and nav link labels. Each gets a stable `textKey` like `auth.title`, `home.welcome_prefix`, `nav.matches`. Default value = the current literal so non-admins see no change. Admins double-click to edit; values persist in `text_overrides`.

Files:

- `src/components/AuthPage.tsx` — wrap "RaidersMatch", section headings, sign-in/sign-up button labels, "Continue with Google", help text.
- `src/components/HomePage.tsx` — wrap "Welcome, …!", "ERHS Students for Success", the mission paragraph, the SSL/aid headings, link button labels (FAFSA, MHEC, etc.), "Raider Roadmap", "Your Profile Snapshot".
- `src/components/AppNav.tsx` — wrap brand "RaidersMatch" and each nav link label (`Home`, `Portfolio`, `Matches`, …). Custom-tab labels stay dynamic from DB.

Note: `EditableText` already exists. The interpolated `{username}` and `{gradYear}` stay as React expressions outside the wrapped text.

---

## 2. Fix international matching + Imperial College London tier

Problem: intl schools are tiered purely off `admissionRate` thresholds, ignoring user GPA/SAT, so Imperial (~14% admit) is locked to "Far Reach" for everyone.

Fix:

- In `src/lib/college-api.ts` (the intl mapping block ~lines 614–629): replace the hard admit-rate ladder with the same `getTier(...)` call US schools use, passing `userSat`, `gpaNum`, `aps.length`, `testOptional`. This lets a strong applicant reach "Possible Reach" or better at intl schools.
- Recompute `chancePct` for intl using the same `estimateChancePct` so it can read above 1–2% for top profiles.
- Verify `src/lib/international-colleges.ts` exposes a realistic `admissionRate` for Imperial (0.14) and `satAvg` (1480 equivalent). Update the seed row if it's missing/too low.

---

## 3. Stronger matching algorithm + clearer disclaimer

Replace the piecewise admit-chance estimator with a logistic model that uses GPA, test score (or test-optional flag), AP rigor, EC depth, leadership signal, achievements, and service hours — not only test/GPA/admit-rate.

Pseudocode (in `estimateChancePct`):

```
z =  β0
   + β1 * (userGpa - 3.5)
   + β2 * ((userSat - schoolSat)/100)         // 0 if test-optional or missing
   + β3 * apRigorScore
   + β4 * ecDepthScore
   + β5 * leadershipFlag
   + β6 * achievementsScore
   + β7 * serviceHoursScore
   + β8 * log(admRate)                          // school selectivity baseline
chance = 1 / (1 + exp(-z))                      // logistic squashing → 0..1
```

Clamp 1–99. Coefficients chosen so a 3.9 GPA, 1500 SAT, 6 APs, strong ECs at a 14% admit-rate school produces a realistic ~25–40% chance instead of <5%. Apply the same vector inside `calculateFitScore`'s "chance multiplier" stage so fit is consistent.

Disclaimer (UI in `MatchesPage.tsx`): replace the existing chance-warning copy with: "Estimated chance is a model — it factors GPA, test scores, AP rigor, ECs, leadership, achievements, and service hours, but cannot see essays, recs, demonstrated interest, legacy, or institutional priorities. Treat it as directional, not predictive." Show the same line on each match card's "More info" panel and above the results list.

---

## 4. Remove salary data

- `CollegeResult.avgSalary10yr` field stays in the type as optional (to avoid touching every consumer) but stop populating it in `searchColleges` and remove the Scorecard fields `latest.earnings.10_yrs_after_entry.median` / `6_yrs_after_entry.median` from the `fields` list.
- Delete every salary render in `src/components/MatchesPage.tsx` (badges, more-info row, sort options if any).

---

## 5. Visit / open tracking

Add lightweight client-side analytics:

- New table `page_visits` (migration): `user_id uuid null`, `email text null`, `path text`, `visited_at timestamptz default now()`. RLS: anyone authenticated can insert their own row; admins read all.
- New `src/lib/visit-tracker.ts`: on app mount and on every `visibilitychange → visible` and on every `setPage` in `Index.tsx`, insert a row (debounced 1s, deduped per path within 30s).
- Wire into `Index.tsx` `useEffect` watching `page` + a `document.visibilitychange` listener.
- Surface a simple "Visits this week" counter in `AdminDashboard` (read-only count query).

---

## 6. In-app browser detection (Instagram / TikTok / FB / X)

- New `src/lib/in-app-browser.ts`: regex on `navigator.userAgent` for `Instagram|FBAN|FBAV|TikTok|Twitter|Line|MicroMessenger`.
- In `AuthPage.tsx`, if detected, render a top banner: "You're in an in-app browser. Google sign-in won't work here — tap the ⋯ menu and choose 'Open in Browser' (Safari/Chrome)." Disable the Google button (still show email/password).

---

## 7. Account-linking (Google ↔ email)

Supabase auto-links on verified email when both providers verify the same address. Add a UX layer:

- After `signInWithGoogle` succeeds, query `auth.users.identities` via `supabase.auth.getUser()`; if more than one identity is present, show toast "Linked your Google sign-in to your existing email account."
- If a user tries email/password sign-up with an email that already has a Google identity (returns `User already registered`), surface: "This email is already registered with Google. Use 'Continue with Google' instead."
- No DB changes needed; logic lives in `src/lib/auth.ts` and `AuthPage.tsx`.

---

## 8. General bugs found while exploring (fix in pass)

- `EditableText.tsx` cleanup-effect bug: `return () => { unsub; }` discards the unsubscribe call — should be `return unsub;` so listeners actually detach. Fix.
- ANNH/PBI Scorecard fields are still requested but unused — drop from `fields` list.

---

## Technical Section

**Database migration (one):**

```sql
create table public.page_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  path text not null,
  visited_at timestamptz not null default now()
);
alter table public.page_visits enable row level security;
create policy "users insert own visits" on public.page_visits
  for insert with check (auth.uid() = user_id or user_id is null);
create policy "admins read visits" on public.page_visits
  for select using (has_role(auth.uid(),'admin'));
create index page_visits_visited_at_idx on public.page_visits(visited_at desc);
```

**Files touched (summary):**

- Edit: `src/components/AuthPage.tsx`, `HomePage.tsx`, `AppNav.tsx`, `MatchesPage.tsx`, `EditableText.tsx`, `Index.tsx`, `lib/college-api.ts`, `lib/international-colleges.ts`, `lib/auth.ts`, `components/admin/AdminDashboard.tsx`
- Create: `src/lib/visit-tracker.ts`, `src/lib/in-app-browser.ts`, one supabase migration

**Verification:**

- Build passes (handled by harness).
- Sanity-check Imperial College London now returns a non-Far-Reach tier for a 3.9/1500/6AP profile.
- Confirm salary text/badges no longer render anywhere in `MatchesPage`.
- Admin double-clicks any wrapped label and edit persists across reload.(also make sure edits in portfollio constantly mathes changes in matches pepercentages and all that it should be different percentages for different info/ it should never be the ame and use info/data from real students across the net to make sure the students match and adminr ate matches if their stats is also similar to exisiting students)