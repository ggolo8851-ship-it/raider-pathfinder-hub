import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VIBE_POLL_QUESTIONS } from "@/lib/store";

interface VibePollQuizProps {
  initialAnswers?: Record<string, string>;
  onComplete: (answers: Record<string, string>) => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

const VibePollQuiz = ({ initialAnswers = {}, onComplete, onBack, showBackButton = false }: VibePollQuizProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [currentQ, setCurrentQ] = useState(0);

  const q = VIBE_POLL_QUESTIONS[currentQ];
  const totalQ = VIBE_POLL_QUESTIONS.length;
  const progress = ((currentQ + 1) / totalQ) * 100;

  const handleAnswer = (tag: string) => {
    const updated = { ...answers, [q.id]: tag };
    setAnswers(updated);
    if (currentQ < totalQ - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const allAnswered = Object.keys(answers).length >= totalQ;

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{q.category}</span>
          <span>{currentQ + 1} / {totalQ}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4">{q.question}</h3>

      <div className="space-y-3">
        <button
          onClick={() => handleAnswer(q.tagA)}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
            answers[q.id] === q.tagA
              ? "border-primary bg-primary/10 shadow-md"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <span className="text-sm font-semibold text-foreground">{q.optionA}</span>
        </button>
        <button
          onClick={() => handleAnswer(q.tagB)}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
            answers[q.id] === q.tagB
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
          <Button onClick={() => onComplete(answers)} className="flex-1">
            See My Matches! 🎯
          </Button>
        )}
      </div>

      {/* Quick answer dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {VIBE_POLL_QUESTIONS.map((_, i) => (
          <button key={i} onClick={() => setCurrentQ(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === currentQ ? "bg-primary scale-125" :
              answers[VIBE_POLL_QUESTIONS[i].id] ? "bg-primary/50" : "bg-muted"
            }`} />
        ))}
      </div>
    </div>
  );
};

export default VibePollQuiz;
