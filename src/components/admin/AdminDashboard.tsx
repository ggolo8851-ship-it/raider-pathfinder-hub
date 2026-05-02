import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import FacultyAdminPanel from "./FacultyAdminPanel";
import CustomTabsAdminPanel from "./CustomTabsAdminPanel";

interface Props {
  onExit: () => void;
  onLogout: () => void;
}

type Section =
  | "dashboard" | "access" | "colleges" | "clubs" | "users"
  | "filters" | "content" | "integrity" | "logs" | "faculty" | "tabs";

const NAV: [Section, string][] = [
  ["dashboard", "📊 Dashboard"],
  ["access", "🔐 Access Control"],
  ["colleges", "🎓 Colleges"],
  ["clubs", "🏫 Clubs & Activities"],
  ["faculty", "👨‍🏫 Faculty Board"],
  ["users", "👥 Users"],
  ["filters", "🎛️ Filters & Settings"],
  ["content", "🎨 Content & UI"],
  ["integrity", "🧪 Search & Data"],
  ["logs", "📜 Logs & Activity"],
];

async function audit(adminEmail: string, action: string, target: string, details: object = {}) {
  await supabase.from("admin_audit_log").insert([{
    admin_email: adminEmail, action, target, details: details as any,
  }]);
}

const AdminDashboard = ({ onExit, onLogout }: Props) => {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");
  const adminEmail = user?.email ?? "";

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-60 bg-primary text-primary-foreground p-4 flex flex-col gap-1">
        <div className="px-2 mb-6">
          <div className="font-bold text-lg">RaidersMatch</div>
          <div className="text-xs opacity-80">Admin Console</div>
        </div>
        {NAV.map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)}
            className={`text-left px-3 py-2 rounded text-sm transition-colors ${section === id ? "bg-secondary text-secondary-foreground font-semibold" : "hover:bg-white/10"}`}>
            {label}
          </button>
        ))}
        <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-white/20">
          <button onClick={onExit} className="text-left px-3 py-2 rounded text-sm hover:bg-white/10">← Exit Admin</button>
          <button onClick={onLogout} className="text-left px-3 py-2 rounded text-sm text-destructive hover:bg-destructive/20">Sign Out</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <TopBar adminEmail={adminEmail} onJump={(s) => setSection(s)} onLogout={onLogout} onExit={onExit} />
        <main className="flex-1 p-6 overflow-auto">
          {section === "dashboard" && <Overview onJump={setSection} />}
          {section === "access" && <AccessControl currentEmail={adminEmail} />}
          {section === "colleges" && <CollegesPanel adminEmail={adminEmail} />}
          {section === "clubs" && <ClubsPanel adminEmail={adminEmail} />}
          {section === "faculty" && <FacultyAdminPanel />}
          {section === "users" && <UsersPanel adminEmail={adminEmail} />}
          {section === "filters" && <FiltersStub />}
          {section === "content" && <ContentUIPanel adminEmail={adminEmail} />}
          {section === "integrity" && <DataIntegrityPanel adminEmail={adminEmail} />}
          {section === "logs" && <LogsPanel />}
        </main>
      </div>
    </div>
  );
};

