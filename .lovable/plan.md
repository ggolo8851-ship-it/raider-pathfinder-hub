## Goals

1. Add a **Legal & Privacy consent** page that every user must agree to once (new signups + existing users on next visit).
2. Fix the **international match clustering bug** — every intl school currently gets fitScore 75 or 55, so all percentages look identical. Replace with a real per-school calculation.
3. **Expand the international college dataset** (Asia + Europe focus) and **add AANAPISI institutions**, with dedupe (no school added twice).
4. Add **Google Analytics (G-YYQ681MRDY)** to `index.html`.
5. Small polish: international school matching must reflect country/selectivity differences.

## Implementation

### 1. Legal consent (one-time gate)

- **DB**: new column `profiles.legal_accepted_at TIMESTAMPTZ NULL` (nullable, no default → null = not yet accepted).
- **New component** `src/components/LegalConsentPage.tsx` — full RaiderMatch Legal & Privacy text (the version supplied), single "I Agree & Continue" button. Writes `legal_accepted_at = now()` to the user's profile row.
- **Wire into `Index.tsx**`: after auth + before onboarding, check `profiles.legal_accepted_at`. If null → render `LegalConsentPage`. After accept, continue to onboarding/home.
- **Signup flow** still works: new users hit it the first time they reach `Index`; existing users hit it once on their next session.

### 2. International match scoring fix

Inside `searchColleges` in `src/lib/college-api.ts`, replace the hardcoded `cr.fitScore = matchesMajor ? 75 : 55` with the same `calculateFitScore(...)` call US schools use, adapted to the intl row (synthesize the minimal Scorecard-shape object it expects, or call a small `calculateIntlFitScore` helper that mirrors the logic but uses `row.programs`, `row.admit_rate`, `cr.satAvg`).

Each intl school's `fitScore` and `chancePct` will then vary based on:

- user GPA / SAT vs school's SAT
- AP count, EC depth, leadership, achievements
- school admit rate (country-specific selectivity is captured here via the per-school admit_rate / SAT fallback)
- major match against `row.programs`

### 3. Expanded international + AANAPISI dataset

- **One migration** that inserts new rows into `international_colleges`, guarded by `ON CONFLICT (name) DO NOTHING` (and a unique index on `name` first if not present) so we never duplicate existing entries.
- New intl rows (Asia + Europe focus): ETH Zurich, EPFL, U Amsterdam, TU Delft, U Copenhagen, Lund, Heidelberg, TU Munich, Sorbonne, KU Leuven, U Tokyo, Kyoto U, Osaka U, NUS, NTU, Tsinghua, Peking, Fudan, Seoul National, KAIST, Yonsei, HKUST, U Hong Kong (skip any already present).
- **AANAPISI**: add an `institutionalClassification` tag `"AANAPISI"` for the 14 named institutions in `src/lib/college-api.ts` (hardcoded name list, similar to how HBCU/HSI flags are derived). These are US schools — they live in the Scorecard API, so no new table rows needed; they'll just gain the tag on output.

### 4. Google Analytics

Add the gtag.js snippet to `<head>` of `index.html` (immediately after `<meta name="author">`).

### 5. Files

```
NEW   src/components/LegalConsentPage.tsx
EDIT  src/pages/Index.tsx                  -- gate on legal_accepted_at
EDIT  src/lib/college-api.ts               -- intl fit/chance fix + AANAPISI tag
EDIT  index.html                           -- GA4 gtag
MIG   add profiles.legal_accepted_at + unique(international_colleges.name)
       + INSERT ... ON CONFLICT DO NOTHING for new intl rows
```

## Out of scope (not touching this turn)

- Distance rule, real-time updates, portfolio/quiz fallback — already implemented in prior turns; will only revisit if you say they're still broken.
- Visit tracking — already shipped.(make sure everythin works, fix all bugs too, everything shlioudl eb functional_