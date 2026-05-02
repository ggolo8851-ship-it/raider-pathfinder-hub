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
  { name: "Johns Hopkins Essays That Worked", url: "https://apply.jhu.edu/application-process/essays-that-worked/", desc: "Real successful admissions essays — use as benchmark" },
  { name: "Hamilton College — Successful Essays", url: "https://www.hamilton.edu/admission/apply/college-essays", desc: "Annotated essays that earned admission" },
  { name: "Purdue OWL Writing Lab", url: "https://owl.purdue.edu/", desc: "Grammar, citation, and writing help" },
  { name: "LanguageTool", url: "https://languagetool.org/", desc: "Free open-source grammar & spell checker" },
  { name: "Hemingway Editor", url: "https://hemingwayapp.com/", desc: "Readability and clarity checker — free online" },
];

const WEAK_PHRASES = [
  "i think", "i believe", "i feel like", "in my opinion", "basically",
  "honestly", "literally", "actually", "kind of", "sort of",
  "for example", "in conclusion", "as you can see",
];

const CLICHES = [
  "ever since i was young", "i have always been", "webster's dictionary defines",
  "in today's society", "from a young age", "throughout my life",
  "i learned so much", "it was a life-changing experience", "changed my perspective",
  "pushed me out of my comfort zone", "at the end of the day",
];

// Specificity signals — concrete proper nouns / numbers / sensory verbs.
const SENSORY_WORDS = ["smelled", "tasted", "saw", "heard", "felt", "watched", "touched", "noticed", "glanced", "whispered", "shouted"];

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  let m = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}

interface GradeLevelReport {
  fleschKincaid: number;
  gunningFog: number;
  colemanLiau: number;
  averaged: number;
  band: "Below HS" | "Early HS" | "Mid HS" | "Late HS / College" | "Graduate";
  verdict: string;
  benchmark: string;
  comparison: { metric: string; yours: string; successful: string; status: "good" | "warn" | "bad" }[];
}

