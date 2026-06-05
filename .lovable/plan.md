# Finish Promo + Newsletter Rollout

The referral tables, edge function, admin panel, and UI components are in place. This plan closes the remaining gaps so everything actually works in production.

## 1. Verify referral capture flow
- Confirm `captureRefFromUrl()` runs on every entry point in `src/pages/Index.tsx` (including `/invite` deep links).
- Confirm `applyPendingReferral(user.id)` is invoked right after successful signup / first session load in the auth flow.
- Add a guard so a user can't self-refer or be credited twice.

## 2. Deploy + smoke-test edge function
- Deploy `subscribe-newsletter`.
- Test it with a sample email and confirm:
  - row appears in `newsletter_subscribers`
  - Beehiiv returns 200 (using existing `BEEHIIV_API_KEY` / `BEEHIIV_PUBLICATION_ID` secrets)
- Surface clear error toasts in `NewsletterSignup.tsx` for duplicate / invalid / rate-limited cases.

## 3. Home + Invite page polish
- Make sure the "🚀 Top Raiders" leaderboard handles the empty state (no referrals yet) cleanly.
- Ensure share buttons always include the user's `?ref=CODE` and fall back gracefully if the profile hasn't loaded yet.
- Add a small "Your referrals: N" counter beside the share buttons.

## 4. Admin PromotionPanel checks
- Verify CSV export of subscribers works.
- Verify "revoke referral credit" deletes from `referrals` and clears `referred_by_code` on the invitee.
- Add a simple total-subscribers and total-referrals stat at the top.

## 5. Final security sweep
- Re-run linter; confirm no new RLS warnings on `referrals` / `newsletter_subscribers`.
- Confirm `assign_referral_code()` is not callable from the Data API.

## Out of scope
- Custom domain / branded transactional emails (deferred — `notify.raidermatch.org` still in failed state).
- Marketing blasts from inside the app.

## Technical notes
- No new tables or migrations needed; schema from prior step is sufficient.
- Files touched: `src/pages/Index.tsx`, `src/components/HomePage.tsx`, `src/components/InvitePage.tsx`, `src/components/NewsletterSignup.tsx`, `src/components/admin/PromotionPanel.tsx`, `src/lib/referrals.ts`.
- Edge function deploy: `subscribe-newsletter`.
