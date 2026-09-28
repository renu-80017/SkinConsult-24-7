import { useState, useRef, useEffect } from "react";
import { Palette, Sun, Moon, Monitor, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeSwitcher() {
  const { theme, setTheme, mode, setMode, THEMES } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:text-[var(--accent-1)]"
      >
        <Palette className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="glass absolute right-0 z-50 mt-2 w-64 rounded-2xl p-3 shadow-[var(--shadow-soft)]"
          >
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              Visual Theme
            </p>
            <div className="space-y-1">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-[var(--text)] transition hover:bg-[var(--accent-soft)]"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex -space-x-1">
                      {t.swatch.map((c, i) => (
                        <span
                          key={i}
                          className="h-3 w-3 rounded-full border border-white/50"
                          style={{ background: c }}
                        />
                      ))}
                    </span>
                    {t.name}
                  </span>
                  {theme === t.id && <Check className="h-4 w-4 text-[var(--accent-1)]" />}
                </button>
              ))}
            </div>
            <div className="mt-3 border-t border-[var(--border)] pt-3">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                Appearance
              </p>
              <div className="flex gap-1 px-1">
                {[
                  { id: "light", icon: Sun },
                  { id: "dark", icon: Moon },
                  { id: "system", icon: Monitor },
                ].map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setMode(id)}
                    className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs capitalize transition ${
                      mode === id
                        ? "bg-[var(--accent-soft)] text-[var(--accent-1)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--accent-soft)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {id}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
