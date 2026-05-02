import { CustomTab, TabBlock } from "@/lib/custom-tabs";

const CustomTabPage = ({ tab }: { tab: CustomTab }) => {
  const blocks: TabBlock[] = Array.isArray(tab.content) ? tab.content : [];
  return (
    <div className="max-w-4xl mx-auto py-10 px-5">
      <h1 className="text-3xl font-bold text-primary mb-6 flex items-center gap-2">
        {tab.icon && <span>{tab.icon}</span>}{tab.title}
      </h1>
      {blocks.length === 0 && (
        <p className="text-muted-foreground">This page is empty. An admin can add content from the admin dashboard.</p>
      )}
      <div className="space-y-4">
        {blocks.map((b, i) => {
          switch (b.type) {
            case "heading": return <h2 key={i} className="text-xl font-bold text-foreground mt-4">{b.text}</h2>;
            case "text": return <p key={i} className="text-foreground whitespace-pre-wrap">{b.text}</p>;
            case "image": return <img key={i} src={b.url} alt={b.alt || ""} className="rounded-xl max-w-full" />;
            case "link": return <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" className="text-primary underline block">{b.label} ↗</a>;
            case "card": return (
              <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{b.body}</p>
              </div>
            );
            default: return null;
          }
        })}
      </div>
    </div>
  );
};

export default CustomTabPage;
