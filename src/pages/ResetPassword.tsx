import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase puts recovery tokens in the URL hash; the client auto-parses
    // them and emits a PASSWORD_RECOVERY event.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also check current session — if user already has a recovery session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    toast.success("Password updated. You're signed in.");
    navigate("/", { replace: true });
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-5">
      <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/ess-logo.png" alt="ESS" className="h-10 w-10 object-contain" />
          <h1 className="text-3xl font-bold text-primary">RaidersMatch</h1>
        </div>
        <h2 className="text-xl font-semibold text-primary mb-4">Set a new password</h2>

        {!ready ? (
          <p className="text-sm text-muted-foreground">
            Validating reset link... If this doesn't load, your link may have expired.
            Request a new one from the sign-in page.
          </p>
        ) : (
          <>
            {error && <p className="text-destructive text-sm mb-3">{error}</p>}
            <Input type="password" placeholder="New password" value={password}
              onChange={e => setPassword(e.target.value)} className="mb-3" autoComplete="new-password" />
            <Input type="password" placeholder="Confirm password" value={confirm}
              onChange={e => setConfirm(e.target.value)} className="mb-4" autoComplete="new-password"
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
