import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, LogOut, Save } from "lucide-react";
import Layout from "../components/ui/Layout";
import GlassCard from "../components/ui/GlassCard";
import GradientButton from "../components/ui/GradientButton";
import ThemeSwitcher from "../components/ui/ThemeSwitcher";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, updateProfile, signOut } = useAuth();
  const { motion: motionPref, setMotion } = useTheme();
  const { push } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.full_name || "");

  if (!user) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-[var(--text-muted)]">You need to sign in to view your profile.</p>
          <GradientButton onClick={() => navigate("/sign-in")}>Sign In</GradientButton>
        </div>
      </Layout>
    );
  }

  const save = () => {
    updateProfile({ full_name: name });
    push("Profile updated", "success");
  };

  return (
    <Layout>
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent-1),var(--accent-2))] text-2xl font-bold text-white">
                {user.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-[var(--text)]">{user.full_name}</h1>
                <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-[var(--text-faint)] sm:justify-start">
                  <Calendar className="h-3 w-3" />
                  Joined {new Date(user.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
          <GlassCard className="p-8">
            <h2 className="text-lg font-semibold text-[var(--text)]">Edit Profile</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-11 pr-4 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-1)]"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
                <input
                  disabled
                  value={user.email}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-11 pr-4 text-sm text-[var(--text-faint)] outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <GradientButton icon={Save} onClick={save}>
                Save Changes
              </GradientButton>
              <GradientButton variant="ghost" icon={LogOut} onClick={() => { signOut(); navigate("/about"); }}>
                Sign Out
              </GradientButton>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
          <GlassCard className="p-8">
            <h2 className="text-lg font-semibold text-[var(--text)]">Appearance</h2>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--border)] p-4">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Theme & Mode</p>
                <p className="text-xs text-[var(--text-muted)]">Choose your visual theme and light/dark mode.</p>
              </div>
              <ThemeSwitcher />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--border)] p-4">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Animation</p>
                <p className="text-xs text-[var(--text-muted)]">Reduce motion for a calmer experience.</p>
              </div>
              <div className="flex gap-2">
                {["full", "reduced"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMotion(m)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
                      motionPref === m
                        ? "bg-[var(--accent-soft)] text-[var(--accent-1)]"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </section>
    </Layout>
  );
}
