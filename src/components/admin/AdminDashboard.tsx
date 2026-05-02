import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  onExit: () => void;
  onLogout: () => void;
}

type Section = "dashboard" | "access" | "users" | "clubs" | "subs" | "logs";

const AdminDashboard = ({ onExit, onLogout }: Props) => {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 bg-primary text-primary-foreground p-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-6 px-2">
          <img src="/ess-logo.png" alt="ESS" className="h-8 w-8 bg-white rounded p-0.5" />
          <span className="font-bold">Admin</span>
        </div>
        {[
          ["dashboard", "📊 Dashboard"],
          ["access", "🔐 Access Control"],
          ["users", "👥 Users"],
          ["clubs", "🏫 Clubs"],
          ["subs", "📧 Subscribers"],
          ["logs", "📜 Audit Log"],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setSection(id as Section)}
            className={`text-left px-3 py-2 rounded text-sm transition-colors ${section === id ? "bg-secondary text-secondary-foreground font-semibold" : "hover:bg-white/10"}`}>
            {label}
          </button>
        ))}
        <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-white/20">
          <button onClick={onExit} className="text-left px-3 py-2 rounded text-sm hover:bg-white/10">← Exit Admin</button>
          <button onClick={onLogout} className="text-left px-3 py-2 rounded text-sm text-destructive hover:bg-destructive/20">Sign Out</button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        {section === "dashboard" && <Overview />}
        {section === "access" && <AccessControl currentEmail={user?.email ?? ""} />}
        {section === "users" && <UsersPanel />}
        {section === "clubs" && <ClubsPanel />}
        {section === "subs" && <SubsPanel />}
        {section === "logs" && <LogsPanel />}
      </main>
    </div>
  );
};

