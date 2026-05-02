import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { full_name: fullName },
    },
  });
  return { data, error };
}

export async function signInWithEmail(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle() {
  return await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Set or rotate the logged-in user's security code (used to recover password without email). */
export async function setSecurityCode(newCode: string, currentCode?: string) {
  const { data, error } = await supabase.functions.invoke("set-security-code", {
    body: { newCode, currentCode },
  });
  if (error) return { error };
  if (data?.error) return { error: new Error(data.error) };
  return { error: null };
}

/** Reset the password using email + the user's security code. */
export async function resetPasswordWithSecurityCode(email: string, securityCode: string, newPassword: string) {
  const { data, error } = await supabase.functions.invoke("verify-security-code-reset", {
    body: { email, securityCode, newPassword },
  });
  if (error) return { error };
  if (data?.error) return { error: new Error(data.error) };
  return { error: null };
}

/** Returns true if the logged-in user has a security code on file. */
export async function hasSecurityCode(): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return false;
  const { data } = await supabase
    .from("user_security_codes")
    .select("user_id")
    .eq("user_id", session.session.user.id)
    .maybeSingle();
  return !!data;
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return false;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.session.user.id)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

export async function checkBlacklistAndSignOutIfBlocked(): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.user.email) return false;
  const { data } = await supabase
    .from("email_blacklist")
    .select("id")
    .ilike("email", session.session.user.email)
    .maybeSingle();
  if (data) {
    await supabase.auth.signOut();
    return true;
  }
  return false;
}
