import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  selectQuestions,
  newSeed,
  getSeenIds,
  recordSeenIds,
  scoreAnswers,
  type QuizQuestion,
} from "@/lib/quiz-engine";

interface VibePollQuizProps {
  initialAnswers?: Record<string, string>;
  onComplete: (answers: Record<string, string>) => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

const SEED_KEY = "rm_quiz_seed_v1";

const VibePollQuiz = ({ initialAnswers = {}, onComplete, onBack, showBackButton = false }: VibePollQuizProps) => {
  // Seed persists per browser so the same student sees a consistent quiz, but
  // a brand-new session (no stored seed) gets a fresh randomized set.
  const seed = useMemo(() => {
    try {
      const existing = localStorage.getItem(SEED_KEY);
      if (existing) return existing;
      const s = newSeed();
      localStorage.setItem(SEED_KEY, s);
      return s;
    } catch {
      return newSeed();
    }
  }, []);

  const questions: QuizQuestion[] = useMemo(
    () => selectQuestions(seed, getSeenIds()),
    [seed]
  );

  // Normalize incoming answers to "A" | "B" only for ids that exist in this set.
  const normalized: Record<string, "A" | "B"> = {};
  for (const q of questions) {
    const v = initialAnswers[q.id];
    if (v === "A" || v === "B") normalized[q.id] = v;
  }

  const [answers, setAnswers] = useState<Record<string, "A" | "B">>(normalized);
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    recordSeenIds(questions.map(q => q.id));
  }, [questions]);

  if (questions.length === 0) {
    return <div className="text-sm text-muted-foreground">Loading quiz…</div>;
  }

  const q = questions[currentQ];
  const totalQ = questions.length;
  const progress = ((currentQ + 1) / totalQ) * 100;

  const handleAnswer = (choice: "A" | "B") => {
    const updated = { ...answers, [q.id]: choice };
    setAnswers(updated);
    if (currentQ < totalQ - 1) setCurrentQ(currentQ + 1);
  };

  const allAnswered = questions.every(qq => answers[qq.id]);

  const finish = () => {
    // Stash derived vector for downstream consumers that want it.
    try {
      const vec = scoreAnswers(questions, answers);
      localStorage.setItem("rm_quiz_vector_v1", JSON.stringify(vec));
    } catch { /* ignore */ }
    onComplete(answers as Record<string, string>);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span className="capitalize">{q.category}</span>
          <span>{currentQ + 1} / {totalQ}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4">{q.text}</h3>

      <div className="space-y-3">
        <button
          onClick={() => handleAnswer("A")}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
            answers[q.id] === "A"
              ? "border-primary bg-primary/10 shadow-md"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <span className="text-sm font-semibold text-foreground">{q.optionA}</span>
        </button>
        <button
          onClick={() => handleAnswer("B")}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
            answers[q.id] === "B"
              ? "border-primary bg-primary/10 shadow-md"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <span className="text-sm font-semibold text-foreground">{q.optionB}</span>
        </button>
      </div>

      <div className="flex gap-2 mt-6">
        {currentQ > 0 && (
          <Button variant="outline" onClick={() => setCurrentQ(currentQ - 1)} className="flex-1">
            ← Previous
          </Button>
        )}
        {showBackButton && currentQ === 0 && onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        )}
        {answers[q.id] && currentQ < totalQ - 1 && (
          <Button onClick={() => setCurrentQ(currentQ + 1)} className="flex-1">
            Next →
          </Button>
        )}
        {allAnswered && (
          <Button onClick={finish} className="flex-1">
            See My Matches! 🎯
          </Button>
        )}
      </div>

      <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            onClick={() => setCurrentQ(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === currentQ ? "bg-primary scale-125" :
              answers[qq.id] ? "bg-primary/50" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default VibePollQuiz;
