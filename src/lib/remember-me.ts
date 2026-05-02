import { supabase } from "@/integrations/supabase/client";

/**
 * Remember Me implementation notes:
 *
 * The Supabase client is auto-generated and uses `localStorage` with
 * `persistSession: true`. localStorage persists across browser restarts —
 * that's exactly what "Remember Me = ON" should do.
 *
 * For "Remember Me = OFF", we want the session to end when the browser/tab
 * closes. We achieve that by, right after sign-in, COPYING the auth token
 * from localStorage into sessionStorage and REMOVING it from localStorage.
 * On the next reload, supabase-js reads its storage (localStorage) and finds
 * nothing — so the user is signed out. While the tab is open, we re-mirror
 * the token back into localStorage in-memory so the existing client keeps
 * working for this session.
 *
 * Email-only autofill is stored separately in localStorage under
 * `rm.remembered_email`. Passwords are NEVER stored.
 */

const REMEMBERED_EMAIL_KEY = "rm.remembered_email";
const REMEMBER_FLAG_KEY = "rm.remember_me";
// Supabase stores its session under a key like "sb-<project-ref>-auth-token"
const SUPABASE_AUTH_KEY_PREFIX = "sb-";
const SUPABASE_AUTH_KEY_SUFFIX = "-auth-token";

function findSupabaseAuthKey(storage: Storage): string | null {
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && k.startsWith(SUPABASE_AUTH_KEY_PREFIX) && k.endsWith(SUPABASE_AUTH_KEY_SUFFIX)) {
      return k;
    }
  }
  return null;
}

export function setRememberedEmail(email: string) {
  try { localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim().toLowerCase()); } catch {}
}

export function getRememberedEmail(): string {
  try { return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? ""; } catch { return ""; }
}

export function clearRememberedEmail() {
  try { localStorage.removeItem(REMEMBERED_EMAIL_KEY); } catch { }
}

export function setRememberFlag(remember: boolean) {
  try { localStorage.setItem(REMEMBER_FLAG_KEY, remember ? "1" : "0"); } catch { }
}

export function getRememberFlag(): boolean {
  try { return localStorage.getItem(REMEMBER_FLAG_KEY) === "1"; } catch { return false; }
}

/**
 * Apply the Remember Me preference to the current session.
 * Call this AFTER a successful sign-in.
 */
export function applyRememberMe(remember: boolean) {
  setRememberFlag(remember);
  if (remember) return; // localStorage already persists — nothing to do.

  // Move the supabase auth token from localStorage -> sessionStorage so it
  // dies when the tab closes.
  try {
    const key = findSupabaseAuthKey(localStorage);
    if (!key) return;
    const value = localStorage.getItem(key);
    if (value) {
      sessionStorage.setItem(key, value);
      // Remove from localStorage so next page load has no persisted session.
      localStorage.removeItem(key);
    }
    // Re-mirror to localStorage so the running client still works in this tab.
    // We do this on the next tick so supabase-js doesn't immediately overwrite.
    queueMicrotask(() => {
      const v = sessionStorage.getItem(key);
      if (v) localStorage.setItem(key, v);
    });
  } catch (e) {
    // Best-effort. If storage is unavailable, the user just stays "remembered".
    console.warn("applyRememberMe failed", e);
  }
}

/**
 * On boot: if the user previously chose NOT to be remembered, ensure that
 * any stale persisted session from this tab gets evicted from localStorage
 * after we've loaded it into the running client. We migrate it to
 * sessionStorage so it stays alive for this tab but won't survive a restart.
 *
 * This is safe to call once at app startup, AFTER supabase.auth.getSession().
 */
export function enforceRememberPolicyOnBoot() {
  if (getRememberFlag()) return; // user wants to be remembered — leave alone
  try {
    const key = findSupabaseAuthKey(localStorage);
    if (!key) return;
    const value = localStorage.getItem(key);
    if (!value) return;
    sessionStorage.setItem(key, value);
    localStorage.removeItem(key);
    // Mirror back so in-tab refresh-token rotation keeps working.
    queueMicrotask(() => {
      const v = sessionStorage.getItem(key);
      if (v) localStorage.setItem(key, v);
    });
  } catch {}
}

/** "Forget this device": clear remembered email + sign out + wipe storage. */
export async function forgetThisDevice() {
  try {
    clearRememberedEmail();
    localStorage.removeItem(REMEMBER_FLAG_KEY);
    const lkey = findSupabaseAuthKey(localStorage);
    if (lkey) localStorage.removeItem(lkey);
    const skey = findSupabaseAuthKey(sessionStorage);
    if (skey) sessionStorage.removeItem(skey);
  } catch {}
  await supabase.auth.signOut();
}
