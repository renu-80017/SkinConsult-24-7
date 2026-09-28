import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import Layout from "../components/ui/Layout";
import GlassCard from "../components/ui/GlassCard";
import GradientButton from "../components/ui/GradientButton";
import SkinCellBackground from "../components/skin/SkinCellBackground";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function SignUp() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { signUp } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }
    setLoading(true);
    try {
      await signUp(form);
      setSuccess(true);
      push("Account created successfully", "success");
      setTimeout(() => navigate("/dashboard"), 1400);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
        <SkinCellBackground variant="cells" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-md"
        >
          <GlassCard className="p-8">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8 text-center"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500"
                  >
                    <CheckCircle2 className="h-8 w-8" />
                  </motion.span>
                  <h2 className="mt-4 text-xl font-bold text-[var(--text)]">Account Created!</h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">Redirecting to your dashboard...</p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h1 className="text-2xl font-bold text-[var(--text)]">Create Your SkinConsult Account</h1>
                  <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <Field icon={User} placeholder="Full Name" value={form.fullName} onChange={set("fullName")} />
                    <Field icon={Mail} type="email" placeholder="Email" value={form.email} onChange={set("email")} />
                    <Field icon={Lock} type="password" placeholder="Password" value={form.password} onChange={set("password")} />
                    <Field icon={Lock} type="password" placeholder="Confirm Password" value={form.confirm} onChange={set("confirm")} />

                    <label className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent-1)]"
                      />
                      I agree to the Terms and Privacy Policy.
                    </label>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <GradientButton type="submit" icon={ArrowRight} loading={loading} className="w-full">
                      Create Account
                    </GradientButton>
                  </form>

                  <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
                    Already have an account?{" "}
                    <Link to="/sign-in" className="font-semibold text-[var(--accent-1)]">
                      Sign in
                    </Link>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </section>
    </Layout>
  );
}

function Field({ icon: Icon, type = "text", placeholder, value, onChange }) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
      <input
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-11 pr-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-1)] focus:ring-2 focus:ring-[var(--accent-1)]/20"
      />
    </div>
  );
}
