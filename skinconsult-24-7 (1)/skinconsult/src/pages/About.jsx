import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ScanFace,
  MessageSquareHeart,
  ClipboardCheck,
  FileText,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Layout from "../components/ui/Layout";
import SectionHeading from "../components/ui/SectionHeading";
import GlassCard from "../components/ui/GlassCard";
import GradientButton from "../components/ui/GradientButton";
import SkinCellBackground from "../components/skin/SkinCellBackground";

const FEATURE_CARDS = [
  { icon: ScanFace, title: "AI Analysis", desc: "Upload a skin image and receive an AI-assisted, educational assessment." },
  { icon: MessageSquareHeart, title: "AI Conversation", desc: "Chat naturally with an AI skin-health assistant about everyday concerns." },
  { icon: ClipboardCheck, title: "Daily Skin Check", desc: "Answer 20 quick questions to get a deterministic skin-health habit score." },
  { icon: FileText, title: "Personalized Reports", desc: "Turn any analysis, chat, or quiz into a clean, shareable report." },
];

const PIPELINE = ["You", "Your Skin / Questions", "AI Processing", "Skin Insights", "Personalized Guidance", "Report"];

const WAYS = [
  { title: "AI Skin Analyzer", desc: "Upload an image and receive an AI-assisted demo analysis.", to: "/analyzer" },
  { title: "AI Doctor Chat", desc: "Ask questions about everyday skin-care concerns.", to: "/ai-doctor" },
  { title: "Daily Skin Health Check", desc: "Answer 20 questions and receive a skin-health habit score.", to: "/quiz" },
];

const BUILT_AROUND = ["Personalized", "Accessible", "Interactive", "Educational", "Trackable"];

export default function About() {
  const navigate = useNavigate();

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden px-4 pt-16 pb-24 sm:px-6 lg:px-8">
        <SkinCellBackground variant="cells" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--accent-2)]">
              <Sparkles className="h-3.5 w-3.5" /> Meet SkinConsult 24/7
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl">
              Understand Your Skin.
              <br />
              <span className="text-gradient">Powered by AI.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--text-muted)]">
              An AI-powered skin health companion designed to help you understand your
              skin, explore possible concerns, and build better everyday skin-care habits.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <GradientButton icon={ArrowRight} onClick={() => navigate("/analyzer")}>
                Analyze My Skin
              </GradientButton>
              <GradientButton variant="secondary" onClick={() => navigate("/ai-doctor")}>
                Talk to AI
              </GradientButton>
              <GradientButton variant="ghost" onClick={() => navigate("/quiz")}>
                Take Skin Check
              </GradientButton>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mx-auto flex h-[360px] w-full max-w-md items-center justify-center"
          >
            <div className="hero-image-glow" aria-hidden="true" />
            <img
              src="/skinconsult-animation.gif"
              alt="SkinConsult 24/7 AI skin scanning"
              className="skin-scan-animation"
            />
            {[
              { label: "Hydration", pos: "top-2 left-2" },
              { label: "Sun Exposure", pos: "bottom-6 right-0" },
              { label: "Skin Tone", pos: "top-10 right-2" },
            ].map((card) => (
              <motion.div
                key={card.label}
                className={`glass absolute ${card.pos} rounded-xl px-3 py-1.5 text-xs font-medium text-[var(--text)] shadow-[var(--shadow-soft)]`}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {card.label}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 1 */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Unified Experience"
          title="Skin Health, Reimagined."
          subtitle="SkinConsult 24/7 combines AI-assisted image analysis, conversational guidance, and everyday skin-health assessment into one unified experience."
        />
        <div className="mx-auto mt-14 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_CARDS.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <GlassCard className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-1)]">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-[var(--text)]">{f.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{f.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 2 — PIPELINE */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <SkinCellBackground variant="neural" />
        <SectionHeading eyebrow="The Process" title="How SkinConsult Works" />
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="hidden h-0.5 w-full bg-[var(--border)] sm:block" />
          <motion.div
            className="hidden h-0.5 bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2),var(--accent-3))] sm:block"
            initial={{ width: "0%" }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeInOut" }}
            style={{ marginTop: "-2px" }}
          />
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {PIPELINE.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center gap-2 text-center"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent-1),var(--accent-2))] text-sm font-bold text-white shadow-[var(--shadow-glow)]">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-[var(--text)]">{step}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — THREE WAYS */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Explore" title="Three Ways to Understand Your Skin" />
        <div className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-3">
          {WAYS.map((w, i) => (
            <motion.div
              key={w.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="group flex h-full cursor-pointer flex-col p-7" onClick={() => navigate(w.to)}>
                <h3 className="text-lg font-semibold text-[var(--text)]">{w.title}</h3>
                <p className="mt-3 flex-1 text-sm text-[var(--text-muted)]">{w.desc}</p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-1)]">
                  Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — BUILT AROUND YOU */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Designed For You" title="Built Around You" />
        <div className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-4">
          {BUILT_AROUND.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-5 py-2 text-sm font-semibold text-[var(--accent-2)]"
            >
              {word}
            </motion.span>
          ))}
        </div>
      </section>

      {/* SECTION 5 — RESPONSIBILITY */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <GlassCard className="flex flex-col gap-6 p-8 sm:flex-row sm:items-start">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-1)]">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-xl font-semibold text-[var(--text)]">AI With Responsibility</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                SkinConsult 24/7 provides AI-assisted information, educational insights,
                possible classifications, and lifestyle guidance. It does not provide a
                confirmed medical diagnosis, and it does not replace a licensed
                dermatologist or doctor.
              </p>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 pb-28 pt-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-[var(--border-strong)] p-12 text-center"
          style={{ background: "linear-gradient(135deg, var(--accent-soft), var(--surface))" }}
        >
          <SkinCellBackground variant="cells" />
          <h2 className="relative text-3xl font-bold text-[var(--text)] sm:text-4xl">
            Ready to Understand Your Skin?
          </h2>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <GradientButton icon={ArrowRight} onClick={() => navigate("/analyzer")}>
              Analyze My Skin
            </GradientButton>
            <GradientButton variant="secondary" onClick={() => navigate("/ai-doctor")}>
              Talk to AI
            </GradientButton>
            <GradientButton variant="ghost" onClick={() => navigate("/quiz")}>
              Take Skin Check
            </GradientButton>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
