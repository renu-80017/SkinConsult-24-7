import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import Layout from "../components/ui/Layout";
import GlassCard from "../components/ui/GlassCard";
import GradientButton from "../components/ui/GradientButton";
import SkinCellBackground from "../components/skin/SkinCellBackground";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSent(true);
  };

  return (
    <Layout>
      <section className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
        <SkinCellBackground variant="cells" />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
          <GlassCard className="p-8">
            <Link to="/sign-in" className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-muted)]">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
            {sent ? (
              <div className="flex flex-col items-center py-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-xl font-bold text-[var(--text)]">Check your email</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  If an account exists for {email}, a reset link is on its way (demo mode).
                </p>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-[var(--text)]">Reset your password</h1>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Enter your email and we'll send a reset link.
                </p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
                    <input
                      type="email"
                      required
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-11 pr-4 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-1)] focus:ring-2 focus:ring-[var(--accent-1)]/20"
                    />
                  </div>
                  <GradientButton type="submit" loading={loading} className="w-full">
                    Send Reset Link
                  </GradientButton>
                </form>
              </>
            )}
          </GlassCard>
        </motion.div>
      </section>
    </Layout>
  );
}
