// Referral code utilities: capture ?ref from URL on first auth and persist it.
import { supabase } from "@/integrations/supabase/client";

const REF_STORAGE_KEY = "rm_pending_ref";

export function captureRefFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && /^[a-z0-9]{4,12}$/i.test(ref)) {
      localStorage.setItem(REF_STORAGE_KEY, ref.toLowerCase());
      // strip the param so it isn't repeatedly applied / shared
      params.delete("ref");
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
  } catch {/* noop */}
}

export function getPendingRef(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(REF_STORAGE_KEY); } catch { return null; }
}

export function clearPendingRef() {
  try { localStorage.removeItem(REF_STORAGE_KEY); } catch {/* noop */}
}

/** Build a referral-tagged share URL for the current user. */
export function buildShareUrl(baseUrl: string, code: string | null | undefined) {
  if (!code) return baseUrl;
  const u = new URL(baseUrl);
  u.searchParams.set("ref", code);
  return u.toString();
}

/**
 * After auth, if we captured a ref, attach it to the user's profile and
 * create a referrals row crediting the inviter. Idempotent and safe to retry.
 */
export async function applyPendingReferral(userId: string) {
  const ref = getPendingRef();
  if (!ref) return;

  // Load current profile to avoid clobbering an existing inviter
  const { data: me } = await supabase
    .from("profiles")
    .select("user_id, referral_code, referred_by_code")
    .eq("user_id", userId)
    .maybeSingle();

  if (!me) return; // profile not ready yet — try later
  if (me.referred_by_code) { clearPendingRef(); return; } // already credited
  if (ref === me.referral_code) { clearPendingRef(); return; } // self-ref guard

  const { data: inviter } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("referral_code", ref)
    .maybeSingle();

  if (!inviter || inviter.user_id === userId) { clearPendingRef(); return; }

  await supabase
    .from("profiles")
    .update({ referred_by_code: ref })
    .eq("user_id", userId);

  await supabase
    .from("referrals")
    .insert({
      inviter_user_id: inviter.user_id,
      invitee_user_id: userId,
      inviter_code: ref,
    });

  clearPendingRef();
}

export async function getMyReferralCode(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.referral_code ?? null;
}

export async function getMyReferralCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("inviter_user_id", userId);
  return count ?? 0;
}

export interface LeaderboardEntry {
  inviter_user_id: string;
  display_name: string;
  count: number;
}

/** Aggregate top inviters since `sinceIso` (default: 30 days). */
export async function getReferralLeaderboard(limit = 10, sinceIso?: string): Promise<LeaderboardEntry[]> {
  const since = sinceIso ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  // Pull recent referrals (RLS limits non-admins to their own rows — leaderboard will
  // show only what the user is allowed to see; admins see everything).
  const { data: rows } = await supabase
    .from("referrals")
    .select("inviter_user_id, created_at")
    .gte("created_at", since)
    .limit(1000);

  const counts = new Map<string, number>();
  for (const r of rows ?? []) {
    counts.set(r.inviter_user_id, (counts.get(r.inviter_user_id) ?? 0) + 1);
  }
  if (counts.size === 0) return [];

  const ids = Array.from(counts.keys());
  const { data: profs } = await supabase
    .from("profiles")
    .select("user_id, display_name, username, email")
    .in("user_id", ids);

  const nameFor = new Map<string, string>();
  for (const p of profs ?? []) {
    nameFor.set(
      p.user_id,
      p.display_name || p.username || (p.email ? p.email.split("@")[0] : "Raider")
    );
  }

  return ids
    .map((id) => ({
      inviter_user_id: id,
      display_name: nameFor.get(id) ?? "Raider",
      count: counts.get(id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