function Overview() {
  const [stats, setStats] = useState({ users: 0, admins: 0, blocked: 0, subs: 0, clubs: 0 });
  useEffect(() => {
    (async () => {
      const [u, a, b, s, c] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("email_blacklist").select("id", { count: "exact", head: true }),
        supabase.from("email_subscriptions").select("id", { count: "exact", head: true }),
        supabase.from("clubs").select("id", { count: "exact", head: true }),
      ]);
      setStats({ users: u.count ?? 0, admins: a.count ?? 0, blocked: b.count ?? 0, subs: s.count ?? 0, clubs: c.count ?? 0 });
    })();
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Admin Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="bg-card p-4 rounded-xl shadow-sm border border-border">
            <div className="text-xs uppercase text-muted-foreground">{k}</div>
            <div className="text-3xl font-bold text-primary">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccessControl({ currentEmail }: { currentEmail: string }) {
  const [whitelist, setWhitelist] = useState<{ id: string; email: string }[]>([]);
  const [blacklist, setBlacklist] = useState<{ id: string; email: string; reason?: string | null }[]>([]);
  const [newWhite, setNewWhite] = useState("");
  const [newBlack, setNewBlack] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    const [w, b] = await Promise.all([
      supabase.from("admin_whitelist").select("id, email").order("email"),
      supabase.from("email_blacklist").select("id, email, reason").order("email"),
    ]);
    setWhitelist(w.data ?? []);
    setBlacklist(b.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const audit = async (action: string, target: string, details?: object) => {
    await supabase.from("admin_audit_log").insert({
      admin_email: currentEmail, action, target, details: details ?? {},
    });
  };

  const addWhite = async () => {
    const e = newWhite.trim().toLowerCase();
    if (!e) return;
    const { error } = await supabase.from("admin_whitelist").insert({ email: e });
    if (error) return toast.error(error.message);
    await audit("whitelist_add", e);
    setNewWhite(""); load(); toast.success("Added to whitelist");
  };

  const addBlack = async () => {
    const e = newBlack.trim().toLowerCase();
    if (!e) return;
    if (e === currentEmail.toLowerCase()) return toast.error("You cannot blacklist yourself.");
    if (!confirm(`Blacklist ${e}? They will be immediately blocked from RaidersMatch.`)) return;
    const { error } = await supabase.from("email_blacklist").insert({ email: e });
    if (error) return toast.error(error.message);
    await audit("blacklist_add", e);
    setNewBlack(""); load(); toast.success("Added to blacklist");
  };

  const removeWhite = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from admin whitelist?`)) return;
    await supabase.from("admin_whitelist").delete().eq("id", id);
    await audit("whitelist_remove", email);
    load();
  };

  const removeBlack = async (id: string, email: string) => {
    if (!confirm(`Unblock ${email}?`)) return;
    await supabase.from("email_blacklist").delete().eq("id", id);
    await audit("blacklist_remove", email);
    load();
  };

  const filterFn = (e: string) => e.toLowerCase().includes(search.toLowerCase());

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-2">Access Control</h1>
      <p className="text-sm text-muted-foreground mb-4">⚠️ Blacklist always overrides whitelist. You cannot blacklist yourself.</p>
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
                <button onClick={() => removeWhite(w.id, w.email)} className="text-destructive text-xs hover:underline">Remove</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-semibold mb-3">🚫 Blacklist ({blacklist.length})</h2>
          <div className="flex gap-2 mb-3">
            <Input placeholder="email@example.com" value={newBlack} onChange={e => setNewBlack(e.target.value)} />
            <Button variant="destructive" onClick={addBlack}>Block</Button>
          </div>
          <ul className="space-y-1 max-h-96 overflow-auto">
            {blacklist.filter(b => filterFn(b.email)).map(b => (
              <li key={b.id} className="flex justify-between items-center text-sm py-1 px-2 hover:bg-muted/30 rounded">
                <span>{b.email}</span>
                <button onClick={() => removeBlack(b.id, b.email)} className="text-secondary text-xs hover:underline">Unblock</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    supabase.from("profiles").select("id, email, display_name, username, created_at").order("created_at", { ascending: false }).then(({ data }) => setUsers(data ?? []));
  }, []);
  const filtered = users.filter(u => (u.email ?? "").toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-4">Users ({users.length})</h1>
      <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="mb-4 max-w-sm" />
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Email</th><th className="p-3">Name</th><th className="p-3">Joined</th></tr></thead>
          <tbody>{filtered.map(u => (
            <tr key={u.id} className="border-t border-border">
              <td className="p-3">{u.email}</td><td className="p-3">{u.display_name ?? u.username}</td>
              <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function ClubsPanel() {
  const [syncing, setSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("https://docs.google.com/spreadsheets/d/1TnM68EMcaq4jZz1icybckIqbkXzYb2hF9FMHTXX4fHM/edit?gid=1444509320#gid=1444509320");
  const [clubs, setClubs] = useState<any[]>([]);
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
      toast.success(`Synced ${data.count} clubs`);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Sync failed");
    } finally { setSyncing(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-4">Clubs ({clubs.length})</h1>
      <div className="bg-card rounded-xl p-4 border border-border mb-4">
        <label className="text-xs text-muted-foreground">Google Sheet URL</label>
        <Input value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} className="mb-3 mt-1" />
        <Button onClick={sync} disabled={syncing}>{syncing ? "Syncing..." : "🔄 Sync from Google Sheet"}</Button>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left sticky top-0"><tr><th className="p-3">Name</th><th className="p-3">Classification</th><th className="p-3">Day</th><th className="p-3">Sponsor</th></tr></thead>
          <tbody>{clubs.map(c => (
            <tr key={c.id} className="border-t border-border">
              <td className="p-3 font-medium">{c.name}</td>
              <td className="p-3">{c.classification}</td>
              <td className="p-3">{c.meeting_day}</td>
              <td className="p-3 text-muted-foreground">{c.sponsor}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function SubsPanel() {
  const [subs, setSubs] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("email_subscriptions").select("*").order("created_at", { ascending: false }).then(({ data }) => setSubs(data ?? []));
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-4">Email Subscribers ({subs.length})</h1>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Email</th><th className="p-3">Welcome Sent</th><th className="p-3">Joined</th></tr></thead>
          <tbody>{subs.map(s => (
            <tr key={s.id} className="border-t border-border">
              <td className="p-3">{s.email}</td>
              <td className="p-3">{s.welcome_sent ? "✅" : "⏳"}</td>
              <td className="p-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function LogsPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(200).then(({ data }) => setLogs(data ?? []));
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-4">Audit Log</h1>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">When</th><th className="p-3">Admin</th><th className="p-3">Action</th><th className="p-3">Target</th></tr></thead>
          <tbody>{logs.map(l => (
            <tr key={l.id} className="border-t border-border">
              <td className="p-3 text-muted-foreground text-xs">{new Date(l.created_at).toLocaleString()}</td>
              <td className="p-3">{l.admin_email}</td>
              <td className="p-3 font-mono text-xs">{l.action}</td>
              <td className="p-3">{l.target}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
