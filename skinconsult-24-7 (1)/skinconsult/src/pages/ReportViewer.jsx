import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Printer,
  Share2,
  AlertTriangle,
  Award,
  MessageSquare,
  RotateCcw,
  WifiOff,
} from "lucide-react";
import Layout from "../components/ui/Layout";
import GlassCard from "../components/ui/GlassCard";
import GradientButton from "../components/ui/GradientButton";
import ProgressRing from "../components/ui/ProgressRing";
import ConsultationReportView from "../components/aidoctor/ConsultationReportView";
import { useReports } from "../context/ReportsContext";
import { useToast } from "../context/ToastContext";
import { fetchConsultationReport, downloadConsultationReportPdf } from "../services/api/consultationApi";
import { downloadBlob } from "../utils/downloadBlob";
import { MODEL_LABELS } from "../utils/modelLabels";

function base64ToBlob(base64, contentType = "application/pdf") {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: contentType });
}

const TYPE_LABEL = {
  analysis: "AI Skin Analysis Report",
  quiz: "Daily Skin Health Report",
  conversation: "AI Conversation Report",
};

export default function ReportViewer() {
  const { id } = useParams();
  const { getReport } = useReports();
  const { push } = useToast();
  const navigate = useNavigate();
  const localReport = getReport(id);

  const [remoteReport, setRemoteReport] = useState(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (localReport) return;
    let cancelled = false;
    setLoadingRemote(true);
    setRemoteError(null);
    fetchConsultationReport(id)
      .then((report) => {
        if (!cancelled) setRemoteReport(report);
      })
      .catch((err) => {
        if (!cancelled) setRemoteError(err.message || "This report could not be found.");
      })
      .finally(() => {
        if (!cancelled) setLoadingRemote(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!remoteReport) return;
    setDownloadingPdf(true);
    try {
      const blob = await downloadConsultationReportPdf(remoteReport.reportId);
      downloadBlob(blob, `SkinConsult-Consultation-${remoteReport.reportId}.pdf`);
    } catch (err) {
      push(err.message || "Couldn't download the PDF right now.", "error");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!localReport && loadingRemote) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-[var(--text-muted)]">Loading report…</p>
        </div>
      </Layout>
    );
  }

  if (!localReport && remoteReport) {
    return (
      <Layout>
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <button
            onClick={() => navigate("/reports")}
            className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Reports
          </button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ConsultationReportView report={remoteReport} />
          </motion.div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <GradientButton icon={Download} loading={downloadingPdf} onClick={handleDownloadPdf}>
              Download PDF
            </GradientButton>
            <GradientButton variant="secondary" icon={Printer} onClick={() => window.print()}>
              Print
            </GradientButton>
            <GradientButton variant="ghost" icon={MessageSquare} onClick={() => navigate("/ai-doctor")}>
              Continue Chat
            </GradientButton>
            <GradientButton variant="ghost" icon={RotateCcw} onClick={() => navigate("/ai-doctor")}>
              Start New Consultation
            </GradientButton>
          </div>
        </section>
      </Layout>
    );
  }

  if (!localReport && remoteError) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <WifiOff className="h-8 w-8 text-[var(--text-faint)]" />
          <p className="text-[var(--text-muted)]">{remoteError}</p>
          <GradientButton onClick={() => navigate("/reports")}>Back to Reports</GradientButton>
        </div>
      </Layout>
    );
  }

  const report = localReport;

  if (!report) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-[var(--text-muted)]">Report not found.</p>
          <GradientButton onClick={() => navigate("/reports")}>Back to Reports</GradientButton>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <button
          onClick={() => navigate("/reports")}
          className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="overflow-hidden p-0">
            {/* Header */}
            <div className="border-b border-[var(--border)] bg-[var(--accent-soft)] px-8 py-8 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent-2)]">SkinConsult 24/7</p>
              <h1 className="mt-2 text-xl font-bold text-[var(--text)]">
                {TYPE_LABEL[report.type] || "AI Skin Health Report"}
              </h1>
              <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-[var(--text-faint)]">
                <span>Name: {report.patient?.name || "Not provided"}</span>
                <span>Report ID: {report.id}</span>
                <span>Version: {report.version}</span>
                <span>Date: {new Date(report.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-8 px-8 py-8">
              {/* Image */}
              {report.image?.imageUrl && (
                <ReportSection title="Skin Image">
                  <img src={report.image.imageUrl} alt="Skin" className="h-40 w-40 rounded-2xl object-cover" />
                  <p className="mt-2 text-xs text-[var(--text-faint)]">
                    Quality: {report.image.qualityStatus} · Image provided by user
                  </p>
                </ReportSection>
              )}

              {/* AI Assessment */}
              {report.aiAssessment && (
                <ReportSection title="AI Assessment">
                  <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                    <ProgressRing value={report.aiAssessment.confidence} sublabel="Confidence" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                        AI-Estimated Possible Match
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-[var(--text)]">
                        {report.aiAssessment.confidence < 60 ? "No Clear Match" : report.aiAssessment.prediction}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {report.aiAssessment.severity ? `Severity: ${report.aiAssessment.severity} · ` : ""}Model: {MODEL_LABELS[report.aiAssessment.model] ?? report.aiAssessment.model}
                      </p>
                    </div>
                  </div>
                </ReportSection>
              )}

              {/* Quiz result */}
              {report.quizResult && (
                <ReportSection title="Skin Health Score">
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <ProgressRing value={report.quizResult.overallScore} sublabel="Overall Score" />
                    <div>
                      <p className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-1.5 font-bold text-[var(--accent-1)]">
                        <Award className="h-4 w-4" /> Grade {report.quizResult.grade}
                      </p>
                      <p className="mt-3 text-xs text-[var(--text-faint)]">{report.quizResult.disclaimer}</p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {report.quizResult.categoryScores.map((c) => (
                      <div key={c.category} className="rounded-xl border border-[var(--border)] p-3">
                        <p className="text-xs text-[var(--text-faint)]">{c.category}</p>
                        <p className="text-lg font-bold text-[var(--text)]">{c.score}%</p>
                      </div>
                    ))}
                  </div>
                </ReportSection>
              )}

              {/* Conversation summary (legacy locally-generated chat reports) */}
              {report.conversationSummary && (
                <ReportSection title="Conversation Summary">
                  <ul className="space-y-2">
                    {report.conversationSummary.map((line, i) => (
                      <li key={i} className="rounded-xl bg-[var(--accent-soft)] px-4 py-2 text-sm text-[var(--text)]">
                        {line}
                      </li>
                    ))}
                  </ul>
                </ReportSection>
              )}

              {/* Recommendations */}
              {report.recommendations && (
                <ReportSection title="Recommendations">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {report.recommendations.homeCare && (
                      <RecCard title="Home Care" items={report.recommendations.homeCare} />
                    )}
                    {report.recommendations.generalTreatmentGuidance && (
                      <RecCard title="General Treatment Guidance" items={report.recommendations.generalTreatmentGuidance} />
                    )}
                    {report.recommendations.habitsToChange && (
                      <RecCard title="Habits to Consider Changing" items={report.recommendations.habitsToChange} />
                    )}
                  </div>
                </ReportSection>
              )}

              {/* Safety */}
              {report.recommendations?.whenToSeeDoctor && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">When to Seek Medical Care</p>
                    <p className="mt-1 text-xs leading-relaxed">{report.recommendations.whenToSeeDoctor}</p>
                  </div>
                </div>
              )}

              {/* Limitations */}
              <p className="text-center text-xs leading-relaxed text-[var(--text-faint)]">
                This report is generated using an AI-based assessment system and is intended for
                informational purposes only. It does not provide a medical diagnosis and should not
                replace evaluation by a qualified healthcare professional. AI performance may vary
                depending on image quality, lighting, and the characteristics of the condition.
              </p>
            </div>

            <div className="border-t border-[var(--border)] px-8 py-4 text-center text-[10px] text-[var(--text-faint)]">
              SkinConsult 24/7 · AI Skin Health Companion · Informational AI assessment — not a medical diagnosis.
            </div>
          </GlassCard>
        </motion.div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <GradientButton
            icon={Download}
            onClick={() => {
              if (report.pdfBase64) {
                downloadBlob(base64ToBlob(report.pdfBase64), "skinconsult_report.pdf");
              } else {
                push("PDF export requires backend integration (demo).", "info");
              }
            }}
          >
            Download PDF
          </GradientButton>
          <GradientButton variant="secondary" icon={Printer} onClick={() => window.print()}>
            Print
          </GradientButton>
          <GradientButton
            variant="ghost"
            icon={Share2}
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              push("Link copied to clipboard", "success");
            }}
          >
            Share
          </GradientButton>
        </div>
      </section>
    </Layout>
  );
}

function ReportSection({ title, children }) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--accent-2)]">{title}</h2>
      {children}
    </div>
  );
}

function RecCard({ title, items }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] p-4">
      <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
      <ul className="mt-2 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-xs text-[var(--text-muted)]">
            • {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
