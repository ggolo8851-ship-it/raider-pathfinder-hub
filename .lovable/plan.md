## Goal

Make College Matches accurate, complete, and richer in “More Info,” add international schools, fix broken filters/search, update Maryland graduation requirements, and put all data on a monthly auto-refresh cycle with a visible countdown.

---

## 1. College Matches — “More Info” enrichment

For every college card, the expanded panel will show:

- **🎥 Virtual Tour** — link to `youtube.com/results?search_query={college name} campus tour`
- **🏆 Niche Ranking** (replaces US News button) — deep-link to the school’s Niche page
- **📄 Latest Common Data Set (CDS)** — Google search restricted to `site:{college domain} "common data set" filetype:pdf` so it lands on the actual PDF instead of generic search
- **💰 Avg Salary 5 Years After Graduation** — deep-link to that school on the College Scorecard salary page (single source, accurate, no scraping)
- **🏛️ Setting** — Urban / Suburban / Small Town / Rural (from College Scorecard `school.locale`)
- **🥇 Best Known Programs** — 2–3 top programs derived from College Scorecard program-percentage fields (already fetched), shown as pills
- **🏟️ Athletic Division** — D1 / D2 / D3 / NAIA / None (from a curated `athletic_divisions` map merged with Scorecard)
- **📍 Room/Location** — for clubs only (already shipped, kept)

Removed: the “US News Ranking” button (replaced by Niche).

## 2. New & changed filters in College Matches

Add:

- **Athletic Division**: All / D1 / D2 / D3 / NAIA / None
- **Classification (Tier)** with new labels:
  - Tier 1 — Elite / Ivy League
  - Tier 2 — Top-Tier Research & Liberal Arts
  - Tier 3 — Highly Selective / Top Publics
  - Tier 4 — Strong Regional / Large Publics
  - (Existing fit-tiers Safety/Target/Reach stay as a separate filter row)
- **Out-of-Country**: All / US Only / International Only

Remove:

- **Tuition Type** dropdown (in-state vs out-of-state). Cards will simply show both numbers; cost filter uses out-of-state by default if available.

Fix:

- **Safety filter** currently can return 0 results when admit-rate data is missing. Fix to fall back to GPA + SAT bands when `admRate` is null and to apply the filter AFTER tier is recomputed, not before.
- **College name search** — currently passes the raw string to Scorecard `school.name=`, which only matches exact starts. Switch to `school.search=` (fuzzy) and merge results across the first 3 pages, dedupe by id. Also relax distance/state filters when a search query is active (already partially done — extend to size/cost too).

## 3. Smarter match calculation (CDS-aware)

The fit score will weight admissions factors using the latest CDS-style breakdown the user can actually act on:

- GPA, SAT/ACT, AP rigor, EC depth → already weighted, will be re-tuned to mirror the “Very Important / Important / Considered” buckets typical CDS Section C7 schools publish.
- Add a **Chance-of-admission filter into ranking** so students see schools they actually have a shot at: any school where the user’s GPA is more than 0.6 below the school’s 25th-percentile GPA *and* SAT is more than 150 below the 25th-percentile SAT gets demoted (not removed) and labeled “Far Reach.”
- Introduce a **chancePct** (0–100) shown on the card next to the fit score: derived from admit rate × user-vs-school SAT ratio × GPA fit.

## 4. International + notable abroad schools

- New table **`international_colleges`** (admin-editable from the Faculty admin pattern):
  - name, country, city, website, programs (text[]), admit_rate, avg_cost_usd, setting, athletic_division, niche_url, salary_link, notes, order_index
- Seeded with a curated list (~50 schools): Oxford, Cambridge, Imperial, LSE, UCL, Edinburgh, St Andrews, Trinity College Dublin, McGill, Toronto, UBC, Waterloo, Queen’s, ETH Zürich, EPFL, Bocconi, Sciences Po, IE Madrid, IE/IESE, Tec de Monterrey, NUS, HKU, Tokyo, Melbourne, Sydney, ANU, Auckland, etc.
- These show up in the standard match list (no special “link” treatment — same card layout as US schools, per the user’s requirement).
- New filter **Out-of-Country: International Only** surfaces just these.

## 5. Clubs page

- **Location** is already in the DB and shown in expanded view ✅ (room numbers from spreadsheet).
- Live count already shows 79 ✅. Will verify after monthly sync that no rows are dropped.

## 6. Maryland graduation requirements (2026 update)

Update `MD_GRADUATION_REQUIREMENTS` to the current PGCPS standard:

- English 4, Math 4, Science 3, Social Studies 3, PE 0.5, Health 0.5, Fine Arts 1, Tech Ed 1, World Language / AdvTech 2, Electives **3**, **Total 22**, SSL 24 hours
- Update the page to cite `https://www.pgcps.org/offices/curriculum-and-instruction/graduation-requirements` as the source.

## 7. Monthly data refresh + countdown + admin button

Backend:

- Enable `pg_cron` and `pg_net` extensions (if not already on).
- Schedule a monthly job for **00:05 on the 1st of each month** that calls a new edge function `monthly-refresh` which in turn:
  1. Triggers `sync-clubs` (Google Sheet → `clubs` table)
  2. Refreshes the College Scorecard cache table (`college_cache`) for any colleges in `bookmarks` + the curated international list
  3. Updates a row in a new `system_state` table: `last_refresh_at`, `next_refresh_at`
- New table `system_state(id text primary key, last_refresh_at timestamptz, next_refresh_at timestamptz)`. Public read; admin write.

Frontend:

- New `RefreshCountdown` component on Home showing **“Next data refresh: Xd Yh”** computed from `system_state.next_refresh_at`.
- In **Admin Dashboard**, add a **🔄 Refresh All Data Now** button that invokes `monthly-refresh` directly and shows toast of results (clubs synced, colleges cached).

## 8. Bug-fix sweep

- College search returning empty for valid names → fixed by switching to `school.search=` + multi-page merge.
- Safety filter returning empty → fixed with fallback heuristics.
- AI-rank edge functions still occasionally throwing on malformed responses → already returning 200 with `[]`; will add a UI banner “Personalized AI ranking unavailable — showing rule-based matches” when fallback fires so users aren’t confused.
- “More Info” buttons currently opening generic Google searches → CDS link uses `site:{domain} filetype:pdf`, salary uses Scorecard deep link.

---

## Technical details

**New / changed files**

- DB migrations:
  - `international_colleges` table + RLS (public read, admin write)
  - `system_state` table + RLS
  - Update `MD_GRADUATION_REQUIREMENTS` is code-only
  - Enable `pg_cron`, `pg_net`; cron job inserted via the insert tool (not migration) so the URL/anon key stay per-project
- Seed: `supabase--insert` with ~50 curated international schools
- Edge functions:
  - `monthly-refresh` (calls sync-clubs, then refreshes college cache, updates `system_state`)
  - Optional: `cache-college-scorecard` if Scorecard cache becomes its own table
- Frontend:
  - `src/lib/college-api.ts` — add `chancePct`, `setting`, `bestKnownPrograms`, `athleticDivision`, `country`; merge international list into results; fix `school.search`; tune `calculateFitScore` and `getTier`; remove tuition-type from `SearchFilters`
  - `src/lib/international-colleges.ts` — typed fetch from `international_colleges` table
  - `src/components/MatchesPage.tsx` — new filter UI (athletic div, classification tier, out-of-country), remove tuition-type dropdown, new “More Info” fields, YouTube tour button, chancePct badge
  - `src/components/HomePage.tsx` — `<RefreshCountdown />`
  - `src/components/RefreshCountdown.tsx` — new
  - `src/components/admin/AdminDashboard.tsx` — “🔄 Refresh All Data Now” button
  - `src/components/GraduationPage.tsx` + `src/lib/store.ts` — updated MD requirements, new source link
  - `src/lib/store.ts` — `MD_GRADUATION_REQUIREMENTS` updated to 22-credit 2026 standard

**Filter data structure changes**

```ts
interface SearchFilters {
  distance: number;
  minDistance: number;
  sizeFilter: string;
  maxCost: number;
  // tuitionType: REMOVED
  stateFilter: string;
  tierFilter?: string;          // existing fit tier
  classificationFilter?: string; // NEW: tier1..tier4
  athleticFilter?: string;       // NEW: d1, d2, d3, naia
  countryFilter?: string;        // NEW: us, intl
  searchQuery?: string;
}
```

**Curated tier-1..tier-4 lists** live in `src/lib/college-tiers.ts` (constants, easy to edit, no DB needed).

**No breaking changes to AI edge functions** — they keep returning 200 with empty arrays on 402/429 (already shipped).

---

## Out of scope for this round

- Per-college live ranking *numbers* from Niche/US News (would need scraping; we’re deep-linking instead).
- Pulling actual PDF text from CDS files (we deep-link the PDF instead).
- Real-time enrollment/admit-rate updates between monthly refreshes.

If you want any of those later, that becomes a follow-up.
