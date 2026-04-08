import { useState } from "react";
import { Button } from "@/components/ui/button";

const ESSAY_PROMPTS = [
  {
    title: "Common App Personal Essay",
    prompts: [
      "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it.",
      "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure.",
      "Reflect on a time when you questioned or challenged a belief or idea.",
      "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way.",
      "Discuss an accomplishment, event, or realization that sparked a period of personal growth.",
      "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time.",
      "Share an essay on any topic of your choice."
    ]
  },
  {
    title: "Supplemental Essay Types",
    prompts: [
      "Why this school? (Research specific programs, traditions, clubs)",
      "Why this major? (Connect your passion to the school's offerings)",
      "Community essay (How you'll contribute to campus life)",
      "Diversity essay (What unique perspective do you bring?)",
      "Extracurricular deep dive (Elaborate on one activity)"
    ]
  }
];

const ESSAY_TIPS = [
  { title: "Be Specific", tip: "Don't say 'I learned a lot.' Say what you learned and how it changed you. Use concrete details, names, places." },
  { title: "Show, Don't Tell", tip: "Instead of 'I'm a hard worker,' describe a moment that demonstrates your work ethic." },
  { title: "Start Strong", tip: "Open with action, dialogue, or a vivid scene — not 'I have always been interested in...'" },
  { title: "Be Authentic", tip: "Write in YOUR voice. Admissions officers read thousands of essays — yours should sound like you." },
  { title: "Connect to Your Future", tip: "Show how your experiences connect to what you want to study and do in college." },
  { title: "Proofread Ruthlessly", tip: "Read aloud. Have someone else read it. Check every school name — wrong school name = instant rejection." },
];

const ESSAY_RESOURCES = [
  { name: "Common App Essay Guide", url: "https://www.commonapp.org/blog/2024-2025-common-app-essay-prompts", desc: "Official Common App prompts and tips" },
  { name: "College Essay Guy (Free Resources)", url: "https://www.collegeessayguy.com/", desc: "Free essay guides, brainstorming exercises, and examples" },
  { name: "Khan Academy - College Admissions", url: "https://www.khanacademy.org/college-careers-more/college-admissions", desc: "Free college application course" },
  { name: "Purdue OWL Writing Lab", url: "https://owl.purdue.edu/", desc: "Grammar, citation, and writing help" },
  { name: "Grammarly", url: "https://www.grammarly.com/", desc: "Free grammar and spell checker" },
];

