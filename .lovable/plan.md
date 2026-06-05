# Fix Beehiiv + Add Automated App Emails

## Part 1 — Fix Beehiiv newsletter signup (root cause)

The `subscribe-newsletter` function is calling Beehiiv's V2 API with a raw UUID. Beehiiv V2 requires the ID prefixed with `pub_`. That's why subscribers save locally but no welcome email goes out.

**Steps:**
1. Update the stored `BEEHIIV_PUBLICATION_ID` secret to `pub_0b7dc972-9fcb-4e12-b0cb-9b7a8c2fa9c9` (secure popup — you paste once).
2. Harden `supabase/functions/subscribe-newsletter/index.ts`:
   - Auto-prepend `pub_` if missing (belt-and-suspenders).
   - Return clearer errors (`bad_publication_id`, `bad_api_key`, `rate_limited`) instead of swallowing them.
   - Only mark the local row `sent` after Beehiiv returns 200.
3. Update `NewsletterSignup.tsx` so the success toast only says "Check your inbox" when Beehiiv actually accepted it; otherwise show "Saved — we'll retry the confirmation email shortly."
4. Redeploy the function and test with your real email. Confirm the function log shows `beehiiv: sent` and the welcome email arrives.

## Part 2 — Automated in-app emails (you don't draft anything)

Use Lovable Cloud's own email system (separate from Beehiiv, which stays for newsletter blasts). I write all templates; you approve copy.

**Email domain:** check current status — if no domain is set up, I'll surface the one-click setup dialog. The sender will be something like `notify.raidermatch.org`.

**Templates I'll build (initial set):**
- **Welcome / onboarding** — sent after signup once profile is complete.
- **Your college matches are ready** — sent after the monthly refresh job runs, with the top 5 matches inline + link.
- **Scholarship & deadline reminders** — weekly digest of upcoming SAT/ACT, FAFSA, and scholarship deadlines relevant to the user's grad year.
- **New clubs / opportunities digest** — monthly summary of newly added ERHS clubs and volunteer opportunities.
- **Referral milestone** — "🎉 You hit 5 referrals" type nudges, tied to the referral system already in place.

**Wiring:**
- Add a `notification_preferences` table so users can opt out per-category (required for CAN-SPAM).
- Hook the college-matches email into the existing `monthly-refresh` edge function.
- Add a new `weekly-deadline-digest` scheduled function (pg_cron, Sundays).
- All sends go through the queue (`send-transactional-email`) so they're rate-limited, logged in `email_send_log`, and respect the suppression list.

## Part 3 — Verify & hand off
- Send a test of each new template to your email so you can approve copy before the cron jobs go live.
- Add an admin view in PromotionPanel showing send counts + bounce/complaint rate so you can monitor health.

## Out of scope
- Beehiiv newsletter content (you write those blasts in Beehiiv's dashboard — that's where it belongs).
- Push notifications / SMS.

## What I need from you
- Confirm the sender subdomain you want (default: `notify.raidermatch.org`).
- After Part 2 templates are drafted, a quick yes/no on the copy for each.
