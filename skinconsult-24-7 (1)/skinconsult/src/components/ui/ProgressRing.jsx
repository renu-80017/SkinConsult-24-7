import { useEffect, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

export default function ProgressRing({
  value = 0,
  size = 140,
  strokeWidth = 10,
  label,
  sublabel,
  colorFrom = "var(--accent-1)",
  colorTo = "var(--accent-2)",
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [display, setDisplay] = useState(0);
  const count = useMotionValue(0);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [value, count]);

  const offset = circumference - (display / 100) * circumference;
  const gradId = `ring-grad-${colorFrom}-${colorTo}`.replace(/[^a-zA-Z0-9-]/g, "");

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorFrom} />
            <stop offset="100%" stopColor={colorTo} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <motion.span className="text-2xl font-bold text-[var(--text)]">{display}{label !== false ? "%" : ""}</motion.span>
        {sublabel && <span className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">{sublabel}</span>}
      </div>
    </div>
  );
}
