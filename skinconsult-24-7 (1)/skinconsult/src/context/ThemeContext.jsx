import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

export const THEMES = [
  { id: "frosted-medical", name: "Frosted Medical", swatch: ["#38bdf8", "#06b6d4", "#ffffff"] },
  { id: "neural-violet", name: "Neural Violet", swatch: ["#38bdf8", "#8b5cf6", "#ffffff"] },
  { id: "arctic-ai", name: "Arctic AI", swatch: ["#38bdf8", "#94a3b8", "#ffffff"] },
  { id: "cyber-clinic", name: "Cyber Clinic", swatch: ["#0f172a", "#06b6d4", "#8b5cf6"] },
  { id: "aurora-health", name: "Aurora Health", swatch: ["#3b82f6", "#06b6d4", "#8b5cf6"] },
];

const DEFAULT_THEME = "frosted-medical";

function getSystemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("sc-theme") || DEFAULT_THEME
  );
  const [mode, setMode] = useState(
    () => localStorage.getItem("sc-mode") || "system"
  );
  const [motion, setMotion] = useState(
    () => localStorage.getItem("sc-motion") || "full"
  );

  const isDark = useMemo(() => {
    if (mode === "system") return getSystemPrefersDark();
    return mode === "dark";
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sc-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("sc-mode", mode);
  }, [mode, isDark]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", motion === "reduced");
    localStorage.setItem("sc-motion", motion);
  }, [motion]);

  useEffect(() => {
    if (mode !== "system" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setMode("system");
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [mode]);

  const value = {
    theme,
    setTheme,
    mode,
    setMode,
    isDark,
    motion,
    setMotion,
    reduced: motion === "reduced",
    THEMES,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
