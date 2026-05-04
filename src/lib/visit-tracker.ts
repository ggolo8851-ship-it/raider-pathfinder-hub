import { supabase } from "@/integrations/supabase/client";

const lastSent = new Map<string, number>();
const DEDUP_MS = 30_000;

export async function trackVisit(path: string) {
  if (!path) return;
  const now = Date.now();
  const last = lastSent.get(path) ?? 0;
  if (now - last < DEDUP_MS) return;
  lastSent.set(path, now);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user_id = session?.user?.id ?? null;
    const email = session?.user?.email ?? null;
    await (supabase.from("page_visits" as any) as any).insert({ user_id, email, path });
  } catch (e) {
    // Silently ignore — analytics shouldn't break UX
  }
}
