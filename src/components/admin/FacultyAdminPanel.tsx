import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Faculty {
  id: string;
  name: string;
  role: string | null;
  bio_short: string | null;
  bio_full: string | null;
  tags: string[];
  contact_link: string | null;
  contributions: string | null;
  projects: string | null;
  order_index: number;
}

interface Contributor {
  id: string;
  name: string;
  contribution: string | null;
  order_index: number;
}

const emptyFaculty: Omit<Faculty, "id"> = {
  name: "", role: "", bio_short: "", bio_full: "", tags: [],
  contact_link: "", contributions: "", projects: "", order_index: 0,
};

const FacultyAdminPanel = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [contribs, setContribs] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Faculty | null>(null);
  const [creatingF, setCreatingF] = useState(false);
  const [draftF, setDraftF] = useState<Omit<Faculty, "id">>(emptyFaculty);
  const [tagsInput, setTagsInput] = useState("");

  const [editingC, setEditingC] = useState<Contributor | null>(null);
  const [creatingC, setCreatingC] = useState(false);
  const [draftC, setDraftC] = useState<Omit<Contributor, "id">>({ name: "", contribution: "", order_index: 0 });

  const load = async () => {
    setLoading(true);
    const [{ data: f }, { data: c }] = await Promise.all([
      supabase.from("faculty").select("*").order("order_index").order("name"),
      supabase.from("contributors").select("*").order("order_index").order("name"),
    ]);
    setFaculty((f as Faculty[]) ?? []);
    setContribs((c as Contributor[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNewFaculty = () => {
    setDraftF({ ...emptyFaculty, order_index: faculty.length });
    setTagsInput("");
    setCreatingF(true);
  };

  const openEditFaculty = (f: Faculty) => {
    setEditing(f);
    setDraftF({
      name: f.name, role: f.role ?? "", bio_short: f.bio_short ?? "", bio_full: f.bio_full ?? "",
      tags: f.tags ?? [], contact_link: f.contact_link ?? "",
      contributions: f.contributions ?? "", projects: f.projects ?? "", order_index: f.order_index,
    });
    setTagsInput((f.tags ?? []).join(", "));
  };

  const saveFaculty = async () => {
    if (!draftF.name.trim()) { toast.error("Name is required"); return; }
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const payload = { ...draftF, tags };

    if (editing) {
      const { error } = await supabase.from("faculty").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Faculty updated");
      setEditing(null);
    } else {
      const { error } = await supabase.from("faculty").insert([payload]);
      if (error) { toast.error(error.message); return; }
      toast.success("Faculty added");
      setCreatingF(false);
    }
    await load();
  };

  const deleteFaculty = async (id: string) => {
    if (!confirm("Delete this faculty member?")) return;
    const { error } = await supabase.from("faculty").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    await load();
  };

  const moveFaculty = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= faculty.length) return;
    const a = faculty[idx], b = faculty[target];
    await supabase.from("faculty").update({ order_index: b.order_index }).eq("id", a.id);
    await supabase.from("faculty").update({ order_index: a.order_index }).eq("id", b.id);
    await load();
  };

  // Contributors
  const openNewContrib = () => {
    setDraftC({ name: "", contribution: "", order_index: contribs.length });
    setCreatingC(true);
  };
  const openEditContrib = (c: Contributor) => {
    setEditingC(c);
    setDraftC({ name: c.name, contribution: c.contribution ?? "", order_index: c.order_index });
  };
  const saveContrib = async () => {
    if (!draftC.name.trim()) { toast.error("Name is required"); return; }
    if (editingC) {
      const { error } = await supabase.from("contributors").update(draftC).eq("id", editingC.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Contributor updated");
      setEditingC(null);
    } else {
      const { error } = await supabase.from("contributors").insert([draftC]);
      if (error) { toast.error(error.message); return; }
      toast.success("Contributor added");
      setCreatingC(false);
    }
    await load();
  };
  const deleteContrib = async (id: string) => {
    if (!confirm("Delete this contributor?")) return;
    const { error } = await supabase.from("contributors").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    await load();
  };
  const moveContrib = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= contribs.length) return;
    const a = contribs[idx], b = contribs[target];
    await supabase.from("contributors").update({ order_index: b.order_index }).eq("id", a.id);
    await supabase.from("contributors").update({ order_index: a.order_index }).eq("id", b.id);
    await load();
  };

  const facultyDialogOpen = creatingF || !!editing;
  const closeFacultyDialog = () => { setCreatingF(false); setEditing(null); };
  const contribDialogOpen = creatingC || !!editingC;
  const closeContribDialog = () => { setCreatingC(false); setEditingC(null); };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Faculty</h2>
          <Button onClick={openNewFaculty}>+ Add Faculty</Button>
        </div>
        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : faculty.length === 0 ? (
          <div className="text-muted-foreground bg-card border border-border rounded-lg p-6 text-center">No faculty yet.</div>
        ) : (
          <div className="space-y-2">
            {faculty.map((f, i) => (
              <div key={f.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveFaculty(i, -1)} className="text-xs px-1 hover:text-primary">▲</button>
                  <button onClick={() => moveFaculty(i, 1)} className="text-xs px-1 hover:text-primary">▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{f.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{f.role || "—"}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEditFaculty(f)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => deleteFaculty(f.id)}>Delete</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Contributors</h2>
          <Button onClick={openNewContrib}>+ Add Contributor</Button>
        </div>
        {contribs.length === 0 ? (
          <div className="text-muted-foreground bg-card border border-border rounded-lg p-6 text-center">No contributors yet.</div>
        ) : (
          <div className="space-y-2">
            {contribs.map((c, i) => (
              <div key={c.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveContrib(i, -1)} className="text-xs px-1 hover:text-primary">▲</button>
                  <button onClick={() => moveContrib(i, 1)} className="text-xs px-1 hover:text-primary">▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.contribution || "—"}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEditContrib(c)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => deleteContrib(c.id)}>Delete</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={facultyDialogOpen} onOpenChange={(o) => !o && closeFacultyDialog()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Faculty" : "Add Faculty"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input value={draftF.name} onChange={(e) => setDraftF({ ...draftF, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Role / Position</label>
              <Input value={draftF.role ?? ""} onChange={(e) => setDraftF({ ...draftF, role: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Short Bio (2–4 lines)</label>
              <Textarea rows={3} value={draftF.bio_short ?? ""} onChange={(e) => setDraftF({ ...draftF, bio_short: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Full Bio</label>
              <Textarea rows={5} value={draftF.bio_full ?? ""} onChange={(e) => setDraftF({ ...draftF, bio_full: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <Input placeholder="Biology, Chemistry, Environmental Science" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Contact Link (email or URL)</label>
              <Input value={draftF.contact_link ?? ""} onChange={(e) => setDraftF({ ...draftF, contact_link: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Contributions to ESS</label>
              <Textarea rows={3} value={draftF.contributions ?? ""} onChange={(e) => setDraftF({ ...draftF, contributions: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Projects</label>
              <Textarea rows={3} value={draftF.projects ?? ""} onChange={(e) => setDraftF({ ...draftF, projects: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeFacultyDialog}>Cancel</Button>
            <Button onClick={saveFaculty}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contribDialogOpen} onOpenChange={(o) => !o && closeContribDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingC ? "Edit Contributor" : "Add Contributor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input value={draftC.name} onChange={(e) => setDraftC({ ...draftC, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Contribution</label>
              <Input placeholder="Website Developer, Event Support, ..." value={draftC.contribution ?? ""} onChange={(e) => setDraftC({ ...draftC, contribution: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeContribDialog}>Cancel</Button>
            <Button onClick={saveContrib}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacultyAdminPanel;
