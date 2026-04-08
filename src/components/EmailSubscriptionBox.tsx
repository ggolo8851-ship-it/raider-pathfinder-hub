import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUsers, saveUsers } from "@/lib/store";

interface EmailSubscriptionBoxProps {
  email: string;
  gradYear: string;
}

const INTEREST_OPTIONS = [
  { id: "college_matches", label: "🎓 College Matches", desc: "Personalized college recommendations" },
  { id: "scholarships", label: "💰 Scholarship Alerts", desc: "New scholarship opportunities" },
  { id: "app_tips", label: "📝 Application Tips", desc: "Essay writing and application guides" },
  { id: "sat_act", label: "📊 SAT/ACT Reminders", desc: "Test dates and prep resources" },
  { id: "deadlines", label: "⏰ Deadline Reminders", desc: "FAFSA, Common App, and more" },
  { id: "campus_visits", label: "🏫 Campus Visit Info", desc: "Virtual tours and visit sign-ups" },
];

const EmailSubscriptionBox = ({ email, gradYear }: EmailSubscriptionBoxProps) => {
  const users = getUsers();
  const user = users[email];
  const existing = user?.profile?.emailSubscription;

  const [subscribed, setSubscribed] = useState(existing?.enabled || false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(existing?.interests || []);
  const [contactEmail, setContactEmail] = useState(email);
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubscribe = () => {
    const users = getUsers();
    if (users[email]) {
      users[email].profile.emailSubscription = {
        enabled: true,
        interests: selectedInterests,
      };
      saveUsers(users);
      setSubscribed(true);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleUnsubscribe = () => {
    const users = getUsers();
    if (users[email]) {
      users[email].profile.emailSubscription = { enabled: false, interests: [] };
      saveUsers(users);
      setSubscribed(false);
      setSelectedInterests([]);
    }
  };

  return (
    <div className="mt-10 bg-card rounded-2xl shadow-lg border border-border p-6">
      <h3 className="text-xl font-bold text-primary mb-2">📬 Get College Matches & Deadline Alerts</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Stay on track with personalized updates, college recommendations, and deadline reminders delivered to your inbox.
      </p>

      {showSuccess && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-3 rounded mb-4 text-sm font-semibold">
          ✅ You're subscribed! You'll receive personalized updates based on your interests.
        </div>
      )}

      {subscribed ? (
        <div>
          <p className="text-sm text-foreground mb-2">✅ You're subscribed to:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedInterests.map(id => {
              const opt = INTEREST_OPTIONS.find(o => o.id === id);
              return opt ? (
                <span key={id} className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-semibold">{opt.label}</span>
              ) : null;
            })}
          </div>
          <Button variant="outline" size="sm" onClick={handleUnsubscribe}>Unsubscribe</Button>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <label className="text-sm font-semibold text-foreground">Email Address</label>
            <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="mt-1" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-2">What would you like to receive?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {INTEREST_OPTIONS.map(opt => (
              <label key={opt.id} className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedInterests.includes(opt.id) ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              }`}>
                <input type="checkbox" checked={selectedInterests.includes(opt.id)} onChange={() => toggleInterest(opt.id)}
                  className="accent-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <Button onClick={handleSubscribe} disabled={selectedInterests.length === 0} className="w-full">
            Subscribe to Updates
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">No spam — only useful, personalized updates for Class of {gradYear}.</p>
        </div>
      )}
    </div>
  );
};

export default EmailSubscriptionBox;
