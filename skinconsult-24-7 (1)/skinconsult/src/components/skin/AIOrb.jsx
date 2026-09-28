import { motion } from "framer-motion";

export default function AIOrb({ size = 56, pulsing = true }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {pulsing && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, var(--accent-1) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div
        className="relative flex h-full w-full items-center justify-center rounded-full shadow-[var(--shadow-glow)]"
        style={{
          background:
            "conic-gradient(from 180deg, var(--accent-1), var(--accent-3), var(--accent-2), var(--accent-1))",
        }}
      >
        <div className="flex h-[72%] w-[72%] items-center justify-center rounded-full bg-[var(--surface)]">
          <motion.div
            className="h-[45%] w-[45%] rounded-full"
            style={{
              background: "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
            }}
            animate={{ scale: [1, 0.85, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}
