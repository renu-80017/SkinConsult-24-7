import { motion } from "framer-motion";

export default function GradientButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight = true,
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "text-white shadow-[0_8px_30px_-8px_rgba(56,189,248,0.6)] bg-[linear-gradient(120deg,var(--accent-1),var(--accent-2))]",
    secondary:
      "border-gradient text-[var(--text)] hover:shadow-[var(--shadow-soft)]",
    ghost: "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent-soft)]",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? {} : { scale: 1.03 }}
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {variant === "primary" && (
        <span className="pointer-events-none absolute inset-0 -z-0">
          <span className="absolute top-0 left-0 h-full w-1/3 -skew-x-12 bg-white/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-shine" />
        </span>
      )}
      {loading ? (
        <span className="relative z-10 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        Icon && !iconRight && <Icon className="relative z-10 h-4 w-4" />
      )}
      <span className="relative z-10">{children}</span>
      {!loading && Icon && iconRight && (
        <Icon className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </motion.button>
  );
}
