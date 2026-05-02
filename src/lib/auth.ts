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

export async function resetPassword(email: string) {
  // Native Supabase password reset — routed through the auth-email-hook
  // and delivered via Lovable Emails using our branded recovery template.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/reset-password",
  });
  return { error };
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
