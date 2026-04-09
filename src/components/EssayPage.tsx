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

// Enhanced grammar/style analysis patterns
const GRAMMAR_ISSUES = [
  { pattern: /\b(their|there|they're)\b/gi, name: "their/there/they're", tip: "Double-check their/there/they're usage" },
  { pattern: /\b(your|you're)\b/gi, name: "your/you're", tip: "Make sure you're using your/you're correctly" },
  { pattern: /\b(its|it's)\b/gi, name: "its/it's", tip: "Check its/it's — 'it's' = 'it is', 'its' = possessive" },
  { pattern: /\b(affect|effect)\b/gi, name: "affect/effect", tip: "Verify affect (verb) vs. effect (noun) usage" },
  { pattern: /\b(then|than)\b/gi, name: "then/than", tip: "Check then (time) vs. than (comparison)" },
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

const EssayPage = () => {
  const [essay, setEssay] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "warning" | "error" | "info"; text: string }[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"write" | "prompts" | "tips" | "resources">("write");
  const [readabilityScore, setReadabilityScore] = useState<number | null>(null);

  const analyzeEssay = () => {
    const words = essay.trim().split(/\s+/).filter(Boolean);
    const wc = words.length;
    setWordCount(wc);
    const fb: { type: "success" | "warning" | "error" | "info"; text: string }[] = [];

    // Word count
    if (wc < 150) fb.push({ type: "error", text: "⚠️ Your essay is very short. Most college essays should be 250-650 words." });
    else if (wc < 250) fb.push({ type: "warning", text: "📏 Your essay is under the typical 250-word minimum. Consider expanding." });
    else if (wc > 650) fb.push({ type: "warning", text: "📏 Your essay exceeds the Common App 650-word limit. Consider trimming." });
    else fb.push({ type: "success", text: `✅ Word count (${wc}) is within the 250-650 word range.` });

    // Opening analysis
    const firstSentence = essay.split(/[.!?]/)[0]?.toLowerCase() || "";
    const clicheOpeners = CLICHES.filter(c => firstSentence.includes(c));
    if (clicheOpeners.length > 0) {
      fb.push({ type: "error", text: `🚫 Your opening uses a cliché: "${clicheOpeners[0]}". Start with action, dialogue, or a vivid moment instead.` });
    } else if (firstSentence.length > 10) {
      fb.push({ type: "success", text: "✅ Your opening avoids common clichés." });
    }

    // Vague words
    const vagueWords = ["very", "really", "a lot", "many things", "stuff", "things", "good", "bad", "nice", "great"];
    const foundVague = vagueWords.filter(w => essay.toLowerCase().includes(w));
    if (foundVague.length >= 4) {
      fb.push({ type: "error", text: `🔍 Too many vague words: ${foundVague.slice(0, 5).join(", ")}. Replace with specific, descriptive language.` });
    } else if (foundVague.length >= 2) {
      fb.push({ type: "warning", text: `📝 Consider replacing vague words: ${foundVague.join(", ")}` });
    } else {
      fb.push({ type: "success", text: "✅ Good use of specific language." });
    }

    // Sentence variety
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const startsWithI = sentences.filter(s => s.trim().toLowerCase().startsWith("i ")).length;
    if (sentences.length > 3 && startsWithI / sentences.length > 0.5) {
      fb.push({ type: "warning", text: `💡 ${startsWithI} of ${sentences.length} sentences start with "I". Vary your sentence structure.` });
    }

    // Sentence length variety
    const sentLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLen = sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length;
    const longSentences = sentLengths.filter(l => l > 35).length;
    const shortSentences = sentLengths.filter(l => l < 5 && l > 0).length;
    if (longSentences > 2) fb.push({ type: "warning", text: `📝 ${longSentences} sentences are over 35 words. Break them up for clarity.` });
    if (avgLen > 0) fb.push({ type: "info", text: `📊 Average sentence length: ${avgLen.toFixed(0)} words` });

    // Paragraph structure
    const paragraphs = essay.split(/\n\n+/).filter(p => p.trim().length > 0);
    if (paragraphs.length < 3 && wc > 200) {
      fb.push({ type: "warning", text: "📝 Break your essay into more paragraphs (intro, body, conclusion)." });
    } else if (paragraphs.length >= 3) {
      fb.push({ type: "success", text: `✅ Good paragraph structure (${paragraphs.length} paragraphs).` });
    }

    // Weak phrases
    const foundWeak = WEAK_PHRASES.filter(p => essay.toLowerCase().includes(p));
    if (foundWeak.length > 0) {
      fb.push({ type: "warning", text: `💡 Weak phrases detected: "${foundWeak.slice(0, 3).join('", "')}". These weaken your voice — try removing them.` });
    }

    // Clichés throughout
    const foundCliches = CLICHES.filter(c => essay.toLowerCase().includes(c));
    if (foundCliches.length > 1) {
      fb.push({ type: "error", text: `🚫 Multiple clichés found: "${foundCliches.slice(0, 3).join('", "')}". Replace with original language.` });
    }

    // Grammar checks
    const essayLower = essay.toLowerCase();
    GRAMMAR_ISSUES.forEach(g => {
      if (g.pattern.test(essayLower)) {
        fb.push({ type: "info", text: `📝 Grammar check: ${g.tip}` });
      }
    });

    // Passive voice detection
    const passivePatterns = /\b(was|were|is|are|been|being)\s+(being\s+)?\w+ed\b/gi;
    const passiveMatches = essay.match(passivePatterns) || [];
    if (passiveMatches.length > 3) {
      fb.push({ type: "warning", text: `💡 ${passiveMatches.length} instances of passive voice detected. Use active voice for stronger writing.` });
    }

    // Repetition detection
    const wordFreq: Record<string, number> = {};
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, "");
      if (clean.length > 4) wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    });
    const repeated = Object.entries(wordFreq).filter(([_, count]) => count > 4).sort((a, b) => b[1] - a[1]);
    if (repeated.length > 0) {
      fb.push({ type: "warning", text: `🔄 Repeated words: ${repeated.slice(0, 3).map(([w, c]) => `"${w}" (${c}x)`).join(", ")}. Try using synonyms.` });
    }

    // Double spaces
    const doubleSpaces = (essay.match(/  +/g) || []).length;
    if (doubleSpaces > 2) fb.push({ type: "info", text: `📝 ${doubleSpaces} extra spaces found — clean up before submitting.` });

    // Readability score (simplified Flesch-Kincaid)
    const syllableCount = words.reduce((total, word) => {
      const w = word.toLowerCase().replace(/[^a-z]/g, "");
      let syllables = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").match(/[aeiouy]{1,2}/g);
      return total + Math.max(1, syllables ? syllables.length : 1);
    }, 0);
    if (sentences.length > 0 && words.length > 0) {
      const fk = 0.39 * (words.length / sentences.length) + 11.8 * (syllableCount / words.length) - 15.59;
      const grade = Math.max(1, Math.min(16, Math.round(fk)));
      setReadabilityScore(grade);
      if (grade >= 12) fb.push({ type: "success", text: `📚 Reading level: College-level (Grade ${grade}). Appropriate for admissions.` });
      else if (grade >= 9) fb.push({ type: "info", text: `📚 Reading level: Grade ${grade}. Consider more sophisticated vocabulary.` });
      else fb.push({ type: "warning", text: `📚 Reading level: Grade ${grade}. Try using more advanced vocabulary and complex sentences.` });
    }

    // Overall assessment
    const errors = fb.filter(f => f.type === "error").length;
    const warnings = fb.filter(f => f.type === "warning").length;
    const successes = fb.filter(f => f.type === "success").length;
    if (errors === 0 && warnings <= 1 && wc >= 250) {
      fb.unshift({ type: "success", text: "🌟 Strong essay! Focus on making your unique voice shine and consider having someone else review it." });
    } else if (errors > 2) {
      fb.unshift({ type: "error", text: "⚠️ Several issues found. Address the red items first for the biggest improvement." });
    }

    setFeedback(fb);
  };

  const handleEssayChange = (text: string) => {
    setEssay(text);
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    if (feedback.length > 0) setFeedback([]);
  };

  const typeColors = {
    success: "bg-green-50 border-green-400 text-green-800",
    warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
    error: "bg-red-50 border-red-400 text-red-800",
    info: "bg-blue-50 border-blue-400 text-blue-800",
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-5">
      <h2 className="text-3xl font-bold text-primary mb-2">📝 Essay Resource Center</h2>
      <p className="text-muted-foreground mb-6">Write, review, and strengthen your college essays with AI-style feedback</p>

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
              <div className="flex items-center gap-3">
                {readabilityScore !== null && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">Grade {readabilityScore}</span>
                )}
                <span className={`text-xs font-bold ${wordCount > 650 ? "text-destructive" : wordCount >= 250 ? "text-green-600" : "text-muted-foreground"}`}>
                  {wordCount} / 650 words
                </span>
              </div>
            </div>
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
              🔍 Analyze My Essay (Grammar, Style, Structure)
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Checks: word count, clichés, vague language, sentence variety, passive voice, grammar, readability level, repetition, structure
            </p>
          </div>

          {feedback.length > 0 && (
            <div className="bg-card rounded-xl shadow-md p-6 border border-border mt-4 space-y-2">
              <h3 className="text-lg font-bold text-primary mb-2">Essay Feedback ({feedback.length} items)</h3>
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
