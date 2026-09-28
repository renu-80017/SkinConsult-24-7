import { motion } from "framer-motion";

export default function GlassCard({
  children,
  className = "",
  hover = true,
  as: Component = motion.div,
  ...props
}) {
  return (
    <Component
      className={`glass rounded-3xl shadow-[var(--shadow-soft)] ${
        hover ? "transition-transform duration-300 hover:-translate-y-1" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