const EssayPage = () => {
  const [essay, setEssay] = useState("");
  const [feedback, setFeedback] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"write" | "prompts" | "tips" | "resources">("write");

  const analyzeEssay = () => {
    const words = essay.trim().split(/\s+/).filter(Boolean);
    const wc = words.length;
    setWordCount(wc);

    const fb: string[] = [];

    // Word count check
    if (wc < 150) fb.push("⚠️ Your essay is very short. Most college essays should be 250-650 words.");
    else if (wc < 250) fb.push("📏 Your essay is under the typical 250-word minimum. Consider expanding your ideas.");
    else if (wc > 650) fb.push("📏 Your essay is over the Common App 650-word limit. Consider trimming.");
    else fb.push("✅ Word count is within the 250-650 word range. Good!");

    // Opening check
    const firstSentence = essay.split(/[.!?]/)[0]?.toLowerCase() || "";
    if (firstSentence.includes("i have always") || firstSentence.includes("ever since i was")) {
      fb.push("💡 Your opening uses a common cliché. Try starting with a specific moment, dialogue, or vivid detail.");
    }

    // Specificity check
    const vagueWords = ["very", "really", "a lot", "many things", "stuff", "things"];
    const vagueCount = vagueWords.filter(w => essay.toLowerCase().includes(w)).length;
    if (vagueCount >= 3) fb.push("💡 Your essay uses several vague words (very, really, a lot). Replace them with specific details.");
    else if (vagueCount >= 1) fb.push("📝 Consider replacing vague words like 'very' or 'a lot' with more specific language.");

    // Sentence variety
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const startsWithI = sentences.filter(s => s.trim().toLowerCase().startsWith("i ")).length;
    if (sentences.length > 3 && startsWithI / sentences.length > 0.5) {
      fb.push("💡 Many of your sentences start with 'I'. Vary your sentence structure for better flow.");
    }

    // Paragraph check
    const paragraphs = essay.split(/\n\n+/).filter(p => p.trim().length > 0);
    if (paragraphs.length < 3 && wc > 200) {
      fb.push("📝 Consider breaking your essay into more paragraphs (intro, body, conclusion) for readability.");
    }

    // Positive feedback
    if (wc >= 250 && vagueCount < 2 && paragraphs.length >= 3) {
      fb.push("🌟 Your essay has good structure and specificity. Focus on making your unique voice shine through!");
    }

    // Grammar hints
    const doubleSpaces = (essay.match(/  +/g) || []).length;
    if (doubleSpaces > 2) fb.push("📝 You have some extra spaces — clean those up before submitting.");

    setFeedback(fb);
  };

  const handleEssayChange = (text: string) => {
    setEssay(text);
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-5">
      <h2 className="text-3xl font-bold text-primary mb-2">📝 Essay Resource Center</h2>
      <p className="text-muted-foreground mb-6">Write, review, and strengthen your college essays</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["write", "prompts", "tips", "resources"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}>
            {t === "write" ? "✍️ Write & Review" : t === "prompts" ? "📋 Prompts" : t === "tips" ? "💡 Tips" : "📚 Resources"}
          </button>
        ))}
      </div>

      {activeTab === "write" && (
        <div>
          <div className="bg-card rounded-xl shadow-md p-6 border border-border">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-foreground">Paste or write your essay below</label>
              <span className={`text-xs font-bold ${wordCount > 650 ? "text-destructive" : wordCount >= 250 ? "text-green-600" : "text-muted-foreground"}`}>
                {wordCount} words
              </span>
            </div>
            <textarea
              value={essay}
              onChange={e => handleEssayChange(e.target.value)}
              placeholder="Start writing or paste your essay here..."
              className="w-full h-64 p-4 border border-input rounded-lg bg-background text-foreground resize-y text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={analyzeEssay} disabled={essay.trim().length < 50} className="w-full mt-3">
              🔍 Analyze My Essay
            </Button>
          </div>

          {feedback.length > 0 && (
            <div className="bg-card rounded-xl shadow-md p-6 border border-border mt-4 space-y-3">
              <h3 className="text-lg font-bold text-primary">Essay Feedback</h3>
              {feedback.map((fb, i) => (
                <div key={i} className="p-3 bg-muted/30 rounded-lg text-sm text-foreground">{fb}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "prompts" && (
        <div className="space-y-6">
          {ESSAY_PROMPTS.map((section, i) => (
            <div key={i} className="bg-card rounded-xl shadow-md p-6 border border-border">
              <h3 className="text-lg font-bold text-primary mb-3">{section.title}</h3>
              <div className="space-y-2">
                {section.prompts.map((p, j) => (
                  <div key={j} className="p-3 bg-muted/30 rounded-lg text-sm text-foreground border-l-4 border-primary">
                    {p}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "tips" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ESSAY_TIPS.map((tip, i) => (
            <div key={i} className="bg-card rounded-xl shadow-md p-5 border border-border">
              <h4 className="font-bold text-primary mb-2">{tip.title}</h4>
              <p className="text-sm text-muted-foreground">{tip.tip}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "resources" && (
        <div className="space-y-3">
          {ESSAY_RESOURCES.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              className="block bg-card rounded-xl shadow-md p-5 border border-border hover:border-primary transition-colors">
              <h4 className="font-bold text-primary">{r.name} ↗</h4>
              <p className="text-sm text-muted-foreground">{r.desc}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default EssayPage;
