# Email setup: Beehiiv welcome fix + automated app emails

Beehiiv keeps handling newsletter blasts (from `raiderhub@mail.beehiiv.com`). Lovable handles automated per-user app emails from a new sender on your domain.

## Part 1 — Fix Beehiiv welcome email

1. Update the stored `BEEHIIV_PUBLICATION_ID` secret to `pub_0b7dc972-9fcb-4e12-b0cb-9b7a8c2fa9c9` (secure popup, paste once).
2. The `subscribe-newsletter` function is already hardened to auto-prepend `pub_`, surface real Beehiiv status, and only mark the local row confirmed after a 200.
3. Redeploy + test with a real email — confirm the function log shows `beehiiv: sent` and the welcome arrives.

## Part 2 — Sender domain for automated app emails

Set up `notify.raiderhub.org` through Lovable.

- One-time: you add 2 NS records at your domain registrar (a dialog will walk you through it).
- DNS propagation: up to a few hours; emails start sending automatically once verified.
- This is fully separate from Beehiiv — no conflict with `mail.beehiiv.com`.

## Part 3 — Email infrastructure + templates

Once the domain is in (DNS doesn't need to be verified yet to build):

1. Provision the shared email queue (tables, cron, worker).
2. Scaffold the `send-transactional-email` function and the unsubscribe page route.
3. Build these templates, brand-styled to match RaiderHub:
   - **Welcome / onboarding** — sent right after profile setup completes.
   - **Your college matches are ready** — fired from the existing `monthly-refresh` function with the top 5 matches inline + link.
   - **Weekly deadline digest** — Sunday cron, segmented by grad year (SAT/ACT/FAFSA/scholarships).
   - **Clubs & opportunities digest** — monthly, newly added ERHS clubs + volunteer ops.
   - **Referral milestone** — "🎉 You hit 5 referrals" tied to the existing referral system.
4. Add a `notification_preferences` table (per-category opt-out for CAN-SPAM).
5. Hook all sends through the queue (rate-limited, logged in `email_send_log`, respects suppression list).

## Part 4 — Admin monitoring

Add an "Emails" section to PromotionPanel:
- Sends in last 7/30 days
- Bounce/complaint/unsubscribe counts
- Filter by template + recipient lookup
- All deduped by `message_id`, admin-only.

## Part 5 — Verify

- Test-send each template to your email so you can approve copy before crons go live.
- Confirm welcome email from Beehiiv arrives.
- Confirm one automated app email arrives from `notify.raiderhub.org`.

## Out of scope

- Newsletter blast content (you write those in Beehiiv).
- Push / SMS.
- Sending app emails from `mail.beehiiv.com` (not possible — Beehiiv-owned domain, no per-user transactional API).

## What I need from you

- Approve the secret popup for `BEEHIIV_PUBLICATION_ID`.
- Click the domain-setup button when it appears and paste the 2 NS records at your registrar.
- Quick yes/no on copy for each template after test-send.
