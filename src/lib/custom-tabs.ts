import { supabase } from "@/integrations/supabase/client";

export type TabBlock =
  | { type: "heading"; text: string }
  | { type: "text"; text: string }
  | { type: "image"; url: string; alt?: string }
  | { type: "link"; label: string; url: string }
  | { type: "card"; title: string; body: string };

export interface CustomTab {
  id: string;
  slug: string;
  title: string;
  icon?: string | null;
  order_index: number;
  content: TabBlock[];
  published: boolean;
}

export async function fetchPublishedTabs(): Promise<CustomTab[]> {
  const { data, error } = await supabase
    .from("custom_tabs" as any)
    .select("id, slug, title, icon, order_index, content, published")
    .eq("published", true)
    .order("order_index");
  if (error) { console.warn("custom_tabs fetch failed", error); return []; }
  return (data ?? []).map((d: any) => ({ ...d, content: Array.isArray(d.content) ? d.content : [] }));
}

export async function fetchAllTabs(): Promise<CustomTab[]> {
  const { data, error } = await supabase
    .from("custom_tabs" as any)
    .select("id, slug, title, icon, order_index, content, published")
    .order("order_index");
  if (error) { console.warn(error); return []; }
  return (data ?? []).map((d: any) => ({ ...d, content: Array.isArray(d.content) ? d.content : [] }));
}
