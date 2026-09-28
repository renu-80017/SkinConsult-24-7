import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Eye, Download, Trash2, Inbox } from "lucide-react";
import Layout from "../components/ui/Layout";
import SectionHeading from "../components/ui/SectionHeading";
import GlassCard from "../components/ui/GlassCard";
import { useReports } from "../context/ReportsContext";
import { useToast } from "../context/ToastContext";
import {
  fetchConsultationReports,
  downloadConsultationReportPdf,
  deleteConsultationReport,
} from "../services/api/consultationApi";
import { downloadBlob } from "../utils/downloadBlob";

function base64ToBlob(base64, contentType = "application/pdf") {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: contentType });
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "analysis", label: "Analysis" },
  { id: "quiz", label: "Quiz" },
  { id: "conversation", label: "Chat" },
];

const TYPE_LABEL = { analysis: "AI Analysis", quiz: "Skin Health Quiz", conversation: "AI Conversation" };

export default function Reports() {
  const { reports, deleteReport } = useReports();
  const { push } = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [remoteReports, setRemoteReports] = useState([]);
  const [pdfDownloadingId, setPdfDownloadingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchConsultationReports()
      .then((list) => {
        if (cancelled) return;
        setRemoteReports(
          list.map((r) => ({
            id: r.reportId,
            source: "backend",
            type: "conversation",
            version: 1,
            createdAt: r.createdAt,
            patient: { name: r.patientName },
            mainConcern: r.primaryConcern,
            hasPdf: r.hasPdf,
          }))
        );
      })
      .catch(() => {
        // Backend not connected yet — the page still works with local reports.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allReports = useMemo(() => [...remoteReports, ...reports], [remoteReports, reports]);

  const filtered = useMemo(() => {
    return allReports.filter((r) => {
      const matchesFilter = filter === "all" || r.type === filter;
      const matchesQuery =
        !query || r.patient?.name?.toLowerCase().includes(query.toLowerCase()) || r.id.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [allReports, filter, query]);

  const handleDownloadPdf = async (r) => {
    if (r.source !== "backend") {
      if (r.pdfBase64) {
        try {
          downloadBlob(base64ToBlob(r.pdfBase64), "skinconsult_report.pdf");
        } catch (err) {
          push("Couldn't download the PDF right now.", "error");
        }
      } else {
        push("PDF export requires backend integration (demo).", "info");
      }
      return;
    }
    setPdfDownloadingId(r.id);
    try {
      const blob = await downloadConsultationReportPdf(r.id);
      downloadBlob(blob, `SkinConsult-Consultation-${r.id}.pdf`);
    } catch (err) {
      push(err.message || "Couldn't download the PDF right now.", "error");
    } finally {
      setPdfDownloadingId(null);
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm("Permanently delete this report? This cannot be undone.")) return;
    if (r.source === "backend") {
      try {
        await deleteConsultationReport(r.id);
        setRemoteReports((prev) => prev.filter((x) => x.id !== r.id));
        push("Report deleted", "info");
      } catch (err) {
        push(err.message || "Couldn't delete the report right now.", "error");
      }
    } else {
      deleteReport(r.id);
      push("Report deleted", "info");
    }
  };

  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Your History" title="Reports" align="left" />

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  filter === f.id
                    ? "bg-[var(--accent-soft)] text-[var(--accent-1)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--accent-soft)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full rounded-full border border-[var(--border)] bg-[var(--surface)] py-2 pl-10 pr-4 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-1)]"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <Inbox className="h-10 w-10 text-[var(--text-faint)]" />
            <p className="text-[var(--text-muted)]">No reports found yet.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="flex h-full flex-col p-6">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-1)]">
                      <FileText className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-2)]">
                      v{r.version}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-[var(--text)]">{TYPE_LABEL[r.type] || "Report"}</h3>
                  <p className="text-xs text-[var(--text-faint)]">{r.id}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {new Date(r.createdAt).toLocaleDateString()} · {r.patient?.name || "Guest User"}
                  </p>
                  {r.aiAssessment && (
                    <p className="mt-2 text-sm font-medium text-[var(--text)]">
                      {r.aiAssessment.prediction || "No Clear Match"} · {r.aiAssessment.confidence}%
                    </p>
                  )}
                  {r.quizResult && (
                    <p className="mt-2 text-sm font-medium text-[var(--text)]">
                      Score {r.quizResult.overallScore}/100 · Grade {r.quizResult.grade}
                    </p>
                  )}
                  {r.mainConcern && <p className="mt-2 text-sm font-medium text-[var(--text)]">{r.mainConcern}</p>}
                  <div className="mt-auto flex gap-2 pt-4">
                    <button
                      onClick={() => navigate(`/reports/${r.id}`)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent-1)]"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(r)}
                      disabled={pdfDownloadingId === r.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent-1)] disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      className="flex items-center justify-center rounded-xl border border-[var(--border)] px-3 py-2 text-red-500 hover:border-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
