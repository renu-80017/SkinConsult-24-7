import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, Bell, User } from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import GradientButton from "./GradientButton";
import { useAuth } from "../../context/AuthContext";

const LINKS = [
  { to: "/about", label: "About" },
  { to: "/analyzer", label: "AI Analyzer" },
  { to: "/ai-doctor", label: "AI Doctor" },
  { to: "/quiz", label: "Skin Quiz" },
  { to: "/reports", label: "Reports" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/models", label: "AI Models" },
  { to: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "glass shadow-[var(--shadow-soft)]" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/about" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--accent-1),var(--accent-2))] text-white shadow-[var(--shadow-glow)]">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-[var(--text)]">
              SkinConsult <span className="text-gradient">24/7</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[var(--accent-1)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 -z-10 rounded-full bg-[var(--accent-soft)]"
                        transition={{ type: "spring", duration: 0.5 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:text-[var(--accent-1)] sm:flex"
            >
              <Bell className="h-4 w-4" />
            </button>
            <ThemeSwitcher />
            {user ? (
              <button
                onClick={() => navigate("/profile")}
                className="hidden h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--accent-soft)] text-[var(--accent-1)] sm:flex"
                aria-label="Profile"
              >
                <User className="h-4 w-4" />
              </button>
            ) : (
              <GradientButton
                variant="secondary"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => navigate("/sign-in")}
              >
                Sign In
              </GradientButton>
            )}
            <GradientButton size="sm" className="hidden md:inline-flex" onClick={() => navigate("/analyzer")}>
              Analyze My Skin
            </GradientButton>
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text)] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--bg)]/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <span className="text-lg font-bold text-[var(--text)]">
                SkinConsult <span className="text-gradient">24/7</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-6">
              {LINKS.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <NavLink
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-2xl px-4 py-3 text-lg font-medium ${
                        isActive
                          ? "bg-[var(--accent-soft)] text-[var(--accent-1)]"
                          : "text-[var(--text-muted)]"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-3 px-6">
              <GradientButton
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/analyzer");
                }}
              >
                Analyze My Skin
              </GradientButton>
              <GradientButton
                variant="secondary"
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/sign-in");
                }}
              >
                Sign In
              </GradientButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
