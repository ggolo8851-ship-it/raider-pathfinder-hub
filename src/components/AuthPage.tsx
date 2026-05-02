import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } from "@/lib/auth";
import { toast } from "sonner";

interface AuthPageProps {
  onLogin: () => void;
}

type View = "login" | "signup" | "forgot";

const AuthPage = ({ onLogin }: AuthPageProps) => {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError(""); setLoading(true);
    const { error } = await signInWithEmail(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("blocked") || error.message.toLowerCase().includes("blacklist")) {
        setError("This email has been blocked from accessing RaidersMatch.");
      } else {
        setError(error.message);
      }
      return;
    }
    onLogin();
  };

  const handleSignup = async () => {
    setError(""); setLoading(true);
    const { error } = await signUpWithEmail(email.trim().toLowerCase(), password, fullName);
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("blocked")) {
        setError("This email has been blocked from creating an account.");
      } else {
        setError(error.message);
      }
      return;
    }
    toast.success("Account created — signing you in...");
    onLogin();
  };

  const handleGoogle = async () => {
    setError("");
    const result = await signInWithGoogle();
    if (result.error) setError(result.error.message);
    // result.redirected: browser navigates away
  };

  const handleReset = async () => {
    setError(""); setLoading(true);
    const { error } = await resetPassword(email.trim().toLowerCase());
    setLoading(false);
    if (error) { setError(error.message); return; }
    toast.success("Password reset email sent. Check your inbox.");
    setView("login");
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-5">
      <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/ess-logo.png" alt="ESS" className="h-10 w-10 object-contain" />
          <h1 className="text-3xl font-bold text-primary">RaidersMatch</h1>
        </div>

        {error && <p className="text-destructive text-sm mb-4">{error}</p>}

        {view === "login" && (
          <>
            <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="mb-3" autoComplete="email" />
            <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
              className="mb-4" autoComplete="current-password" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            <Button onClick={handleLogin} disabled={loading} className="w-full mb-3">{loading ? "Signing in..." : "Sign In"}</Button>
            <Button onClick={handleGoogle} variant="outline" className="w-full mb-3">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </Button>
            <p className="text-sm text-muted-foreground">
              New? <button onClick={() => { setView("signup"); setError(""); }} className="text-secondary font-semibold underline">Sign Up</button>
              {" | "}
              <button onClick={() => { setView("forgot"); setError(""); }} className="text-secondary font-semibold underline">Forgot Password?</button>
            </p>
          </>
        )}

        {view === "signup" && (
          <>
            <h2 className="text-xl font-semibold text-primary mb-4">Join Students for Success</h2>
            <Input placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} className="mb-3" autoComplete="name" />
            <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="mb-3" autoComplete="email" />
            <Input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} className="mb-3" autoComplete="new-password" />
            <p className="text-xs text-muted-foreground mb-4">Your browser may offer to save your password — this is recommended.</p>
            <Button onClick={handleSignup} disabled={loading} className="w-full mb-3">{loading ? "Creating..." : "Register"}</Button>
            <Button onClick={handleGoogle} variant="outline" className="w-full mb-3">Continue with Google</Button>
            <button onClick={() => { setView("login"); setError(""); }} className="text-sm text-muted-foreground underline">Back</button>
          </>
        )}

        {view === "forgot" && (
          <>
            <h2 className="text-xl font-semibold text-primary mb-4">Reset Password</h2>
            <p className="text-sm text-muted-foreground mb-3">We'll email you a secure reset link.</p>
            <Input placeholder="Your Email" value={email} onChange={e => setEmail(e.target.value)} className="mb-3" autoComplete="email" />
            <Button onClick={handleReset} disabled={loading} className="w-full mb-3">{loading ? "Sending..." : "Send Reset Link"}</Button>
            <button onClick={() => { setView("login"); setError(""); }} className="text-sm text-muted-foreground underline">Cancel</button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
