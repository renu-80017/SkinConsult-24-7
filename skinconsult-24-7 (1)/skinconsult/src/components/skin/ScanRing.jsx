import { motion } from "framer-motion";

export default function ScanRing({ size = 220 }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-dashed"
        style={{ borderColor: "var(--accent-1)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border"
        style={{ borderColor: "var(--accent-2)" }}
        animate={{ rotate: -360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
      >
        <motion.div
          className="h-full w-1 origin-bottom"
          style={{
            background: "linear-gradient(to top, var(--accent-1), transparent)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
      <div
        className="absolute inset-10 rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--accent-soft) 0%, transparent 75%)",
        }}
      />
    </div>
  );
}
