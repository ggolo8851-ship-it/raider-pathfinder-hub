import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUsers, saveUsers, setSession, getDefaultProfile } from "@/lib/store";

interface AuthPageProps {
  onLogin: (email: string) => void;
}

type View = "login" | "signup" | "forgot";

const AuthPage = ({ onLogin }: AuthPageProps) => {
  const [view, setView] = useState<View>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [regName, setRegName] = useState("");
  const [regUser, setRegUser] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPhrase, setResetPhrase] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetStep2, setResetStep2] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");
    const users = getUsers();
    const email = loginEmail.toLowerCase().trim();
    if (users[email] && users[email].pass === loginPass) {
      setSession(email);
      onLogin(email);
    } else {
      setError("Invalid login credentials.");
    }
  };

  const handleSignup = () => {
    setError("");
    const users = getUsers();
    const email = regEmail.toLowerCase().trim();
    if (users[email]) { setError("Email already in use."); return; }
    if (!regUser.trim()) { setError("Please choose a username."); return; }
    if (!regPass) { setError("Please enter a password."); return; }
    users[email] = {
      name: regName, username: regUser.trim(), pass: regPass,
      setupComplete: false, profile: getDefaultProfile(), bookmarks: []
    };
    saveUsers(users);
    setView("login");
    setError("");
  };

  const handleReset = () => {
    setError("");
    const users = getUsers();
    const email = resetEmail.toLowerCase().trim();
    if (!users[email]) { setError("No account found."); return; }
    if (!resetStep2) { setResetStep2(true); return; }
    if (resetPhrase.toLowerCase().trim() === "raider gold success future") {
      users[email].pass = resetNewPass;
      saveUsers(users);
      setResetStep2(false);
      setView("login");
    } else {
      setError("Incorrect security phrase.");
    }
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-5">
      <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-primary mb-6">RaidersMatch</h1>
        {error && <p className="text-destructive text-sm mb-4">{error}</p>}

        {view === "login" && (
          <>
            <Input placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="mb-3" />
            <Input type="password" placeholder="Password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="mb-4" />
            <Button onClick={handleLogin} className="w-full mb-3">Sign In</Button>
            <p className="text-sm text-muted-foreground">
              New? <button onClick={() => setView("signup")} className="text-secondary font-semibold underline">Sign Up</button>
              {" | "}
              <button onClick={() => setView("forgot")} className="text-secondary font-semibold underline">Forgot Password?</button>
            </p>
          </>
        )}

        {view === "signup" && (
          <>
            <h2 className="text-xl font-semibold text-primary mb-4">Join Students for Success</h2>
            <Input placeholder="Full Name" value={regName} onChange={e => setRegName(e.target.value)} className="mb-3" />
            <Input placeholder="Username" value={regUser} onChange={e => setRegUser(e.target.value)} className="mb-3" />
            <Input placeholder="Email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="mb-3" />
            <Input type="password" placeholder="Password" value={regPass} onChange={e => setRegPass(e.target.value)} className="mb-4" />
            <Button onClick={handleSignup} className="w-full mb-3">Register</Button>
            <button onClick={() => setView("login")} className="text-sm text-muted-foreground underline">Back</button>
          </>
        )}

        {view === "forgot" && (
          <>
            <h2 className="text-xl font-semibold text-primary mb-4">Reset Password</h2>
            <Input placeholder="Your Email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="mb-3" />
            {resetStep2 && (
              <>
                <p className="text-xs text-muted-foreground mb-2">Phrase: raider gold success future</p>
                <Input placeholder="Enter security phrase" value={resetPhrase} onChange={e => setResetPhrase(e.target.value)} className="mb-3" />
                <Input type="password" placeholder="New Password" value={resetNewPass} onChange={e => setResetNewPass(e.target.value)} className="mb-3" />
              </>
            )}
            <Button onClick={handleReset} className="w-full mb-3">{resetStep2 ? "Confirm New Password" : "Verify Email"}</Button>
            <button onClick={() => { setView("login"); setResetStep2(false); }} className="text-sm text-muted-foreground underline">Cancel</button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
