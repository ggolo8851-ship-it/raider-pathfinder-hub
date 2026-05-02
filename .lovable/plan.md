## Scope

This is a large request. I'll break it into 5 focused workstreams. Each is independently shippable.

---

## 1. College Matches — quick fixes

**Institutional Classification filter**
- Remove `PBI` and `ANNH` from the classification options and badges.
- Keep: HBCU, HSI, AANAPISI, TCU, PWI.
- Bug fix: the filter currently drops colleges that have the flag = 0 *and* colleges where the field is `null`. Switch to "show only schools where flag = 1" only when a specific classification is selected; "All" shows everything. Also pull `school.minority_serving.*` fields from Scorecard for every result (some flags are missing because we only request them on detail load).

**Virtual Tour link**
- Replace the YouTube search link with a Niche virtual-tour deep link:
  `https://www.niche.com/colleges/{slug}/visit/` where `{slug}` is the lowercased, hyphenated college name (e.g. `university-of-maryland-college-park`). Niche redirects unknown slugs to a search, so it works for every college. Label: "🎥 Virtual Tour (Niche) ↗".

**Chance-of-admission disclaimer**
- Under the `chancePct` badge in the More Info panel, add a yellow callout:
  > ⚠️ This estimate is based only on GPA, test scores, and admit rate. It does **not** account for your essays, recommendation letters, interviews, or demonstrated interest — your real chances may be meaningfully higher.

---

## 2. Matching engine — use full profile, not just the quiz

Today `calculateFitScore` in `src/lib/college-api.ts` mostly weights GPA/SAT/major/distance and the vibe quiz. I'll extend it so the **portfolio** drives the score too:

- **APs** → +rigor signal, scaled against the school's selectivity (more APs help more for reach schools).
- **Clubs / extracurriculars / achievements** → +EC depth signal (count + leadership keywords like "president", "captain", "founder").
- **Service hours** → +civic-fit signal, with a bigger boost for schools that publish high community-engagement enrollment.
- **Sports** → matched against `athleticDivision` (a varsity athlete gets a boost on D1/D2/D3 schools that field that sport — keyword match against the sport name in the school's program list as a proxy).
- **GPA + SAT chance** → folded into the score as a multiplier, not just used for tier bucketing, so a far-reach school is demoted but not deleted.

`chancePct` formula stays as-is but is now ONE input to the fit score rather than a side display.

---

## 3. Randomized adaptive quiz (the big one)

Replace the fixed 10-question vibe poll with a pooled, randomized, weighted quiz.

**New file `src/lib/quiz-engine.ts`**
- Question bank: 6 categories (Academics, Career, Campus Life, Personality, Cost, Location) with 12–18 questions each. Each question:
  ```ts
  { id, category, text, optionA, optionB, vectorA, vectorB, topicTags }
  ```
  where `vectorA`/`vectorB` are partial `UserVector` deltas.
- Selector: given a `seed` (stored per session in localStorage so a refresh keeps the same quiz), pick **3 questions per category** with no overlapping `topicTags`, then shuffle the combined list. Seeded RNG (mulberry32) so the seed is reproducible.
- Anti-repeat: store seen-question hashes in `localStorage` per user; the selector deprioritizes questions already seen in the last 2 sessions.

**Scoring → `UserVector`**
```ts
{ academics, career, social, cost, independence, prestige, location, workload, extracurricular }
```
Each 0–1, normalized at the end.

**College vector**
- Derived in `college-api.ts` from existing Scorecard fields (admit rate → prestige, size → social, cost → cost level, locale → location, % STEM/business → workload, etc.). No new API calls.

**Final match score**
```
final = baseFit * 0.6  +  vectorSimilarity * 0.3  +  chancePct/100 * 0.1
```
plus a 10% "exploration" slot in the top-15 reserved for schools just outside the predicted top to avoid overfitting (per the user's anti-bias rule).

**Adaptive layer (lightweight, client-side)**
- Track bookmark / "not interested" clicks per category. Adjust per-user category weights with `α = 0.05`. Persist in `profiles.profile_data.adaptive_weights` (already a free-form jsonb column, no migration needed).

**UI**
- Update `src/components/VibePollQuiz.tsx` to drive off the engine instead of the static `VIBE_POLL_QUESTIONS` array. Same look (progress bar, A/B cards, dots), no design changes.
- Add a "🎲 Retake with new questions" button that bumps the seed.

---

## 4. Admin-managed custom tabs

**DB**: new table `custom_tabs`
```
id uuid PK, slug text unique, title text, icon text,
order_index int, content jsonb, published bool,
created_at, updated_at
```
RLS: public read where `published = true`; admin-only write.

**Frontend**
- `src/lib/custom-tabs.ts` — fetch/cache published tabs.
- `src/components/AppNav.tsx` — append custom tabs to the nav after the built-ins, ordered by `order_index`.
- `src/pages/Index.tsx` — when `page` matches a custom slug, render `<CustomTabPage tab={...} />`.
- `src/components/CustomTabPage.tsx` — renders the `content` jsonb (supports blocks: `heading`, `text`, `image`, `link`, `card-grid`). Read-only for normal users.
- `src/components/admin/CustomTabsAdminPanel.tsx` — list/create/edit/delete/reorder + a simple block editor. Wired into `AdminDashboard`. Normal users never see this.

---

## 5. Out of scope for this round

- Collaborative-filtering "users like you" boost — needs aggregated cross-user data and a separate analytics pipeline. I'll stub the hook so it can be added later.
- Implicit feedback (scroll depth, time on card) — same reason; explicit bookmark/dismiss feedback is in.
- Niche scraping for actual embedded tour videos — Niche blocks scraping, so we deep-link to their visit page (which hosts the tour) instead.

---

## File list

**Edited**
- `src/lib/college-api.ts` — classification fix, vector derivation, portfolio-driven fit score
- `src/components/MatchesPage.tsx` — Niche tour link, chance disclaimer, classification options, custom tab routing handoff
- `src/components/VibePollQuiz.tsx` — drive off quiz engine
- `src/components/AppNav.tsx` — custom tabs
- `src/pages/Index.tsx` — custom tab routing
- `src/components/admin/AdminDashboard.tsx` — wire admin panel

**New**
- `src/lib/quiz-engine.ts`
- `src/lib/custom-tabs.ts`
- `src/components/CustomTabPage.tsx`
- `src/components/admin/CustomTabsAdminPanel.tsx`
- migration: `custom_tabs` table + RLS

Approve and I'll ship it in one pass.
