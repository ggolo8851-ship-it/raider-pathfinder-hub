import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUsers, saveUsers, setSession, getDefaultProfile, generateOTP } from "@/lib/store";

interface AuthPageProps {
  onLogin: (email: string) => void;
}

type View = "login" | "signup" | "forgot" | "otp";

const AuthPage = ({ onLogin }: AuthPageProps) => {
  const [view, setView] = useState<View>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [regName, setRegName] = useState("");
  const [regUser, setRegUser] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPhrase, setRegPhrase] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPhrase, setResetPhrase] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetStep2, setResetStep2] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpNewPass, setOtpNewPass] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    if (!regPhrase.trim()) { setError("Please create a security phrase for password recovery."); return; }
    users[email] = {
      name: regName, username: regUser.trim(), pass: regPass,
      securityPhrase: regPhrase.trim().toLowerCase(),
      setupComplete: false, profile: getDefaultProfile(), bookmarks: []
    };
    saveUsers(users);
    setView("login");
    setError("");
    setSuccess("Account created! Sign in to continue.");
  };

  const handleReset = () => {
    setError("");
    const users = getUsers();
    const email = resetEmail.toLowerCase().trim();
    if (!users[email]) { setError("No account found."); return; }
    if (!resetStep2) { setResetStep2(true); return; }
    if (resetPhrase.trim().toLowerCase() === users[email].securityPhrase) {
      users[email].pass = resetNewPass;
      saveUsers(users);
      setResetStep2(false);
      setView("login");
      setSuccess("Password reset! Sign in with your new password.");
    } else {
      setError("Incorrect security phrase.");
    }
  };

  const handleSendOTP = () => {
    setError("");
    setSuccess("");
    const users = getUsers();
    const email = otpEmail.toLowerCase().trim();
    if (!users[email]) { setError("No account found with that email."); return; }
    const otp = generateOTP();
    users[email].resetToken = otp;
    users[email].resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 min
    saveUsers(users);
    setGeneratedOtp(otp);
    setSuccess(`🔑 Your one-time reset code: ${otp} (In production, this would be emailed to you. Code expires in 10 minutes.)`);
  };

  const handleVerifyOTP = () => {
    setError("");
    const users = getUsers();
    const email = otpEmail.toLowerCase().trim();
    if (!users[email]) { setError("No account found."); return; }
    if (!users[email].resetToken || users[email].resetTokenExpiry! < Date.now()) {
      setError("Code expired. Please request a new one.");
      return;
    }
    if (otpCode !== users[email].resetToken) {
      setError("Invalid code. Please try again.");
      return;
    }
    if (!otpNewPass || otpNewPass.length < 4) {
      setError("Please enter a new password (min 4 characters).");
      return;
    }
    users[email].pass = otpNewPass;
    users[email].resetToken = undefined;
    users[email].resetTokenExpiry = undefined;
    saveUsers(users);
    setView("login");
    setSuccess("Password reset successfully! Sign in with your new password.");
    setGeneratedOtp("");
    setOtpCode("");
    setOtpNewPass("");
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-5">
      <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-primary mb-6">RaidersMatch</h1>
        {error && <p className="text-destructive text-sm mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

        {view === "login" && (
          <>
            <Input placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="mb-3" />
            <Input type="password" placeholder="Password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="mb-4"
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
            <Button onClick={handleLogin} className="w-full mb-3">Sign In</Button>
            <p className="text-sm text-muted-foreground">
              New? <button onClick={() => { setView("signup"); setError(""); setSuccess(""); }} className="text-secondary font-semibold underline">Sign Up</button>
              {" | "}
              <button onClick={() => { setView("forgot"); setError(""); setSuccess(""); }} className="text-secondary font-semibold underline">Forgot Password?</button>
            </p>
          </>
        )}

        {view === "signup" && (
          <>
            <h2 className="text-xl font-semibold text-primary mb-4">Join Students for Success</h2>
            <Input placeholder="Full Name" value={regName} onChange={e => setRegName(e.target.value)} className="mb-3" />
            <Input placeholder="Username" value={regUser} onChange={e => setRegUser(e.target.value)} className="mb-3" />
            <Input placeholder="Email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="mb-3" />
            <Input type="password" placeholder="Password" value={regPass} onChange={e => setRegPass(e.target.value)} className="mb-3" />
            <Input placeholder="Create a security phrase (for password reset)" value={regPhrase} onChange={e => setRegPhrase(e.target.value)} className="mb-1" />
            <p className="text-xs text-muted-foreground mb-4">This phrase is unique to you and will be used to reset your password.</p>
            <Button onClick={handleSignup} className="w-full mb-3">Register</Button>
            <button onClick={() => { setView("login"); setError(""); }} className="text-sm text-muted-foreground underline">Back</button>
          </>
        )}

        {view === "forgot" && (
          <>
            <h2 className="text-xl font-semibold text-primary mb-4">Reset Password</h2>
            <p className="text-sm text-muted-foreground mb-4">Choose a reset method:</p>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" onClick={() => setView("forgot")} className="flex-1 bg-primary/10">Security Phrase</Button>
              <Button variant="outline" onClick={() => { setView("otp"); setError(""); setSuccess(""); }} className="flex-1">One-Time Code</Button>
            </div>
            <Input placeholder="Your Email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="mb-3" />
            {resetStep2 && (
              <>
                <p className="text-xs text-muted-foreground mb-2">Enter the security phrase you created during sign up.</p>
                <Input placeholder="Enter your security phrase" value={resetPhrase} onChange={e => setResetPhrase(e.target.value)} className="mb-3" />
                <Input type="password" placeholder="New Password" value={resetNewPass} onChange={e => setResetNewPass(e.target.value)} className="mb-3" />
              </>
            )}
            <Button onClick={handleReset} className="w-full mb-3">{resetStep2 ? "Confirm New Password" : "Verify Email"}</Button>
            <button onClick={() => { setView("login"); setResetStep2(false); setError(""); }} className="text-sm text-muted-foreground underline">Cancel</button>
          </>
        )}

        {view === "otp" && (
          <>
            <h2 className="text-xl font-semibold text-primary mb-4">Reset via One-Time Code</h2>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" onClick={() => { setView("forgot"); setError(""); setSuccess(""); }} className="flex-1">Security Phrase</Button>
              <Button variant="outline" onClick={() => setView("otp")} className="flex-1 bg-primary/10">One-Time Code</Button>
            </div>
            <Input placeholder="Your Email" value={otpEmail} onChange={e => setOtpEmail(e.target.value)} className="mb-3" />
            <Button onClick={handleSendOTP} variant="outline" className="w-full mb-3">Send One-Time Code</Button>
            {generatedOtp && (
              <>
                <Input placeholder="Enter 6-digit code" value={otpCode} onChange={e => setOtpCode(e.target.value)} className="mb-3" maxLength={6} />
                <Input type="password" placeholder="New Password" value={otpNewPass} onChange={e => setOtpNewPass(e.target.value)} className="mb-3" />
                <Button onClick={handleVerifyOTP} className="w-full mb-3">Reset Password</Button>
              </>
            )}
            <button onClick={() => { setView("login"); setError(""); setSuccess(""); setGeneratedOtp(""); }} className="text-sm text-muted-foreground underline">Cancel</button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
