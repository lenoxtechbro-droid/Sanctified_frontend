import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type Mode = "sign_in" | "sign_up";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading: authLoading, refreshProfile } = useAuth();

  const initialMode: Mode = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("sign-up") || path.includes("signup")) return "sign_up";
    return "sign_in";
  }, [location.pathname]);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Password strength calculation
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
    
    // Require at least score of 3 (Good) for valid password
    const isValid = score >= 3;
    
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

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!authLoading && user) {
      const target = role === "admin" ? "/admin" : "/";
      navigate(target, { replace: true });
    }
  }, [authLoading, user, role, navigate]);

  const getMyRole = async (userId: string): Promise<"admin" | "premium" | "listener"> => {
    const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (error) return "listener";
    const r = (data?.role as "admin" | "premium" | "listener" | undefined) ?? "listener";
    return r === "admin" || r === "premium" || r === "listener" ? r : "listener";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    const baseUrl = window.location.origin;

    try {
      if (mode === "sign_up") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            emailRedirectTo: baseUrl,
            data: {
              full_name: fullName.trim() || undefined,
            },
          },
        });
        if (signUpError) throw signUpError;
        setMessage("Account created! Please check your email to confirm your account, then sign in.");
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (signInError) throw signInError;

        const signedInUserId = signInData.user?.id ?? signInData.session?.user?.id;
        if (signedInUserId) {
          await refreshProfile();
          const resolvedRole = await getMyRole(signedInUserId);

          if (resolvedRole === "admin") {
            navigate("/admin", { replace: true });
            return;
          }

          setMessage("Signed in successfully.");
          navigate("/?login=success", { replace: true });
          return;
        }

        setMessage("Signed in successfully.");
        navigate("/?login=success", { replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  // Enhanced password validation for Sign Up
  const validatePassword = (): string | null => {
    if (mode !== "sign_up") return null;
    
    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!passwordStrength.isValid) {
      return "Please create a stronger password with uppercase, lowercase, numbers, and special characters.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password strength for Sign Up
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    onSubmit(e);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage("Password reset link sent! Check your email.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const formVariants = {
    sign_in: { opacity: 1, x: 0 },
    sign_up: { opacity: 0, x: -20 }
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05, backgroundColor: "#9a7b1a" },
    tap: { scale: 0.98 }
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center p-4">
      {/* Decorative elements */}
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
            key={mode}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold text-white mb-2"
          >
            {mode === "sign_in" ? "Welcome to Sanctified Church" : "Join Our Community"}
          </motion.h1>
          <p className="text-white/70 text-sm">
            {mode === "sign_in"
              ? "Let us then approach God's throne of grace with confidence, that we may receive mercy and find grace to help us in our time of need. - Hebrews 4:16"
              : "Create an account to start your spiritual journey with us."}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex bg-white/10 rounded-xl p-1 mb-6">
          <motion.button
            type="button"
            onClick={() => setMode("sign_in")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all relative overflow-hidden ${
              mode === "sign_in" ? "text-navy-dark" : "text-white/70 hover:text-white"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {mode === "sign_in" && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white rounded-lg"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">Sign In</span>
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setMode("sign_up")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all relative overflow-hidden ${
              mode === "sign_up" ? "text-navy-dark" : "text-white/70 hover:text-white"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {mode === "sign_up" && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white rounded-lg"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">Sign Up</span>
          </motion.button>
        </div>

        {/* Error/Success Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
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
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-4 py-3 text-sm text-emerald-200"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            variants={formVariants}
            initial={mode === "sign_up" ? "sign_up" : "sign_in"}
            animate="sign_in"
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            {mode === "sign_up" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-xs font-medium text-white/80 mb-1.5">Full Name</label>
                <input
                  type="text"
                  className="glass-input w-full rounded-lg px-4 py-3 text-sm"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  placeholder="Enter your full name"
                />
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Email</label>
              <input
                type="email"
                required
                className="glass-input w-full rounded-lg px-4 py-3 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete={mode === "sign_up" ? "email" : "username"}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="glass-input w-full rounded-lg px-4 py-3 pr-12 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "sign_up" ? "new-password" : "current-password"}
                  placeholder="Enter your password"
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

              {/* Password Strength Indicator (Sign Up only) */}
              {mode === "sign_up" && password && (
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
                    <li className={password.length >= 8 ? "text-green-400" : ""}>
                      {password.length >= 8 ? "✓" : "○"} At least 8 characters
                    </li>
                    <li className={password.length >= 12 ? "text-green-400" : ""}>
                      {password.length >= 12 ? "✓" : "○"} At least 12 characters (recommended)
                    </li>
                    <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? "text-green-400" : ""}>
                      {/[a-z]/.test(password) && /[A-Z]/.test(password) ? "✓" : "○"} Uppercase & lowercase letters
                    </li>
                    <li className={/\d/.test(password) ? "text-green-400" : ""}>
                      {/\d/.test(password) ? "✓" : "○"} At least one number
                    </li>
                    <li className={/[^a-zA-Z0-9]/.test(password) ? "text-green-400" : ""}>
                      {/[^a-zA-Z0-9]/.test(password) ? "✓" : "○"} At least one special character
                    </li>
                  </ul>
                </motion.div>
              )}
            </div>

            {/* Forgot Password (Sign In only) */}
            {mode === "sign_in" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-end"
              >
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={busy}
                  className="text-xs text-gold hover:text-gold-light transition-colors disabled:opacity-50"
                >
                  Forgot Password?
                </button>
              </motion.div>
            )}

            {/* Submit Button */}
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Please wait…
                </span>
              ) : mode === "sign_in" ? "Sign In" : "Create Account"}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        {/* Toggle Mode Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white/60">
            {mode === "sign_in" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("sign_up")}
                  className="text-gold hover:text-gold-light font-medium transition-colors"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("sign_in")}
                  className="text-gold hover:text-gold-light font-medium transition-colors"
                >
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
