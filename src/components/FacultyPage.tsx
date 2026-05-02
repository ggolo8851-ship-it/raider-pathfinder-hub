import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
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

const FacultyPage = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [selected, setSelected] = useState<Faculty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: f }, { data: c }] = await Promise.all([
        supabase.from("faculty").select("*").order("order_index").order("name"),
        supabase.from("contributors").select("*").order("order_index").order("name"),
      ]);
      setFaculty((f as Faculty[]) ?? []);
      setContributors((c as Contributor[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <header className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">ESS Faculty Board</h1>
        <p className="text-muted-foreground mt-2">Meet the individuals behind ESS</p>
      </header>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading...</div>
      ) : (
        <>
          <section className="mb-12">
            {faculty.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 bg-card rounded-xl border border-border">
                No faculty members yet. An admin can add them from the dashboard.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {faculty.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelected(f)}
                    className="text-left bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <h3 className="text-lg font-semibold text-foreground">{f.name}</h3>
                    {f.role && <p className="text-sm text-secondary font-medium mt-0.5">{f.role}</p>}
                    {f.bio_short && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-4">{f.bio_short}</p>
                    )}
                    {f.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {f.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 text-[11px] rounded-full bg-muted text-muted-foreground border border-border">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">ESS Contributors</h2>
            {contributors.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 bg-card rounded-xl border border-border">
                No contributors listed yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {contributors.map((c) => (
                  <div key={c.id} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="font-semibold text-foreground">{c.name}</div>
                    {c.contribution && <div className="text-sm text-muted-foreground mt-1">{c.contribution}</div>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selected.name}</DialogTitle>
                {selected.role && <DialogDescription className="text-secondary font-medium">{selected.role}</DialogDescription>}
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {selected.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground border border-border">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {selected.bio_full && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">About</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.bio_full}</p>
                  </div>
                )}
                {selected.contributions && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Contributions to ESS</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.contributions}</p>
                  </div>
                )}
                {selected.projects && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Projects</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.projects}</p>
                  </div>
                )}
                {selected.contact_link && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Contact</h4>
                    <a
                      href={selected.contact_link.includes("@") && !selected.contact_link.startsWith("mailto:") ? `mailto:${selected.contact_link}` : selected.contact_link}
                      target="_blank" rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {selected.contact_link}
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacultyPage;
