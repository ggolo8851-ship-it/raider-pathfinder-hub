import { useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ensureLoaded, getOverride, setOverride, subscribe } from "@/lib/text-overrides";
import { toast } from "sonner";

interface Props {
  textKey: string;
  defaultValue: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  multiline?: boolean;
  children?: ReactNode;
}

export default function EditableText({ textKey, defaultValue, as = "span", className, multiline }: Props) {
  const { isAdmin } = useAuth();
  const [, force] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    ensureLoaded().then(() => force(n => n + 1));
    const unsub = subscribe(() => force(n => n + 1));
    return unsub;
  }, []);

  const value = getOverride(textKey) ?? defaultValue;
  const Tag = as as any;

  if (editing && isAdmin) {
    const Field = multiline ? "textarea" : "input";
    return (
      <span className="inline-flex items-center gap-1">
        <Field
          autoFocus
          value={draft}
          onChange={(e: any) => setDraft(e.target.value)}
          className="border border-primary rounded px-2 py-1 text-sm bg-background min-w-[120px]"
        />
        <button
          onClick={async () => {
            try { await setOverride(textKey, draft); setEditing(false); toast.success("Saved"); }
            catch (e: any) { toast.error(e.message); }
          }}
          className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
        >Save</button>
        <button onClick={() => setEditing(false)} className="text-xs px-2 py-1 bg-muted rounded">×</button>
      </span>
    );
  }

  return (
    <Tag
      className={className + (isAdmin ? " outline-dashed outline-1 outline-primary/40 hover:outline-primary cursor-text" : "")}
      onDoubleClick={isAdmin ? (e: any) => { e.stopPropagation(); setDraft(value); setEditing(true); } : undefined}
      title={isAdmin ? "Double-click to edit" : undefined}
    >
      {value}
    </Tag>
  );
}
