import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ScanFace, MessageSquareHeart, ClipboardCheck, FileText, Award, Activity } from "lucide-react";
import Layout from "../components/ui/Layout";
import GlassCard from "../components/ui/GlassCard";
import GradientButton from "../components/ui/GradientButton";
import ProgressRing from "../components/ui/ProgressRing";
import SkinCellBackground from "../components/skin/SkinCellBackground";
import { useAuth } from "../context/AuthContext";
import { useReports } from "../context/ReportsContext";

export default function Dashboard() {
  const { user } = useAuth();
  const { reports, certificates } = useReports();
  const navigate = useNavigate();

  const quizReports = reports.filter((r) => r.type === "quiz");
  const latestQuiz = quizReports[0];
  const latestAnalysis = reports.find((r) => r.type === "analysis");

  const scoreHistory = [...quizReports]
    .reverse()
    .map((r, i) => ({ name: `#${i + 1}`, score: r.quizResult.overallScore }));

  const categoryData = latestQuiz?.quizResult?.categoryScores || [];

  return (
    <Layout>
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <SkinCellBackground variant="neural" />
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-2xl font-bold text-[var(--text)] sm:text-3xl"
        >
          Welcome back{user ? `, ${(user?.full_name || "Guest").split(" ")[0]}` : ""}
        </motion.h1>

        <div className="relative mt-8 grid gap-6 lg:grid-cols-3">
          {/* Hero score card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
            <GlassCard className="flex h-full flex-col items-center justify-center p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)]">
                Latest Skin Health Score
              </p>
              {latestQuiz ? (
                <>
                  <ProgressRing value={latestQuiz.quizResult.overallScore} size={160} className="mt-4" />
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-1.5 font-bold text-[var(--accent-1)]">
                    <Award className="h-4 w-4" /> Grade {latestQuiz.quizResult.grade}
                  </p>
                </>
              ) : (
                <div className="mt-6 flex flex-col items-center gap-3">
                  <p className="text-sm text-[var(--text-muted)]">No quiz completed yet.</p>
                  <GradientButton size="sm" onClick={() => navigate("/quiz")}>
                    Take Skin Check
                  </GradientButton>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Quick stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            {[
              { label: "Latest Analysis", value: latestAnalysis ? latestAnalysis.aiAssessment?.prediction || "No Clear Match" : "—", icon: ScanFace, to: "/analyzer" },
              { label: "Latest Quiz", value: latestQuiz ? `${latestQuiz.quizResult.overallScore}/100` : "—", icon: ClipboardCheck, to: "/quiz" },
              { label: "Reports", value: reports.length, icon: FileText, to: "/reports" },
              { label: "Certificates", value: certificates.length, icon: Award, to: "/certificate" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard className="cursor-pointer p-5" onClick={() => navigate(stat.to)}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-1)]">
                    <stat.icon className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-xs text-[var(--text-faint)]">{stat.label}</p>
                  <p className="mt-0.5 truncate text-lg font-bold text-[var(--text)]">{stat.value}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="relative mt-8 grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-[var(--text)]">
              <Activity className="h-4 w-4 text-[var(--accent-1)]" /> Skin Score History
            </h3>
            {scoreHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={scoreHistory}>
                  <XAxis dataKey="name" stroke="var(--text-faint)" fontSize={11} />
                  <YAxis stroke="var(--text-faint)" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="score" stroke="var(--accent-1)" strokeWidth={2.5} dot={{ fill: "var(--accent-2)" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Complete a skin check to see your history" />
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="mb-4 font-semibold text-[var(--text)]">Category Progress</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData}>
                  <XAxis dataKey="category" stroke="var(--text-faint)" fontSize={9} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis stroke="var(--text-faint)" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="var(--accent-2)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Complete a skin check to see category breakdowns" />
            )}
          </GlassCard>
        </div>

        {/* Recent activity + quick actions */}
        <div className="relative mt-8 grid gap-6 lg:grid-cols-3">
          <GlassCard className="p-6 lg:col-span-2">
            <h3 className="mb-4 font-semibold text-[var(--text)]">Recent Activity</h3>
            {reports.length === 0 ? (
              <p className="text-sm text-[var(--text-faint)]">No activity yet. Start with an analysis or quiz.</p>
            ) : (
              <ul className="space-y-3">
                {reports.slice(0, 5).map((r) => (
                  <li
                    key={r.id}
                    onClick={() => navigate(`/reports/${r.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 text-sm hover:border-[var(--accent-1)]"
                  >
                    <span className="text-[var(--text)]">{r.type === "analysis" ? "AI Analysis" : r.type === "quiz" ? "Skin Health Quiz" : "AI Conversation"} report</span>
                    <span className="text-xs text-[var(--text-faint)]">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard className="flex flex-col gap-3 p-6">
            <h3 className="font-semibold text-[var(--text)]">Quick Actions</h3>
            <GradientButton icon={ScanFace} onClick={() => navigate("/analyzer")}>
              Analyze Skin
            </GradientButton>
            <GradientButton variant="secondary" icon={MessageSquareHeart} onClick={() => navigate("/ai-doctor")}>
              Talk to AI
            </GradientButton>
            <GradientButton variant="secondary" icon={ClipboardCheck} onClick={() => navigate("/quiz")}>
              Take Skin Check
            </GradientButton>
            <GradientButton variant="ghost" icon={FileText} onClick={() => navigate("/reports")}>
              View Reports
            </GradientButton>
          </GlassCard>
        </div>
      </section>
    </Layout>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-center text-sm text-[var(--text-faint)]">
      {label}
    </div>
  );
}
