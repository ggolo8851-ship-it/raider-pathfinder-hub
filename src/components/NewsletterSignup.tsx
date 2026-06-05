import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  source?: string;
  defaultGradYear?: string | number;
  className?: string;
  compact?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NewsletterSignup = ({ source = "site", defaultGradYear, className = "", compact = false }: Props) => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [gradYear, setGradYear] = useState<string>(defaultGradYear ? String(defaultGradYear) : "");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Prefill with the signed-in user's email (they can still edit).
  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user?.email]);


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed) || trimmed.length > 254) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!consent) {
      toast.error("Please agree to receive updates so we can email you.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email: trimmed, grad_year: gradYear || null, source },
      });
      if (error) throw error;
      setDone(true);
      toast.success("You're on the list! Check your inbox to confirm.");
    } catch (err: any) {
      toast.error(err?.message || "Could not subscribe. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className={`rounded-xl border border-secondary/40 bg-secondary/10 p-4 ${className}`}>
        <p className="font-semibold text-foreground">🎉 You're subscribed.</p>
        <p className="text-sm text-muted-foreground mt-1">
          We sent a confirmation email — open it to lock in your spot. Updates come about once a month.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      {!compact && (
        <>
          <h3 className="text-lg font-bold text-primary">Get RaidersMatch updates</h3>
          <p className="text-sm text-muted-foreground mb-3">
            New colleges, new clubs, scholarship deadlines — straight to your inbox. About once a month, unsubscribe any time.
          </p>
        </>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@school.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={gradYear}
          onChange={(e) => setGradYear(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          aria-label="Graduation year"
        >
          <option value="">Grad year</option>
          {[2026, 2027, 2028, 2029, 2030, 2031].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {submitting ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      <label className="flex items-start gap-2 mt-3 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>I agree to receive email updates from RaidersMatch. You can unsubscribe any time using the link in every email.</span>
      </label>
    </form>
  );
};

export default NewsletterSignup;
