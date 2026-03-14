import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

export function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // When Supabase redirects here after the user clicks the email link it
  // fires an INITIAL_SESSION / PASSWORD_RECOVERY auth event with the token
  // baked into the URL hash. We listen for it so we know we have a valid
  // recovery session before letting the user submit.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION") {
          setSessionReady(true);
        }
      }
    );

    // Also check if there's already a session (in case the event already fired)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Password strength (same logic as LoginPage) ──────────────────────────
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "", isValid: false };

    const hasMinLength = password.length >= 8;
    const hasGoodLength = password.length >= 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    let score = 0;
    if (hasMinLength) score++;
    if (hasGoodLength) score++;
    if (hasUppercase && hasLowercase) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    const levels = [
      { score: 0, label: "", color: "", isValid: false },
      { score: 1, label: "Weak", color: "bg-red-500", isValid: false },
      { score: 2, label: "Fair", color: "bg-orange-500", isValid: false },
      { score: 3, label: "Good", color: "bg-yellow-500", isValid: true },
      { score: 4, label: "Strong", color: "bg-green-500", isValid: true },
      { score: 5, label: "Very Strong", color: "bg-green-600", isValid: true },
    ];

    return levels[Math.min(score, 5)];
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordStrength.isValid) {
      setError("Please create a stronger password (uppercase, lowercase, number, special character).");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Password updated! Redirecting to sign in…");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.98 },
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="glass-card w-full max-w-md rounded-2xl p-8 relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Set New Password
          </motion.h1>
          <p className="text-white/70 text-sm">
            Choose a strong new password for your account.
          </p>
        </div>

        {/* Error / Success alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-lg border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </motion.div>
          )}
          {message && (
            <motion.div
              key="message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-4 py-3 text-sm text-emerald-200"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invalid / expired link notice */}
        {!sessionReady && !message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 rounded-lg border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200"
          >
            Validating your reset link… If this takes too long the link may have expired.{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="underline text-gold hover:text-gold-light transition-colors"
            >
              Go back to sign in
            </button>
          </motion.div>
        )}

        {/* Form — only show when session is confirmed */}
        <AnimatePresence>
          {sessionReady && !message && (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
              onSubmit={handleSubmit}
            >
              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="glass-input w-full rounded-lg px-4 py-3 pr-12 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-dark hover:text-navy transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white/50">Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength.label === "Weak" ? "text-red-400" :
                        passwordStrength.label === "Fair" ? "text-orange-400" :
                        passwordStrength.label === "Good" ? "text-yellow-400" :
                        "text-green-400"
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className={`h-full ${passwordStrength.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <ul className="mt-2 space-y-1 text-[10px] text-white/40">
                      <li className={password.length >= 8 ? "text-green-400" : ""}>{password.length >= 8 ? "✓" : "○"} At least 8 characters</li>
                      <li className={password.length >= 12 ? "text-green-400" : ""}>{password.length >= 12 ? "✓" : "○"} At least 12 characters (recommended)</li>
                      <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? "text-green-400" : ""}>{/[a-z]/.test(password) && /[A-Z]/.test(password) ? "✓" : "○"} Uppercase & lowercase letters</li>
                      <li className={/\d/.test(password) ? "text-green-400" : ""}>{/\d/.test(password) ? "✓" : "○"} At least one number</li>
                      <li className={/[^a-zA-Z0-9]/.test(password) ? "text-green-400" : ""}>{/[^a-zA-Z0-9]/.test(password) ? "✓" : "○"} At least one special character</li>
                    </ul>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    className="glass-input w-full rounded-lg px-4 py-3 pr-12 text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-dark hover:text-navy transition-colors"
                  >
                    {showConfirm ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Match indicator */}
                {confirmPassword && (
                  <p className={`mt-1.5 text-xs ${password === confirmPassword ? "text-green-400" : "text-red-400"}`}>
                    {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={busy}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="mt-2 w-full rounded-xl bg-gold py-3.5 text-sm font-semibold text-white shadow-lg shadow-gold/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating…
                  </span>
                ) : "Update Password"}
              </motion.button>

              {/* Back to sign in */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-xs text-white/50 hover:text-white/80 transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
