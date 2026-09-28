import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Layout from "../components/ui/Layout";
import GlassCard from "../components/ui/GlassCard";
import GradientButton from "../components/ui/GradientButton";
import SkinCellBackground from "../components/skin/SkinCellBackground";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn({ email, password });
      push("Welcome back!", "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="relative grid min-h-[calc(100vh-72px)] overflow-hidden lg:grid-cols-2">
        <div className="relative hidden items-center justify-center lg:flex">
          <SkinCellBackground variant="neural" />
          <div className="relative flex flex-col items-center gap-6">
            <img
              src="/skinconsult-animation.gif"
              alt="SkinConsult 24/7 AI skin scanning"
              className="skin-scan-animation skin-scan-animation--auth"
            />
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-16 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-8">
              <h1 className="text-2xl font-bold text-[var(--text)]">Welcome Back</h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Continue your skin-health journey.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} />
                <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} />

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-[var(--text-muted)]">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent-1)]"
                    />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="font-medium text-[var(--accent-1)]">
                    Forgot password?
                  </Link>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <GradientButton type="submit" icon={ArrowRight} loading={loading} className="w-full">
                  Sign In
                </GradientButton>
              </form>

              <GradientButton
                variant="secondary"
                className="mt-6 w-full"
                onClick={async () => {
                  setLoading(true);
                  await signIn({ email: "student@skinconsult.com", password: "student123" });
                  setLoading(false);
                  push("Signed in as demo student", "success");
                  navigate("/dashboard");
                }}
              >
                Try Demo Account
              </GradientButton>
              <p className="mt-2 text-center text-xs text-[var(--text-faint)]">
                Demo login: student@skinconsult.com / student123
              </p>

              <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
                Don't have an account?{" "}
                <Link to="/sign-up" className="font-semibold text-[var(--accent-1)]">
                  Create one
                </Link>
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}

function Field({ icon: Icon, type, placeholder, value, onChange }) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
      <input
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-11 pr-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-1)] focus:ring-2 focus:ring-[var(--accent-1)]/20"
      />
    </div>
  );
}
