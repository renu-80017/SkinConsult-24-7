import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, ArrowLeft, ArrowRight, User } from "lucide-react";
import Layout from "../components/ui/Layout";
import GlassCard from "../components/ui/GlassCard";
import GradientButton from "../components/ui/GradientButton";
import SkinCellBackground from "../components/skin/SkinCellBackground";
import { QUIZ_QUESTIONS } from "../data/quizQuestions";
import { scoreQuiz } from "../utils/quizScoring";

export default function Quiz() {
  const [stage, setStage] = useState("intro"); // intro | quiz
  const [name, setName] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();

  const question = QUIZ_QUESTIONS[index];
  const selected = answers[question?.id];
  const progress = ((index + 1) / QUIZ_QUESTIONS.length) * 100;

  const selectOption = (optionIndex) => {
    setAnswers((a) => ({ ...a, [question.id]: optionIndex }));
  };

  const next = () => {
    if (index < QUIZ_QUESTIONS.length - 1) {
      setIndex((i) => i + 1);
    } else {
      const result = scoreQuiz(answers);
      navigate("/quiz/result", { state: { result, name } });
    }
  };

  const prev = () => setIndex((i) => Math.max(0, i - 1));

  return (
    <Layout>
      <section className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
        <SkinCellBackground variant="cells" />
        <AnimatePresence mode="wait">
          {stage === "intro" ? (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full max-w-md">
              <GlassCard className="p-8 text-center">
                <h1 className="text-2xl font-bold text-[var(--text)]">Daily Skin Health Check</h1>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Answer 20 quick questions to get your deterministic skin-health habit score.
                </p>
                <div className="relative mt-6">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-11 pr-4 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-1)]"
                  />
                </div>
                <GradientButton
                  className="mt-6 w-full"
                  disabled={!name.trim()}
                  icon={ArrowRight}
                  onClick={() => setStage("quiz")}
                >
                  Begin Check
                </GradientButton>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full max-w-xl">
              <div className="mb-6 flex items-center justify-between text-sm text-[var(--text-muted)]">
                <span>
                  {String(index + 1).padStart(2, "0")} / {QUIZ_QUESTIONS.length}
                </span>
                <span className="font-medium text-[var(--accent-1)]">{question.category}</span>
              </div>
              <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))]"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                >
                  <GlassCard className="p-8">
                    <h2 className="text-xl font-semibold text-[var(--text)]">{question.question}</h2>
                    <div className="mt-6 space-y-3">
                      {question.options.map((opt, i) => (
                        <button
                          key={opt.label}
                          onClick={() => selectOption(i)}
                          className={`flex w-full items-center justify-between rounded-2xl border px-5 py-3.5 text-left text-sm font-medium transition-all ${
                            selected === i
                              ? "border-[var(--accent-1)] bg-[var(--accent-soft)] text-[var(--accent-1)] scale-[1.01]"
                              : "border-[var(--border)] text-[var(--text)] hover:border-[var(--accent-1)]/50"
                          }`}
                        >
                          <span>
                            {String.fromCharCode(65 + i)}) {opt.label}
                          </span>
                          {selected === i && (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                              <Check className="h-4 w-4" />
                            </motion.span>
                          )}
                        </button>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 flex items-center justify-between">
                <GradientButton variant="ghost" icon={ArrowLeft} iconRight={false} disabled={index === 0} onClick={prev}>
                  Previous
                </GradientButton>
                <GradientButton icon={ArrowRight} disabled={selected === undefined} onClick={next}>
                  {index === QUIZ_QUESTIONS.length - 1 ? "See My Skin Health Score" : "Next Question"}
                </GradientButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </Layout>
  );
}
