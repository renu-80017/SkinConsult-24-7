import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Award, TrendingUp, TrendingDown, Lightbulb, FileText } from "lucide-react";
import Layout from "../components/ui/Layout";
import GlassCard from "../components/ui/GlassCard";
import GradientButton from "../components/ui/GradientButton";
import ProgressRing from "../components/ui/ProgressRing";
import SkinCellBackground from "../components/skin/SkinCellBackground";
import { buildReportFromQuiz, generateReport } from "../services/reportService";
import { useReports } from "../context/ReportsContext";
import { useToast } from "../context/ToastContext";

export default function QuizResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addReport } = useReports();
  const { push } = useToast();
  const [generating, setGenerating] = useState(false);
  const result = location.state?.result;
  const name = location.state?.name || "Guest User";

  useEffect(() => {
    if (!result) navigate("/quiz", { replace: true });
  }, [result, navigate]);

  if (!result) return null;

  const handleReport = async () => {
    setGenerating(true);
    const payload = buildReportFromQuiz({ patientName: name, quizResult: result });
    const report = await generateReport(payload, addReport);
    setGenerating(false);
    push("Report generated successfully", "success");
    navigate(`/reports/${report.id}`);
  };

  const handleCertificate = () => {
    navigate("/certificate", { state: { patientName: name, quizResult: result } });
  };

  return (
    <Layout>
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <SkinCellBackground variant="cells" />
        <div className="relative mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <ProgressRing value={result.overallScore} size={180} strokeWidth={12} sublabel="Overall Score" />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-5 py-2 text-lg font-bold text-[var(--accent-1)]"
            >
              <Award className="h-5 w-5" /> Grade {result.grade}
            </motion.div>
            <p className="mt-4 max-w-md text-sm text-[var(--text-faint)]">{result.disclaimer}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12 grid gap-6 sm:grid-cols-2"
          >
            <GlassCard className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-[var(--text)]">
                <TrendingUp className="h-4 w-4 text-emerald-500" /> Strengths
              </h3>
              <div className="space-y-3">
                {result.strengths.length ? (
                  result.strengths.map((s) => <CategoryBar key={s.category} {...s} color="emerald" />)
                ) : (
                  <p className="text-sm text-[var(--text-faint)]">No standout strengths yet — keep going!</p>
                )}
              </div>
            </GlassCard>
            <GlassCard className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-[var(--text)]">
                <TrendingDown className="h-4 w-4 text-amber-500" /> Areas to Improve
              </h3>
              <div className="space-y-3">
                {result.improvements.map((s) => (
                  <CategoryBar key={s.category} {...s} color="amber" />
                ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="mt-6">
            <GlassCard className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-[var(--text)]">
                <Lightbulb className="h-4 w-4 text-[var(--accent-1)]" /> Suggestions
              </h3>
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent-1)]" />
                    {s}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <GradientButton icon={FileText} loading={generating} onClick={handleReport}>
              Generate Report
            </GradientButton>
            <GradientButton variant="secondary" icon={Award} onClick={handleCertificate}>
              Generate Certificate
            </GradientButton>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}

function CategoryBar({ category, score, color }) {
  const barColor = color === "emerald" ? "#10b981" : "#f59e0b";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-[var(--text)]">{category}</span>
        <span className="text-[var(--text-faint)]">{score}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8 }}
          className="h-full rounded-full"
          style={{ background: barColor }}
        />
      </div>
    </div>
  );
}