// =================== TOP BAR ===================
function TopBar({ adminEmail, onJump, onLogout, onExit }: {
  adminEmail: string; onJump: (s: Section) => void; onLogout: () => void; onExit: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ type: "user" | "college"; label: string; section: Section }[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [nickname, setNickname] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    supabase.from("admin_nicknames").select("nickname").eq("admin_user_id", user.id).maybeSingle()
      .then(({ data }) => setNickname(data?.nickname ?? null));
    // basic alerts
    (async () => {
      const a: string[] = [];
      const { count: missingCds } = await supabase.from("college_overrides").select("college_id", { count: "exact", head: true }).is("cds_url", null);
      if ((missingCds ?? 0) > 0) a.push(`${missingCds} colleges missing CDS link`);
      setAlerts(a);
    })();
  }, [user]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const term = `%${q.trim()}%`;
      const [u, c] = await Promise.all([
        supabase.from("profiles").select("email").ilike("email", term).limit(5),
        supabase.from("college_overrides").select("college_id, notes").ilike("college_id", term).limit(5),
      ]);
      setResults([
        ...(u.data ?? []).map(x => ({ type: "user" as const, label: x.email, section: "users" as Section })),
        ...(c.data ?? []).map(x => ({ type: "college" as const, label: x.college_id, section: "colleges" as Section })),
      ]);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 relative">
      <div className="flex-1 max-w-md relative">
        <Input placeholder="🔍 Search users or colleges..." value={q} onChange={e => setQ(e.target.value)} />
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-popover border border-border rounded-md shadow-lg mt-1 z-50">
            {results.map((r, i) => (
              <button key={i} onClick={() => { onJump(r.section); setQ(""); setResults([]); }}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-muted">
                <span className="text-xs uppercase text-muted-foreground mr-2">{r.type}</span>{r.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative px-2 py-1 rounded hover:bg-muted" title="Alerts">
            🔔
            {alerts.length > 0 && <span className="absolute top-0 right-0 h-2 w-2 bg-destructive rounded-full" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {alerts.length === 0 && <DropdownMenuItem disabled>No alerts</DropdownMenuItem>}
          {alerts.map((a, i) => <DropdownMenuItem key={i}>{a}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="px-3 py-1.5 rounded text-sm hover:bg-muted flex items-center gap-2">
            <span className="font-medium">{nickname ?? adminEmail.split("@")[0]}</span>
            <span className="text-xs text-muted-foreground hidden md:inline">{adminEmail}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExit}>← Exit Admin</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-destructive">Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

// =================== OVERVIEW ===================
function Overview({ onJump }: { onJump: (s: Section) => void }) {
  const [stats, setStats] = useState({ users: 0, admins: 0, blocked: 0, clubs: 0, overrides: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const [u, a, b, c, o, log] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("email_blacklist").select("id", { count: "exact", head: true }),
        supabase.from("clubs").select("id", { count: "exact", head: true }),
        supabase.from("college_overrides").select("college_id", { count: "exact", head: true }),
        supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(10),
      ]);
      setStats({ users: u.count ?? 0, admins: a.count ?? 0, blocked: b.count ?? 0, clubs: c.count ?? 0, overrides: o.count ?? 0 });
      setRecent(log.data ?? []);
    })();
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Admin Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {Object.entries(stats).map(([k, v]) => (
          <button key={k} onClick={() => k === "blocked" || k === "admins" ? onJump("access") : k === "clubs" ? onJump("clubs") : k === "overrides" ? onJump("colleges") : onJump("users")}
            className="bg-card p-4 rounded-xl shadow-sm border border-border text-left hover:border-primary transition-colors">
            <div className="text-xs uppercase text-muted-foreground">{k}</div>
            <div className="text-3xl font-bold text-primary">{v}</div>
          </button>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border p-4">
        <h2 className="font-semibold mb-3">Recent admin activity</h2>
        {recent.length === 0 && <div className="text-sm text-muted-foreground">No activity yet.</div>}
        <ul className="space-y-1 text-sm">
          {recent.map(l => (
            <li key={l.id} className="flex gap-3 py-1 border-b border-border/50">
              <span className="text-muted-foreground text-xs w-32 shrink-0">{new Date(l.created_at).toLocaleString()}</span>
              <span className="font-medium">{l.admin_email}</span>
              <span className="font-mono text-xs text-secondary">{l.action}</span>
              <span className="text-muted-foreground">{l.target}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// =================== ACCESS CONTROL ===================
function AccessControl({ currentEmail }: { currentEmail: string }) {
  const [whitelist, setWhitelist] = useState<{ id: string; email: string }[]>([]);
  const [blacklist, setBlacklist] = useState<{ id: string; email: string; reason?: string | null }[]>([]);
  const [newWhite, setNewWhite] = useState("");
  const [newBlack, setNewBlack] = useState("");
  const [search, setSearch] = useState("");
  const [confirmBlack, setConfirmBlack] = useState<{ email: string; typed: string } | null>(null);

  const load = async () => {
    const [w, b] = await Promise.all([
      supabase.from("admin_whitelist").select("id, email").order("email"),
      supabase.from("email_blacklist").select("id, email, reason").order("email"),
    ]);
    setWhitelist(w.data ?? []);
    setBlacklist(b.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const addWhite = async () => {
    const e = newWhite.trim().toLowerCase();
    if (!e) return;
    const { error } = await supabase.from("admin_whitelist").insert({ email: e });
    if (error) return toast.error(error.message);
    await audit(currentEmail, "whitelist_add", e);
    setNewWhite(""); load(); toast.success("Added to whitelist");
  };

  const requestBlack = (email: string) => {
    const e = email.trim().toLowerCase();
    if (!e) return;
    if (e === currentEmail.toLowerCase()) return toast.error("You cannot blacklist yourself.");
    setConfirmBlack({ email: e, typed: "" });
  };

  const doBlack = async () => {
    if (!confirmBlack) return;
    if (confirmBlack.typed.trim().toLowerCase() !== confirmBlack.email) return toast.error("Email confirmation does not match.");
    const { error } = await supabase.from("email_blacklist").insert({ email: confirmBlack.email });
    if (error) return toast.error(error.message);
    await audit(currentEmail, "blacklist_add", confirmBlack.email);
    setNewBlack(""); setConfirmBlack(null); load(); toast.success(`Blacklisted ${confirmBlack.email}`);
  };

  const removeWhite = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from admin whitelist?`)) return;
    await supabase.from("admin_whitelist").delete().eq("id", id);
    await audit(currentEmail, "whitelist_remove", email);
    load();
  };
  const removeBlack = async (id: string, email: string) => {
    if (!confirm(`Unblock ${email}?`)) return;
    await supabase.from("email_blacklist").delete().eq("id", id);
    await audit(currentEmail, "blacklist_remove", email);
    load();
  };

  const moveToBlack = async (email: string) => {
    if (email === currentEmail.toLowerCase()) return toast.error("You cannot blacklist yourself.");
    if (!confirm(`⚠️ Move ${email} from WHITELIST to BLACKLIST? They will lose admin access and be blocked.`)) return;
    await supabase.from("admin_whitelist").delete().eq("email", email);
    await supabase.from("email_blacklist").insert({ email });
    await audit(currentEmail, "move_white_to_black", email);
    load(); toast.success(`Moved ${email} to blacklist`);
  };
  const moveToWhite = async (email: string) => {
    if (!confirm(`Move ${email} from BLACKLIST to WHITELIST? They will become an admin on next sign-in.`)) return;
    await supabase.from("email_blacklist").delete().eq("email", email);
    await supabase.from("admin_whitelist").insert({ email });
    await audit(currentEmail, "move_black_to_white", email);
    load(); toast.success(`Moved ${email} to whitelist`);
  };

  const filterFn = (e: string) => e.toLowerCase().includes(search.toLowerCase());

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-2">Access Control</h1>
      <p className="text-sm text-muted-foreground mb-4">⚠️ Blacklist always overrides whitelist. You cannot blacklist yourself. All changes are audited.</p>
      <Input placeholder="Search emails..." value={search} onChange={e => setSearch(e.target.value)} className="mb-4 max-w-sm" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-semibold mb-3">✅ Admin Whitelist ({whitelist.length})</h2>
          <div className="flex gap-2 mb-3">
            <Input placeholder="email@example.com" value={newWhite} onChange={e => setNewWhite(e.target.value)} />
            <Button onClick={addWhite}>Add</Button>
          </div>
          <ul className="space-y-1 max-h-96 overflow-auto">
            {whitelist.filter(w => filterFn(w.email)).map(w => (
              <li key={w.id} className="flex justify-between items-center text-sm py-1 px-2 hover:bg-muted/30 rounded">
                <span>{w.email}</span>
                <span className="flex gap-2">
                  <button onClick={() => moveToBlack(w.email)} className="text-xs hover:underline text-destructive">→ Blacklist</button>
                  <button onClick={() => removeWhite(w.id, w.email)} className="text-destructive text-xs hover:underline">Remove</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-semibold mb-3">🚫 Blacklist ({blacklist.length})</h2>
          <div className="flex gap-2 mb-3">
            <Input placeholder="email@example.com" value={newBlack} onChange={e => setNewBlack(e.target.value)} />
            <Button variant="destructive" onClick={() => requestBlack(newBlack)}>Block</Button>
          </div>
          <ul className="space-y-1 max-h-96 overflow-auto">
            {blacklist.filter(b => filterFn(b.email)).map(b => (
              <li key={b.id} className="flex justify-between items-center text-sm py-1 px-2 hover:bg-muted/30 rounded">
                <span>{b.email}</span>
                <span className="flex gap-2">
                  <button onClick={() => moveToWhite(b.email)} className="text-xs hover:underline text-secondary">→ Whitelist</button>
                  <button onClick={() => removeBlack(b.id, b.email)} className="text-secondary text-xs hover:underline">Unblock</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Dialog open={!!confirmBlack} onOpenChange={(o) => !o && setConfirmBlack(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm blacklist</DialogTitle>
            <DialogDescription>
              Type <span className="font-mono font-bold">{confirmBlack?.email}</span> to confirm. This will block them from RaidersMatch immediately.
            </DialogDescription>
          </DialogHeader>
          <Input value={confirmBlack?.typed ?? ""} onChange={e => setConfirmBlack(c => c ? { ...c, typed: e.target.value } : c)} placeholder="Type email to confirm" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmBlack(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doBlack}>Blacklist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =================== COLLEGES ===================
function CollegesPanel({ adminEmail }: { adminEmail: string }) {
  const [overrides, setOverrides] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [newId, setNewId] = useState("");

  const load = async () => {
    const { data } = await supabase.from("college_overrides").select("*").order("college_id");
    setOverrides(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const startNew = async () => {
    const id = newId.trim();
    if (!id) return;
    const { error } = await supabase.from("college_overrides").insert({ college_id: id });
    if (error) return toast.error(error.message);
    await audit(adminEmail, "college_override_create", id);
    setNewId(""); load(); toast.success("Override created — click Edit to fill it in");
  };

  const save = async (row: any) => {
    const payload = {
      tier: row.tier || null,
      rankings: row.rankings || {},
      known_programs: row.known_programs || [],
      cds_url: row.cds_url || null,
      official_url: row.official_url || null,
      notes: row.notes || null,
    };
    const { error } = await supabase.from("college_overrides").update(payload).eq("college_id", row.college_id);
    if (error) return toast.error(error.message);
    await audit(adminEmail, "college_override_update", row.college_id, payload);
    setEditing(null); load(); toast.success("Saved");
  };

  const remove = async (id: string) => {
    if (!confirm(`Delete override for ${id}?`)) return;
    await supabase.from("college_overrides").delete().eq("college_id", id);
    await audit(adminEmail, "college_override_delete", id);
    load();
  };

  const filtered = overrides.filter(o => o.college_id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-2">Colleges ({overrides.length} overrides)</h1>
      <p className="text-sm text-muted-foreground mb-4">Edits here merge into live search results: tier, rankings, known programs, CDS link.</p>
      <div className="flex gap-2 mb-4 max-w-2xl">
        <Input placeholder="Search college ID / name..." value={search} onChange={e => setSearch(e.target.value)} />
        <Input placeholder="New college ID (e.g. harvard-university)" value={newId} onChange={e => setNewId(e.target.value)} className="max-w-xs" />
        <Button onClick={startNew}>+ Add</Button>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr><th className="p-3">College</th><th className="p-3">Tier</th><th className="p-3">Programs</th><th className="p-3">CDS</th><th className="p-3"></th></tr>
          </thead>
          <tbody>{filtered.map(o => (
            <tr key={o.college_id} className="border-t border-border">
              <td className="p-3 font-medium">{o.college_id}</td>
              <td className="p-3">{o.tier ?? "—"}</td>
              <td className="p-3 text-xs text-muted-foreground">{(o.known_programs ?? []).join(", ") || "—"}</td>
              <td className="p-3 text-xs">{o.cds_url ? "✓" : "—"}</td>
              <td className="p-3 text-right">
                <button onClick={() => setEditing(o)} className="text-secondary text-xs hover:underline mr-3">Edit</button>
                <button onClick={() => remove(o.college_id)} className="text-destructive text-xs hover:underline">Delete</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit {editing?.college_id}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Tier</label>
                <select value={editing.tier ?? ""} onChange={e => setEditing({ ...editing, tier: e.target.value })}
                  className="w-full border border-input rounded-md p-2 bg-background text-sm">
                  <option value="">—</option>
                  <option value="tier1">Tier 1</option>
                  <option value="tier2">Tier 2</option>
                  <option value="tier3">Tier 3</option>
                  <option value="tier4">Tier 4</option>
                  <option value="hidden_ivy">Hidden Ivy</option>
                  <option value="service_academy">Service Academy</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Known programs (comma-separated)</label>
                <Input value={(editing.known_programs ?? []).join(", ")}
                  onChange={e => setEditing({ ...editing, known_programs: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">US News rank</label>
                  <Input type="number" value={editing.rankings?.usnews ?? ""}
                    onChange={e => setEditing({ ...editing, rankings: { ...editing.rankings, usnews: e.target.value ? +e.target.value : null } })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Niche rank</label>
                  <Input type="number" value={editing.rankings?.niche ?? ""}
                    onChange={e => setEditing({ ...editing, rankings: { ...editing.rankings, niche: e.target.value ? +e.target.value : null } })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">CDS URL</label>
                <Input value={editing.cds_url ?? ""} onChange={e => setEditing({ ...editing, cds_url: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Official URL</label>
                <Input value={editing.official_url ?? ""} onChange={e => setEditing({ ...editing, official_url: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Notes</label>
                <Textarea value={editing.notes ?? ""} onChange={e => setEditing({ ...editing, notes: e.target.value })} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => save(editing)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =================== CLUBS ===================
function ClubsPanel({ adminEmail }: { adminEmail: string }) {
  const [syncing, setSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("https://docs.google.com/spreadsheets/d/1Fe2xlUGni87VhweozuBT1sZ1pdBRDA-QOdgKe0CIKkg/edit?gid=1421045413#gid=1421045413");
  const [clubs, setClubs] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const { data } = await supabase.from("clubs").select("*").order("name");
    setClubs(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-clubs", { body: { sheet_url: sheetUrl } });
      if (error) throw error;
      await audit(adminEmail, "clubs_sync", "google_sheet", { count: data?.count });
      toast.success(`Synced ${data.count} clubs`);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Sync failed");
    } finally { setSyncing(false); }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete club "${name}"?`)) return;
    await supabase.from("clubs").delete().eq("id", id);
    await audit(adminEmail, "club_delete", name, { id });
    load();
  };

  const save = async (row: any) => {
    const { error } = await supabase.from("clubs").update({
      name: row.name, classification: row.classification, meeting_day: row.meeting_day,
      location: row.location, sponsor: row.sponsor, sponsor_email: row.sponsor_email, purpose: row.purpose,
    }).eq("id", row.id);
    if (error) return toast.error(error.message);
    await audit(adminEmail, "club_update", row.name, { id: row.id });
    setEditing(null); load(); toast.success("Saved");
  };

  const addNew = async () => {
    const name = prompt("Club name?");
    if (!name) return;
    const { data, error } = await supabase.from("clubs").insert({ name }).select().single();
    if (error) return toast.error(error.message);
    await audit(adminEmail, "club_create", name, { id: data?.id });
    load(); setEditing(data);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-4">Clubs & Activities ({clubs.length})</h1>
      <div className="bg-card rounded-xl p-4 border border-border mb-4">
        <label className="text-xs text-muted-foreground">Google Sheet URL</label>
        <Input value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} className="mb-3 mt-1" />
        <div className="flex gap-2 flex-wrap">
          <Button onClick={sync} disabled={syncing}>{syncing ? "Syncing..." : "🔄 Sync from Google Sheet"}</Button>
          <Button variant="outline" onClick={addNew}>+ Add Club</Button>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const { data, error } = await supabase.functions.invoke("monthly-refresh", { body: { manual: true } });
                if (error) throw error;
                await audit(adminEmail, "manual_refresh_all", "monthly-refresh", data ?? {});
                toast.success("All data refreshed");
                load();
              } catch (e: any) {
                toast.error(e.message ?? "Refresh failed");
              }
            }}
          >
            ⚡ Refresh All Data Now
          </Button>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left sticky top-0">
            <tr><th className="p-3">Name</th><th className="p-3">Classification</th><th className="p-3">Day</th><th className="p-3">Sponsor</th><th className="p-3"></th></tr>
          </thead>
          <tbody>{clubs.map(c => (
            <tr key={c.id} className="border-t border-border">
              <td className="p-3 font-medium">{c.name}</td>
              <td className="p-3">{c.classification}</td>
              <td className="p-3">{c.meeting_day}</td>
              <td className="p-3 text-muted-foreground">{c.sponsor}</td>
              <td className="p-3 text-right">
                <button onClick={() => setEditing(c)} className="text-secondary text-xs hover:underline mr-3">Edit</button>
                <button onClick={() => remove(c.id, c.name)} className="text-destructive text-xs hover:underline">Delete</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit club</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Input placeholder="Name" value={editing.name ?? ""} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              <Input placeholder="Classification (STEM, arts, sports...)" value={editing.classification ?? ""} onChange={e => setEditing({ ...editing, classification: e.target.value })} />
              <Input placeholder="Meeting day" value={editing.meeting_day ?? ""} onChange={e => setEditing({ ...editing, meeting_day: e.target.value })} />
              <Input placeholder="Location" value={editing.location ?? ""} onChange={e => setEditing({ ...editing, location: e.target.value })} />
              <Input placeholder="Sponsor" value={editing.sponsor ?? ""} onChange={e => setEditing({ ...editing, sponsor: e.target.value })} />
              <Input placeholder="Sponsor email" value={editing.sponsor_email ?? ""} onChange={e => setEditing({ ...editing, sponsor_email: e.target.value })} />
              <Textarea placeholder="Purpose" value={editing.purpose ?? ""} onChange={e => setEditing({ ...editing, purpose: e.target.value })} />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => save(editing)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =================== USERS ===================
function UsersPanel({ adminEmail }: { adminEmail: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const load = () => {
    supabase.from("profiles").select("id, user_id, email, display_name, username, flagged, created_at")
      .order("created_at", { ascending: false }).then(({ data }) => setUsers(data ?? []));
  };
  useEffect(load, []);

  const flag = async (u: any) => {
    const next = !u.flagged;
    await supabase.from("profiles").update({ flagged: next }).eq("id", u.id);
    await audit(adminEmail, next ? "user_flag" : "user_unflag", u.email);
    load();
  };

  const resetCode = async (u: any) => {
    if (!confirm(`Clear security code for ${u.email}? They'll need to set a new one.`)) return;
    await supabase.from("user_security_codes").delete().eq("user_id", u.user_id);
    await audit(adminEmail, "security_code_reset", u.email);
    toast.success("Security code cleared");
  };

  const del = async (u: any) => {
    if (!confirm(`Delete profile for ${u.email}? (Auth account remains until they sign out.)`)) return;
    await supabase.from("profiles").delete().eq("id", u.id);
    await supabase.from("user_roles").delete().eq("user_id", u.user_id);
    await supabase.from("bookmarks").delete().eq("user_id", u.user_id);
    await audit(adminEmail, "user_delete", u.email);
    load();
  };

  const filtered = users.filter(u => (u.email ?? "").toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-4">Users ({users.length})</h1>
      <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="mb-4 max-w-sm" />
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr><th className="p-3">Email</th><th className="p-3">Name</th><th className="p-3">Joined</th><th className="p-3">Flag</th><th className="p-3"></th></tr>
          </thead>
          <tbody>{filtered.map(u => (
            <tr key={u.id} className="border-t border-border">
              <td className="p-3">{u.email}</td>
              <td className="p-3">{u.display_name ?? u.username}</td>
              <td className="p-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
              <td className="p-3">{u.flagged ? "🚩" : ""}</td>
              <td className="p-3 text-right space-x-2">
                <button onClick={() => flag(u)} className="text-xs hover:underline">{u.flagged ? "Unflag" : "Flag"}</button>
                <button onClick={() => resetCode(u)} className="text-xs hover:underline text-secondary">Reset code</button>
                <button onClick={() => del(u)} className="text-xs hover:underline text-destructive">Delete</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// =================== FILTERS STUB ===================
function FiltersStub() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-4">Filters & Settings</h1>
      <div className="bg-card rounded-xl border border-border p-6 text-muted-foreground">
        Filter on/off toggles are coming soon. All filters are currently active for users.
      </div>
    </div>
  );
}

// =================== CONTENT & UI ===================
function ContentUIPanel({ adminEmail }: { adminEmail: string }) {
  const [s, setS] = useState<any>(null);
  useEffect(() => {
    supabase.from("site_settings").select("*").eq("id", "global").maybeSingle()
      .then(({ data }) => setS(data ?? { id: "global", logo_url: "", homepage_hero: {}, dropdown_links: [] }));
  }, []);

  if (!s) return <div className="text-muted-foreground">Loading...</div>;

  const save = async () => {
    const { error } = await supabase.from("site_settings").update({
      logo_url: s.logo_url || null,
      homepage_hero: s.homepage_hero || {},
      dropdown_links: s.dropdown_links || [],
      mobile_spacing: s.mobile_spacing || {},
    }).eq("id", "global");
    if (error) return toast.error(error.message);
    await audit(adminEmail, "site_settings_update", "global");
    toast.success("Saved — refresh user pages to see changes");
  };

  const links = (s.dropdown_links ?? []) as { label: string; url: string }[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-2">Content & UI</h1>
      <p className="text-sm text-muted-foreground mb-4">Edit safe site values: logo, homepage hero, dropdown links. Layout/visual editor is on the roadmap.</p>
      <div className="bg-card rounded-xl border border-border p-4 space-y-4 max-w-xl">
        <div>
          <label className="text-xs text-muted-foreground">Logo URL</label>
          <Input value={s.logo_url ?? ""} onChange={e => setS({ ...s, logo_url: e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Homepage hero — headline</label>
          <Input value={s.homepage_hero?.headline ?? ""} onChange={e => setS({ ...s, homepage_hero: { ...s.homepage_hero, headline: e.target.value } })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Homepage hero — subheadline</label>
          <Input value={s.homepage_hero?.sub ?? ""} onChange={e => setS({ ...s, homepage_hero: { ...s.homepage_hero, sub: e.target.value } })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Dropdown links</label>
          {links.map((l, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input value={l.label} placeholder="Label" onChange={e => {
                const n = [...links]; n[i] = { ...n[i], label: e.target.value }; setS({ ...s, dropdown_links: n });
              }} />
              <Input value={l.url} placeholder="https://..." onChange={e => {
                const n = [...links]; n[i] = { ...n[i], url: e.target.value }; setS({ ...s, dropdown_links: n });
              }} />
              <Button variant="ghost" onClick={() => setS({ ...s, dropdown_links: links.filter((_, j) => j !== i) })}>×</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setS({ ...s, dropdown_links: [...links, { label: "", url: "" }] })}>+ Add link</Button>
        </div>
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  );
}

// =================== DATA INTEGRITY ===================
function DataIntegrityPanel({ adminEmail }: { adminEmail: string }) {
  const [issues, setIssues] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  const scan = async () => {
    setScanning(true);
    const found: string[] = [];
    const { data: dupClubs } = await supabase.from("clubs").select("name");
    const seen = new Set<string>(); const dups = new Set<string>();
    (dupClubs ?? []).forEach(c => { if (seen.has(c.name)) dups.add(c.name); else seen.add(c.name); });
    if (dups.size) found.push(`${dups.size} duplicate club name(s): ${[...dups].slice(0, 5).join(", ")}`);
    const { data: noCds } = await supabase.from("college_overrides").select("college_id").is("cds_url", null);
    if ((noCds ?? []).length) found.push(`${noCds!.length} college overrides missing CDS link`);
    setIssues(found.length ? found : ["✅ No issues detected"]);
    await audit(adminEmail, "integrity_scan", "manual", { found: found.length });
    setScanning(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-4">Search & Data Integrity</h1>
      <div className="bg-card rounded-xl border border-border p-4 max-w-2xl">
        <Button onClick={scan} disabled={scanning}>{scanning ? "Scanning..." : "🔍 Run integrity scan"}</Button>
        <ul className="mt-4 space-y-1 text-sm">
          {issues.map((i, n) => <li key={n}>{i}</li>)}
        </ul>
      </div>
    </div>
  );
}

// =================== LOGS + NICKNAMES ===================
function LogsPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [admins, setAdmins] = useState<{ user_id: string; email: string; nickname?: string }[]>([]);
  const { user } = useAuth();

  const load = async () => {
    const [{ data: l }, { data: roles }, { data: nicks }] = await Promise.all([
      supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("user_roles").select("user_id").eq("role", "admin"),
      supabase.from("admin_nicknames").select("admin_user_id, nickname"),
    ]);
    setLogs(l ?? []);
    if (roles?.length) {
      const ids = roles.map(r => r.user_id);
      const { data: profs } = await supabase.from("profiles").select("user_id, email").in("user_id", ids);
      const nickMap = new Map((nicks ?? []).map(n => [n.admin_user_id, n.nickname]));
      setAdmins((profs ?? []).map(p => ({ user_id: p.user_id, email: p.email, nickname: nickMap.get(p.user_id) })));
    }
  };
  useEffect(() => { load(); }, []);

  const setNick = async (admin_user_id: string, nickname: string) => {
    if (!nickname.trim()) {
      await supabase.from("admin_nicknames").delete().eq("admin_user_id", admin_user_id);
    } else {
      await supabase.from("admin_nicknames").upsert({
        admin_user_id, nickname: nickname.trim(), assigned_by: user?.id,
      });
    }
    await audit(user?.email ?? "", "nickname_set", admin_user_id, { nickname });
    load();
  };

  const nickByEmail = useMemo(() => {
    const m = new Map<string, string>();
    admins.forEach(a => { if (a.nickname) m.set(a.email, a.nickname); });
    return m;
  }, [admins]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary mb-4">Admin Nicknames</h1>
        <div className="bg-card rounded-xl border border-border overflow-hidden max-w-2xl">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr><th className="p-3">Email</th><th className="p-3">Nickname</th></tr></thead>
            <tbody>{admins.map(a => (
              <tr key={a.user_id} className="border-t border-border">
                <td className="p-3">{a.email}</td>
                <td className="p-3">
                  <Input defaultValue={a.nickname ?? ""} placeholder="—"
                    onBlur={e => { if ((e.target.value ?? "") !== (a.nickname ?? "")) setNick(a.user_id, e.target.value); }} />
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-primary mb-4">Audit Log</h1>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr><th className="p-3">When</th><th className="p-3">Admin</th><th className="p-3">Action</th><th className="p-3">Target</th></tr></thead>
            <tbody>{logs.map(l => (
              <tr key={l.id} className="border-t border-border">
                <td className="p-3 text-muted-foreground text-xs">{new Date(l.created_at).toLocaleString()}</td>
                <td className="p-3">{nickByEmail.get(l.admin_email) ?? l.admin_email}</td>
                <td className="p-3 font-mono text-xs">{l.action}</td>
                <td className="p-3">{l.target}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
