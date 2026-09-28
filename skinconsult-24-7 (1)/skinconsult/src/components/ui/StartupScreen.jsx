import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AIOrb from "../skin/AIOrb";

export default function StartupScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("loading"); // loading -> welcome -> done

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + Math.random() * 14 + 4);
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setPhase("welcome"), 300);
        }
        return next;
      });
    }, 180);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase === "welcome") {
      const t = setTimeout(() => {
        setPhase("done");
        onDone?.();
      }, 1100);
      return () => clearTimeout(t);
    }
  }, [phase, onDone]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[var(--bg)]"
        >
          <div
            className="absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 30%, var(--accent-soft), transparent 70%)",
            }}
          />
          <motion.div
            className="absolute h-[420px] w-[420px] rounded-full"
            style={{ background: "radial-gradient(circle, var(--accent-1) 0%, transparent 70%)", opacity: 0.15 }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <AnimatePresence mode="wait">
            {phase === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative z-10 flex flex-col items-center gap-6"
              >
                <AIOrb size={96} />
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
                  SkinConsult <span className="text-gradient">24/7</span>
                </h1>
                <p className="text-sm font-medium tracking-wide text-[var(--text-muted)]">
                  Initializing Skin Intelligence...
                </p>
                <div className="h-1.5 w-64 overflow-hidden rounded-full bg-[var(--border)]">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-[var(--text-faint)]">
                  {Math.floor(progress)}%
                </span>
              </motion.div>
            )}
            {phase === "welcome" && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative z-10 flex flex-col items-center gap-3"
              >
                <h1 className="text-3xl font-bold text-[var(--text)]">
                  Welcome to <span className="text-gradient">SkinConsult 24/7</span>
                </h1>
                <p className="text-sm text-[var(--text-muted)]">Your AI Skin Health Companion</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
