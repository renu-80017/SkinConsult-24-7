import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const LINKS = [
  { to: "/about", label: "About" },
  { to: "/analyzer", label: "AI Analyzer" },
  { to: "/ai-doctor", label: "AI Doctor" },
  { to: "/quiz", label: "Skin Quiz" },
  { to: "/reports", label: "Reports" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/models", label: "AI Models" },
  { to: "/faq", label: "FAQ" },
  { to: "/privacy", label: "Privacy" },
  { to: "/disclaimer", label: "Disclaimer" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div>
            <Link to="/about" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--accent-1),var(--accent-2))] text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-base font-bold text-[var(--text)]">
                SkinConsult <span className="text-gradient">24/7</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-[var(--text-muted)]">
              Your AI Skin Health Companion.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-3">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm text-[var(--text-muted)] transition hover:text-[var(--accent-1)]"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-10 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-faint)]">
          <p>© 2026 SkinConsult 24/7. All rights reserved.</p>
          <p className="mt-2 max-w-3xl">
            SkinConsult 24/7 provides AI-assisted educational information and does not
            replace professional medical advice, diagnosis, or treatment.
          </p>
        </div>
      </div>
    </footer>
  );
}