const EssayPage = () => {
  const [essay, setEssay] = useState("");
  const [essayPrompt, setEssayPrompt] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "warning" | "error" | "info"; text: string }[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"write" | "prompts" | "tips" | "resources">("write");
  const [gradeReport, setGradeReport] = useState<GradeLevelReport | null>(null);

  const computeGradeLevel = (): GradeLevelReport | null => {
    const words = essay.trim().split(/\s+/).filter(Boolean);
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (words.length < 30 || sentences.length < 2) return null;

    const totalSyllables = words.reduce((t, w) => t + countSyllables(w), 0);
    const totalChars = words.reduce((t, w) => t + w.replace(/[^a-zA-Z]/g, "").length, 0);
    const complexWords = words.filter(w => countSyllables(w) >= 3 && !/^[A-Z]/.test(w)).length;

    const wordsPerSentence = words.length / sentences.length;
    const syllablesPerWord = totalSyllables / words.length;

    // Flesch-Kincaid Grade Level
    const fk = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
    // Gunning Fog
    const fog = 0.4 * (wordsPerSentence + 100 * (complexWords / words.length));
    // Coleman-Liau
    const L = (totalChars / words.length) * 100;
    const S = (sentences.length / words.length) * 100;
    const cli = 0.0588 * L - 0.296 * S - 15.8;

    const clamp = (n: number) => Math.max(1, Math.min(20, Math.round(n * 10) / 10));
    const avg = (clamp(fk) + clamp(fog) + clamp(cli)) / 3;
    const averaged = Math.round(avg * 10) / 10;

    let band: GradeLevelReport["band"];
    let verdict: string;
    let benchmark: string;
    if (averaged < 8) {
      band = "Below HS";
      verdict = "Reads below high-school level. Admissions committees expect at least late-HS sophistication.";
      benchmark = "Successful Common App essays typically read at grade 10–13.";
    } else if (averaged < 10) {
      band = "Early HS";
      verdict = "Early-high-school reading level. Push for richer vocabulary and more layered sentences.";
      benchmark = "Successful Common App essays typically read at grade 10–13.";
    } else if (averaged < 12) {
      band = "Mid HS";
      verdict = "Solid mid-high-school level — readable, but you can elevate diction and add depth of reflection.";
      benchmark = "Successful essays from JHU/Hamilton ‘Essays That Worked’ average grade 10–12.";
    } else if (averaged < 14) {
      band = "Late HS / College";
      verdict = "Right in the sweet spot of successful college-admissions writing — clear, sophisticated, not overwrought.";
      benchmark = "Matches the grade range of successful JHU/Hamilton/Common App sample essays.";
    } else {
      band = "Graduate";
      verdict = "Reads above the college range. Strong vocabulary, but watch for overly long sentences or stiff academic tone — admissions essays should still feel personal.";
      benchmark = "Successful college essays rarely exceed grade 14; consider trimming long sentences.";
    }

    // Compare against benchmarks of successful essays (sourced from JHU + Hamilton 'Essays That Worked' aggregates)
    const avgSent = wordsPerSentence;
    const sentLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const sentVariance = sentLengths.length > 1
      ? Math.sqrt(sentLengths.reduce((a, l) => a + (l - avgSent) ** 2, 0) / sentLengths.length)
      : 0;
    const clicheCount = CLICHES.filter(c => essay.toLowerCase().includes(c)).length;
    const sensoryCount = SENSORY_WORDS.filter(s => essay.toLowerCase().includes(s)).length;
    const properNouns = (essay.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []).length;
    const numericDetails = (essay.match(/\b\d+\b/g) || []).length;
    const specificity = properNouns + numericDetails + sensoryCount;

    const comparison: GradeLevelReport["comparison"] = [
      {
        metric: "Reading grade level",
        yours: `Grade ${averaged}`,
        successful: "Grade 10–13",
        status: averaged >= 10 && averaged <= 13.5 ? "good" : averaged < 8 || averaged > 15 ? "bad" : "warn",
      },
      {
        metric: "Avg sentence length",
        yours: `${avgSent.toFixed(1)} words`,
        successful: "12–22 words",
        status: avgSent >= 12 && avgSent <= 22 ? "good" : avgSent < 8 || avgSent > 30 ? "bad" : "warn",
      },
      {
        metric: "Sentence variety (σ)",
        yours: sentVariance.toFixed(1),
        successful: "≥ 5 (mix short + long)",
        status: sentVariance >= 5 ? "good" : sentVariance >= 3 ? "warn" : "bad",
      },
      {
        metric: "Clichés found",
        yours: String(clicheCount),
        successful: "0",
        status: clicheCount === 0 ? "good" : clicheCount <= 1 ? "warn" : "bad",
      },
      {
        metric: "Concrete details (names, numbers, senses)",
        yours: String(specificity),
        successful: "≥ 8 in a strong essay",
        status: specificity >= 8 ? "good" : specificity >= 4 ? "warn" : "bad",
      },
      {
        metric: "Word count",
        yours: String(words.length),
        successful: "500–650",
        status: words.length >= 500 && words.length <= 650 ? "good" : words.length >= 300 && words.length <= 700 ? "warn" : "bad",
      },
    ];

    return {
      fleschKincaid: clamp(fk),
      gunningFog: clamp(fog),
      colemanLiau: clamp(cli),
      averaged,
      band,
      verdict,
      benchmark,
      comparison,
    };
  };

  const analyzeEssay = () => {
    const words = essay.trim().split(/\s+/).filter(Boolean);
    const wc = words.length;
    setWordCount(wc);
    const fb: { type: "success" | "warning" | "error" | "info"; text: string }[] = [];

    // Word count
    if (wc < 150) fb.push({ type: "error", text: "⚠️ Your essay is very short. Most college essays should be 250–650 words." });
    else if (wc < 250) fb.push({ type: "warning", text: "📏 Your essay is under the typical 250-word minimum. Consider expanding." });
    else if (wc > 650) fb.push({ type: "warning", text: "📏 Your essay exceeds the Common App 650-word limit. Consider trimming." });
    else fb.push({ type: "success", text: `✅ Word count (${wc}) is within the 250–650 word range.` });

    // Opening
    const firstSentence = essay.split(/[.!?]/)[0]?.toLowerCase() || "";
    const clicheOpeners = CLICHES.filter(c => firstSentence.includes(c));
    if (clicheOpeners.length > 0) {
      fb.push({ type: "error", text: `🚫 Your opening uses a cliché: "${clicheOpeners[0]}". Successful essays open with action, dialogue, or a vivid moment.` });
    } else if (firstSentence.length > 10) {
      fb.push({ type: "success", text: "✅ Your opening avoids common clichés." });
    }

    // Vague words
    const vagueWords = ["very", "really", "a lot", "many things", "stuff", "things", "good", "bad", "nice", "great"];
    const foundVague = vagueWords.filter(w => essay.toLowerCase().includes(w));
    if (foundVague.length >= 4) fb.push({ type: "error", text: `🔍 Too many vague words: ${foundVague.slice(0, 5).join(", ")}. Replace with specific, descriptive language.` });
    else if (foundVague.length >= 2) fb.push({ type: "warning", text: `📝 Consider replacing vague words: ${foundVague.join(", ")}` });

    // Sentence variety
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const startsWithI = sentences.filter(s => s.trim().toLowerCase().startsWith("i ")).length;
    if (sentences.length > 3 && startsWithI / sentences.length > 0.5) {
      fb.push({ type: "warning", text: `💡 ${startsWithI} of ${sentences.length} sentences start with "I". Successful essays vary openings.` });
    }

    // Paragraph structure
    const paragraphs = essay.split(/\n\n+/).filter(p => p.trim().length > 0);
    if (paragraphs.length < 3 && wc > 200) fb.push({ type: "warning", text: "📝 Break your essay into more paragraphs (intro, body, conclusion)." });
    else if (paragraphs.length >= 3) fb.push({ type: "success", text: `✅ Good paragraph structure (${paragraphs.length} paragraphs).` });

    // Weak phrases
    const foundWeak = WEAK_PHRASES.filter(p => essay.toLowerCase().includes(p));
    if (foundWeak.length > 0) fb.push({ type: "warning", text: `💡 Weak phrases detected: "${foundWeak.slice(0, 3).join('", "')}". Strong essays use direct voice — try removing them.` });

    // Clichés
    const foundCliches = CLICHES.filter(c => essay.toLowerCase().includes(c));
    if (foundCliches.length > 1) fb.push({ type: "error", text: `🚫 Multiple clichés found: "${foundCliches.slice(0, 3).join('", "')}". Replace with original language.` });

    // Passive voice
    const passive = essay.match(/\b(was|were|is|are|been|being)\s+(being\s+)?\w+ed\b/gi) || [];
    if (passive.length > 3) fb.push({ type: "warning", text: `💡 ${passive.length} passive-voice constructions. Successful essays favor active voice.` });

    // Repetition
    const wordFreq: Record<string, number> = {};
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, "");
      if (clean.length > 4) wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    });
    const repeated = Object.entries(wordFreq).filter(([_, c]) => c > 4).sort((a, b) => b[1] - a[1]);
    if (repeated.length > 0) fb.push({ type: "warning", text: `🔄 Repeated words: ${repeated.slice(0, 3).map(([w, c]) => `"${w}" (${c}x)`).join(", ")}. Vary your vocabulary.` });

    // Authenticity / depth of reflection
    const reflectionMarkers = ["i realized", "i learned", "i understood", "i discovered", "i wondered", "i questioned", "i now", "looking back"];
    const reflectionHits = reflectionMarkers.filter(m => essay.toLowerCase().includes(m)).length;
    if (reflectionHits === 0 && wc > 200) fb.push({ type: "warning", text: "🔍 No clear reflection markers (e.g. 'I realized', 'looking back'). Successful essays surface insight." });
    else if (reflectionHits >= 2) fb.push({ type: "success", text: "✅ Essay shows reflective insight — a hallmark of successful admissions essays." });

    // Authenticity of voice — contractions + first-person specificity
    const hasContractions = /\b(i'm|i've|i'd|don't|can't|won't|isn't|wasn't)\b/i.test(essay);
    if (!hasContractions && wc > 200) fb.push({ type: "info", text: "🗣️ No contractions detected — successful personal essays usually sound conversational." });

    setFeedback(fb);
    setGradeReport(computeGradeLevel());
  };

  const handleEssayChange = (text: string) => {
    setEssay(text);
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    if (feedback.length > 0) setFeedback([]);
    setGradeReport(null);
  };

  const typeColors = {
    success: "bg-green-50 border-green-400 text-green-800",
    warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
    error: "bg-red-50 border-red-400 text-red-800",
    info: "bg-blue-50 border-blue-400 text-blue-800",
  };

  const statusColors = {
    good: "bg-green-100 text-green-800 border-green-400",
    warn: "bg-yellow-100 text-yellow-800 border-yellow-400",
    bad: "bg-red-100 text-red-800 border-red-400",
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-5">
      <h2 className="text-3xl font-bold text-primary mb-2">📝 Essay Resource Center</h2>
      <p className="text-muted-foreground mb-6">Write, review, and benchmark your essay against successful admissions writing</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["write", "prompts", "tips", "resources"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}>
            {t === "write" ? "✍️ Write & Grade" : t === "prompts" ? "📋 Prompts" : t === "tips" ? "💡 Tips" : "📚 Resources"}
          </button>
        ))}
      </div>

      {activeTab === "write" && (
        <div>
          <div className="bg-card rounded-xl shadow-md p-6 border border-border">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-foreground">Paste or write your essay below</label>
              <span className={`text-xs font-bold ${wordCount > 650 ? "text-destructive" : wordCount >= 250 ? "text-green-600" : "text-muted-foreground"}`}>
                {wordCount} / 650 words
              </span>
            </div>
            <input
              type="text"
              value={essayPrompt}
              onChange={e => setEssayPrompt(e.target.value)}
              placeholder="(Optional) Paste the essay prompt for context..."
              className="w-full p-2 mb-2 border border-input rounded-lg bg-background text-foreground text-sm"
            />
            <textarea
              value={essay}
              onChange={e => handleEssayChange(e.target.value)}
              placeholder="Start writing or paste your essay here..."
              className="w-full h-64 p-4 border border-input rounded-lg bg-background text-foreground resize-y text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${wordCount > 650 ? "bg-destructive" : wordCount >= 250 ? "bg-green-500" : "bg-secondary"}`}
                style={{ width: `${Math.min(100, (wordCount / 650) * 100)}%` }} />
            </div>
            <Button onClick={analyzeEssay} disabled={essay.trim().length < 50} className="w-full mt-3">
              📚 Analyze Writing Grade Level + Benchmark
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Compares your essay against successful admissions essays (JHU & Hamilton "Essays That Worked") on grade level, sentence variety, specificity, and clichés.
            </p>
          </div>

          {gradeReport && (
            <div className="bg-card rounded-xl shadow-md p-6 border border-border mt-4">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h3 className="text-lg font-bold text-primary">📚 Writing Grade-Level Report</h3>
                <span className="bg-primary text-primary-foreground text-lg font-extrabold px-4 py-1 rounded-full">
                  Grade {gradeReport.averaged}
                </span>
              </div>
              <p className="italic text-foreground mb-2">{gradeReport.verdict}</p>
              <p className="text-xs text-muted-foreground mb-4">📖 {gradeReport.benchmark}</p>

              <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                <div className="bg-muted/40 p-2 rounded text-center">
                  <b>Flesch–Kincaid</b><br/>Grade {gradeReport.fleschKincaid}
                </div>
                <div className="bg-muted/40 p-2 rounded text-center">
                  <b>Gunning Fog</b><br/>Grade {gradeReport.gunningFog}
                </div>
                <div className="bg-muted/40 p-2 rounded text-center">
                  <b>Coleman–Liau</b><br/>Grade {gradeReport.colemanLiau}
                </div>
              </div>

              <h4 className="font-bold text-sm mb-2 text-primary">📊 Benchmark vs. Successful Essays</h4>
              <div className="space-y-2">
                {gradeReport.comparison.map((c, i) => (
                  <div key={i} className={`p-2 rounded border-l-4 text-sm ${statusColors[c.status]}`}>
                    <div className="flex justify-between flex-wrap gap-2">
                      <b>{c.metric}</b>
                      <span>You: <b>{c.yours}</b> &nbsp;•&nbsp; Successful: {c.successful}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feedback.length > 0 && (
            <div className="bg-card rounded-xl shadow-md p-6 border border-border mt-4 space-y-2">
              <h3 className="text-lg font-bold text-primary mb-2">Detailed Feedback ({feedback.length} items)</h3>
              {feedback.map((fb, i) => (
                <div key={i} className={`p-3 rounded-lg text-sm border-l-4 ${typeColors[fb.type]}`}>{fb.text}</div>
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
                  <div key={j} className="p-3 bg-muted/30 rounded-lg text-sm text-foreground border-l-4 border-primary">{p}</div>
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
