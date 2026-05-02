import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CustomTab, TabBlock, fetchAllTabs } from "@/lib/custom-tabs";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function CustomTabsAdminPanel() {
  const [tabs, setTabs] = useState<CustomTab[]>([]);
  const [editing, setEditing] = useState<CustomTab | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const load = async () => setTabs(await fetchAllTabs());
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newTitle.trim()) return;
    const slug = slugify(newTitle);
    const { error } = await supabase.from("custom_tabs" as any).insert({
      slug, title: newTitle.trim(), order_index: tabs.length, content: [], published: true, icon: "📄",
    });
    if (error) return toast.error(error.message);
    setNewTitle(""); toast.success("Tab created"); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this tab?")) return;
    await supabase.from("custom_tabs" as any).delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const save = async (t: CustomTab) => {
    const { error } = await supabase.from("custom_tabs" as any).update({
      title: t.title, slug: t.slug, icon: t.icon, order_index: t.order_index,
      content: t.content as any, published: t.published,
    }).eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setEditing(null); load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-2">Custom Tabs</h1>
      <p className="text-sm text-muted-foreground mb-4">Create new pages that appear in the site navigation. Only admins can edit; all users can browse them.</p>

      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex gap-2">
        <Input placeholder="New tab title (e.g. Resources)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
        <Button onClick={create}>+ Create Tab</Button>
      </div>

      <div className="space-y-2">
        {tabs.map(t => (
          <div key={t.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">{t.icon} {t.title} <span className="text-xs text-muted-foreground">/{t.slug}</span></div>
              <div className="text-xs text-muted-foreground">{t.published ? "Published" : "Draft"} • {t.content.length} blocks</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing({ ...t })}>Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => remove(t.id)}>Delete</Button>
            </div>
          </div>
        ))}
        {tabs.length === 0 && <p className="text-sm text-muted-foreground">No custom tabs yet.</p>}
      </div>

      {editing && <TabEditor tab={editing} onChange={setEditing} onSave={() => save(editing)} onCancel={() => setEditing(null)} />}
    </div>
  );
}

function TabEditor({ tab, onChange, onSave, onCancel }: {
  tab: CustomTab; onChange: (t: CustomTab) => void; onSave: () => void; onCancel: () => void;
}) {
  const updateBlock = (i: number, patch: Partial<TabBlock>) => {
    const blocks = tab.content.slice();
    blocks[i] = { ...blocks[i], ...patch } as TabBlock;
    onChange({ ...tab, content: blocks });
  };
  const removeBlock = (i: number) => onChange({ ...tab, content: tab.content.filter((_, j) => j !== i) });
  const addBlock = (type: TabBlock["type"]) => {
    const empty: Record<string, TabBlock> = {
      heading: { type: "heading", text: "" },
      text: { type: "text", text: "" },
      image: { type: "image", url: "", alt: "" },
      link: { type: "link", label: "", url: "" },
      card: { type: "card", title: "", body: "" },
    };
    onChange({ ...tab, content: [...tab.content, empty[type]] });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 overflow-auto p-6">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Edit Tab</h2>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="text-xs">Icon</label><Input value={tab.icon || ""} onChange={e => onChange({ ...tab, icon: e.target.value })} /></div>
          <div><label className="text-xs">Title</label><Input value={tab.title} onChange={e => onChange({ ...tab, title: e.target.value })} /></div>
          <div><label className="text-xs">Slug</label><Input value={tab.slug} onChange={e => onChange({ ...tab, slug: slugify(e.target.value) })} /></div>
        </div>
        <div className="flex gap-3 items-center text-sm">
          <label><input type="checkbox" checked={tab.published} onChange={e => onChange({ ...tab, published: e.target.checked })} /> Published</label>
          <label>Order: <Input type="number" className="inline w-20" value={tab.order_index} onChange={e => onChange({ ...tab, order_index: Number(e.target.value) })} /></label>
        </div>

        <hr />
        <h3 className="font-semibold">Content blocks</h3>
        {tab.content.map((b, i) => (
          <div key={i} className="border border-border rounded p-3 space-y-2">
            <div className="flex justify-between text-xs"><b>{b.type}</b><button onClick={() => removeBlock(i)} className="text-destructive">remove</button></div>
            {b.type === "heading" && <Input value={b.text} onChange={e => updateBlock(i, { text: e.target.value })} placeholder="Heading text" />}
            {b.type === "text" && <Textarea value={b.text} onChange={e => updateBlock(i, { text: e.target.value })} placeholder="Paragraph" />}
            {b.type === "image" && <>
              <Input value={b.url} onChange={e => updateBlock(i, { url: e.target.value })} placeholder="Image URL" />
              <Input value={b.alt || ""} onChange={e => updateBlock(i, { alt: e.target.value })} placeholder="Alt text" />
            </>}
            {b.type === "link" && <>
              <Input value={b.label} onChange={e => updateBlock(i, { label: e.target.value })} placeholder="Link label" />
              <Input value={b.url} onChange={e => updateBlock(i, { url: e.target.value })} placeholder="https://..." />
            </>}
            {b.type === "card" && <>
              <Input value={b.title} onChange={e => updateBlock(i, { title: e.target.value })} placeholder="Card title" />
              <Textarea value={b.body} onChange={e => updateBlock(i, { body: e.target.value })} placeholder="Card body" />
            </>}
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {(["heading", "text", "image", "link", "card"] as const).map(t => (
            <Button key={t} variant="outline" size="sm" onClick={() => addBlock(t)}>+ {t}</Button>
          ))}
        </div>
      </div>
    </div>
  );
}
