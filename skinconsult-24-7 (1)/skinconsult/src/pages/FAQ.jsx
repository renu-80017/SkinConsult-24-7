import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Layout from "../components/ui/Layout";
import SectionHeading from "../components/ui/SectionHeading";
import GlassCard from "../components/ui/GlassCard";
import SkinCellBackground from "../components/skin/SkinCellBackground";

const FAQS = [
  {
    q: "Is SkinConsult 24/7 a replacement for a dermatologist?",
    a: "No. SkinConsult 24/7 provides AI-assisted educational information and does not replace professional medical advice, diagnosis, or treatment. Always consult a licensed dermatologist for medical concerns.",
  },
  {
    q: "Is the AI Skin Analyzer using a real trained model?",
    a: "Currently the analyzer returns demo/mock predictions clearly labeled as such. The architecture is prepared to connect to real trained models (DermNet, HAM10000, Burn Classification) in the future.",
  },
  {
    q: "How is my Daily Skin Health Check score calculated?",
    a: "Your score is calculated with a fully deterministic scoring engine — no AI or LLM is involved in the numeric calculation. Each answer maps to a fixed point value across defined categories.",
  },
  {
    q: "Can I generate a report from my chat with the AI assistant?",
    a: "Yes. At the end of a conversation, you can generate a report using only the information actually discussed. Nothing is invented or assumed.",
  },
  {
    q: "What does a low-confidence 'No Clear Match' result mean?",
    a: "It means the AI model could not identify a sufficiently confident match from the provided image. We never force a diagnosis when confidence is too low.",
  },
  {
    q: "Is my data stored securely?",
    a: "In this prototype, data is stored locally in your browser for demo purposes. See the Privacy page for full details on current and planned data handling.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <Layout>
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <SkinCellBackground variant="cells" />
        <SectionHeading eyebrow="Support" title="Frequently Asked Questions" />
        <div className="relative mx-auto mt-12 max-w-2xl space-y-3">
          {FAQS.map((f, i) => (
            <GlassCard key={f.q} className="overflow-hidden p-0">
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-medium text-[var(--text)]">{f.q}</span>
                <motion.span animate={{ rotate: open === i ? 180 : 0 }}>
                  <ChevronDown className="h-4 w-4 text-[var(--text-faint)]" />
                </motion.span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm leading-relaxed text-[var(--text-muted)]">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          ))}
        </div>
      </section>
    </Layout>
  );
}
