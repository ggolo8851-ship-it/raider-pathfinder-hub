## Goal

Help promote RaidersMatch and enable email subscriptions without you owning a domain. Everything below uses Lovable's built-in email subdomain (free, auto-provisioned) plus Beehiiv (free up to 2,500 subs) for the newsletter list.

## What gets built

### 1. Branded app emails (Lovable Cloud, no domain purchase)

Lovable provisions a sender like `notify.raiderhub.lovable.app`. DNS is handled automatically — you do nothing.

Two starter templates:
- **Welcome email** — sent automatically the first time a user signs up.
- **"You were invited" email** — when someone uses an invite link with a referral code, the inviter gets credit and the new student gets a welcome with their inviter's name.

Both use RaidersMatch brand colors and link back to the site.

### 2. Referral counter + leaderboard

- Every user gets a unique referral code (short slug from their user id).
- Invite Page + Home share bar links become `https://raiderhub.lovable.app/?ref=<code>`.
- On signup, if a `?ref=` is in the URL, store it on the new user's profile.
- New table `referrals` tracks inviter_user_id → invitee_user_id (unique per invitee, so it can't be gamed by re-signups).
- New section on Home: **"Top Raiders"** leaderboard — top 10 inviters this month + your own rank/count.
- Badge on the user's profile: "🚀 5 invites" etc.

### 3. Newsletter signup (Beehiiv)

- New "Subscribe for updates" card on Home and a dedicated section on the Invite page.
- Form collects email + optional grad year, validates with zod, posts to a `subscribe-newsletter` edge function.
- Edge function forwards to Beehiiv's public subscription API using a `BEEHIIV_API_KEY` + `BEEHIIV_PUBLICATION_ID` secret.
- Also mirrors the email into a local `newsletter_subscribers` table so you can export/see the list in the Admin Dashboard even if Beehiiv ever changes.
- Honors GDPR-style consent checkbox + double opt-in (Beehiiv handles the confirmation email — no domain needed on your end, comes from Beehiiv).

### 4. Admin additions

- "Newsletter" panel in Admin Dashboard: subscriber count, recent signups, CSV export.
- "Referrals" panel: leaderboard, raw invite list, ability to revoke a fake referral.

## Technical details

**Email infra:** Call `email_domain--check_email_domain_status` → if none, open the email-setup dialog so Lovable auto-provisions `notify.raiderhub.lovable.app`. Then `setup_email_infra` + `scaffold_transactional_email`. Templates live in `supabase/functions/_shared/transactional-email-templates/`.

**DB migration:**
- `profiles.referral_code TEXT UNIQUE` (auto-generated on insert via trigger).
- `profiles.referred_by_code TEXT NULL`.
- New `referrals` table (inviter_user_id, invitee_user_id UNIQUE, created_at) + GRANTs + RLS (users read own rows, admins read all).
- New `newsletter_subscribers` table (email UNIQUE, grad_year, source, created_at, confirmed_at) + GRANTs + RLS (anon insert, admin read).

**Frontend files touched/added:**
- `src/lib/referrals.ts` (new) — code gen + ref capture from URL on app load.
- `src/components/HomePage.tsx` — add Top Raiders leaderboard + Subscribe card.
- `src/components/InvitePage.tsx` — append `?ref=` to share URLs, add Subscribe section.
- `src/pages/Index.tsx` — capture `?ref=` once on first auth.
- `src/components/admin/NewsletterPanel.tsx` + `ReferralsPanel.tsx` (new), wired into `AdminDashboard.tsx`.

**Edge functions:**
- `subscribe-newsletter` — zod-validate, insert into `newsletter_subscribers`, POST to Beehiiv.
- Trigger welcome email from existing `send-transactional-email` after first successful login (in `Index.tsx` once per user, guarded by `profiles.welcome_email_sent_at`).

**Secrets needed:** `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID` (you create a free Beehiiv account, grab both from Settings → API). I'll prompt for these via the secrets tool when we get there.

## Out of scope this turn

Marketing blast emails from inside Lovable (correctly — that's what Beehiiv is for). Custom domain. Paid Beehiiv tier. SMS promotion.
