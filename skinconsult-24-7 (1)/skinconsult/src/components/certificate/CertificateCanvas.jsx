import { useRef, useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { toCanvas } from "html-to-image";
import jsPDF from "jspdf";
import {
  Award,
  ShieldCheck,
  Share2,
  Download,
  FileDown,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import GradientButton from "../ui/GradientButton";
import { useToast } from "../../context/ToastContext";

/**
 * CertificateCanvas
 *
 * A premium AI HealthTech certificate for SkinConsult 24/7.
 * Supports two modes:
 *  - "assessment": AI skin analysis result (prediction / confidence / severity)
 *  - "quiz":       Daily Skin Health Check completion (score / grade)
 *
 * Backwards-compatible props (playerName, totalScore, averageAccuracy,
 * completionDate) are also accepted and mapped internally, so older
 * call sites that used the previous "Science Laboratory Academy"
 * component API keep working without changes.
 */
export default function CertificateCanvas({
  mode: modeProp,
  certificateId: certificateIdProp,
  // SkinConsult-native props
  patientName: patientNameProp,
  prediction,
  confidence: confidenceProp,
  severity,
  completionDate: completionDateProp,
  imageDataUrl,
  quizScore,
  quizGrade,
  autoDownload, // "png" | "pdf" | undefined — triggers that download once, on mount
  // Legacy/back-compat props
  playerName,
  totalScore,
  averageAccuracy,
  editable = true,
  className = "",
}) {
  const patientNameInitial = patientNameProp || playerName || "";
  const [customName, setCustomName] = useState(patientNameInitial);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const certRef = useRef(null);
  const { push } = useToast();

  const mode = modeProp || (quizScore !== undefined || totalScore !== undefined ? "quiz" : "assessment");

  const confidence =
    confidenceProp !== undefined ? confidenceProp : averageAccuracy !== undefined ? averageAccuracy : null;
  const score = quizScore !== undefined ? quizScore : totalScore;
  const grade = quizGrade;
  const completionDate = completionDateProp || new Date().toISOString();

  const noClearMatch = mode === "assessment" && (confidence === null || confidence < 60 || !prediction);

  const severityMeta = useMemo(() => getSeverityMeta(noClearMatch ? "No Clear Match" : severity), [
    severity,
    noClearMatch,
  ]);

  const certificateId = useMemo(
    () => certificateIdProp || `SC-CERT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    [certificateIdProp]
  );

  const displayName = customName.trim() || "Guest User";
  const dateLabel = new Date(completionDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fileSafeName = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleDownloadPNG = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const canvas = await toCanvas(certRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `skinconsult_certificate_${fileSafeName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      onDownloadSuccess();
    } catch (err) {
      console.error("Certificate download error:", err);
      push("Unable to generate certificate image.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const canvas = await toCanvas(certRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`skinconsult_certificate_${fileSafeName}.pdf`);
      onDownloadSuccess();
    } catch (err) {
      console.error("Certificate download error:", err);
      push("Unable to generate certificate PDF.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const onDownloadSuccess = () => {
    setDownloaded(true);
    push("Certificate downloaded", "success");
    setTimeout(() => setDownloaded(false), 2200);
  };

  const handleShare = async () => {
    const shareText =
      "🩺 I completed an AI-assisted skin health assessment with SkinConsult 24/7. Check out my assessment certificate.";
    try {
      if (navigator.share) {
        await navigator.share({ title: "SkinConsult 24/7 Certificate", text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        push("Share message copied to clipboard", "success");
      }
    } catch {
      /* user cancelled share — no-op */
    }
  };

  useEffect(() => {
    if (autoDownload === "pdf") handleDownloadPDF();
    else if (autoDownload === "png") handleDownloadPNG();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload]);

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      {editable && (
        <div className="w-full max-w-md">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
            Patient Name
          </label>
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value.slice(0, 60))}
            maxLength={60}
            placeholder="Enter your name"
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-1)] focus:ring-2 focus:ring-[var(--accent-1)]/20"
          />
        </div>
      )}

      {/* ============ CERTIFICATE ============ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-3xl"
      >
        <div
          ref={certRef}
          className="relative aspect-[1.5/1] w-full overflow-hidden rounded-[28px] p-[3px]"
          style={{
            background: "linear-gradient(120deg, #38bdf8, #06b6d4, #ddd6fe, #38bdf8)",
            backgroundSize: "300% 300%",
          }}
        >
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[26px] bg-white px-6 py-6 sm:px-10 sm:py-8">
            {/* Background decoration */}
            <CertificateBackground />

            {/* Watermark */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
              <span className="select-none whitespace-nowrap text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-widest text-slate-900 opacity-[0.035]">
                SkinConsult
              </span>
            </div>

            {/* Inner subtle border */}
            <div className="pointer-events-none absolute inset-3 rounded-[20px] border border-slate-200/70" />
            {/* Corner decorations */}
            {["top-2 left-2 border-l-2 border-t-2", "top-2 right-2 border-r-2 border-t-2", "bottom-2 left-2 border-l-2 border-b-2", "bottom-2 right-2 border-r-2 border-b-2"].map(
              (pos) => (
                <div
                  key={pos}
                  className={`pointer-events-none absolute h-6 w-6 rounded-sm border-cyan-300 ${pos}`}
                />
              )
            )}

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col">
              {/* Header */}
              <div className="flex flex-col items-center text-center">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg sm:h-14 sm:w-14"
                  style={{ background: "linear-gradient(135deg,#38bdf8,#8b5cf6)" }}
                >
                  <Award className="h-6 w-6" />
                  <span className="absolute inset-0 -z-10 animate-pulse-slow rounded-2xl bg-cyan-300/40 blur-xl" />
                </motion.div>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 sm:text-xs">
                  SkinConsult 24/7 · AI Skin Health Assessment
                </p>
                <h1 className="mt-1 text-xl font-extrabold uppercase tracking-wide text-slate-800 sm:text-2xl">
                  Certificate of{" "}
                  <span
                    style={{
                      backgroundImage: "linear-gradient(90deg,#0891b2,#38bdf8,#8b5cf6)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {mode === "quiz" ? "Completion" : "AI Assessment"}
                  </span>
                </h1>
              </div>

              {/* Patient */}
              <div className="mt-3 text-center sm:mt-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 sm:text-xs">
                  {mode === "quiz"
                    ? "This certifies that the Daily Skin Health Check was completed by"
                    : "This AI assessment was completed for"}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl" style={{ fontFamily: "serif" }}>
                  {displayName}
                </p>
              </div>

              {/* Central summary card */}
              <div className="mx-auto mt-4 grid w-full max-w-xl flex-1 grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-3 sm:gap-4">
                {mode === "quiz" ? (
                  <>
                    <MiniStat label="Score" value={`${score ?? 0}/100`} />
                    <MiniStat label="Grade" value={grade ?? "—"} accent />
                    <MiniStat label="Date" value={new Date(completionDate).toLocaleDateString()} />
                  </>
                ) : (
                  <>
                    <div className="col-span-1 sm:col-span-1">
                      <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                        Possible Match
                      </p>
                      <p className="mt-1 text-center text-sm font-bold text-slate-800 sm:text-base">
                        {noClearMatch ? "No Clear Match" : prediction}
                      </p>
                    </div>
                    <ConfidenceMeter value={noClearMatch ? confidence ?? 0 : confidence} />
                    <div className="col-span-1 sm:col-span-1">
                      <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                        Severity
                      </p>
                      <p
                        className="mt-1 flex items-center justify-center gap-1.5 text-center text-sm font-bold sm:text-base"
                        style={{ color: severityMeta.color }}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ background: severityMeta.color }} />
                        {severityMeta.label}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {imageDataUrl && mode === "assessment" && (
                <div className="mt-4 flex flex-col items-center gap-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    Image Used For AI Assessment
                  </p>
                  <img
                    src={imageDataUrl}
                    alt="Skin assessment reference"
                    className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {/* Statement */}
              <p className="mx-auto mt-4 max-w-lg text-center text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
                {mode === "quiz"
                  ? "This certificate acknowledges completion of the SkinConsult 24/7 Daily Skin Health Check and does not certify medical expertise or qualification."
                  : "This certificate acknowledges completion of an AI-assisted skin health assessment through SkinConsult 24/7. The assessment provides an AI-estimated result based on the submitted image and reported information and should not be considered a medical diagnosis."}
              </p>

              {/* Footer: seal + signature */}
              <div className="mt-4 flex items-end justify-between px-2 sm:mt-5">
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-700 sm:text-sm">
                    SkinConsult 24/7
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 sm:text-[10px]">
                    AI Health Companion · AI Assessment System
                  </p>
                  <p className="mt-1 text-[9px] text-slate-400">
                    Certificate ID: {certificateId} · {dateLabel}
                  </p>
                </div>

                <AISeal />
              </div>

              {/* Disclaimer */}
              <p className="mt-3 text-center text-[8.5px] leading-relaxed text-slate-400 sm:text-[9px]">
                Disclaimer: This AI-generated assessment is for informational purposes only and does not
                replace professional medical advice, diagnosis, or treatment. Consult a qualified healthcare
                professional for medical concerns.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <GradientButton icon={Download} loading={downloading} onClick={handleDownloadPNG}>
          Download PNG
        </GradientButton>
        <GradientButton variant="secondary" icon={FileDown} loading={downloading} onClick={handleDownloadPDF}>
          Download PDF
        </GradientButton>
        <GradientButton variant="ghost" icon={Share2} onClick={handleShare}>
          Share Certificate
        </GradientButton>
      </div>

      {downloaded && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm font-medium text-emerald-600"
        >
          <CheckCircle2 className="h-4 w-4" /> Certificate saved successfully
        </motion.div>
      )}
    </div>
  );
}

function MiniStat({ label, value, accent = false }) {
  return (
    <div className="text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={`mt-1 text-lg font-extrabold sm:text-xl ${accent ? "" : "text-slate-800"}`}
        style={
          accent
            ? {
                backgroundImage: "linear-gradient(90deg,#0891b2,#8b5cf6)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }
            : undefined
        }
      >
        {value}
      </p>
    </div>
  );
}

function ConfidenceMeter({ value }) {
  const pct = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  const low = pct < 60;
  return (
    <div className="text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Confidence</p>
      <p className="mt-1 text-lg font-extrabold text-slate-800 sm:text-xl">
        {low ? (
          <span className="flex items-center justify-center gap-1 text-sm font-bold text-amber-600 sm:text-base">
            <AlertCircle className="h-3.5 w-3.5" /> Low
          </span>
        ) : (
          `${pct}%`
        )}
      </p>
      <div className="mx-auto mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg,#38bdf8,#8b5cf6)" }}
        />
      </div>
    </div>
  );
}

function AISeal() {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: -15, scale: 0.7 }}
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.6, type: "spring" }}
      className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full sm:h-20 sm:w-20"
      style={{
        background: "conic-gradient(from 0deg, #38bdf8, #8b5cf6, #06b6d4, #38bdf8)",
      }}
    >
      <div className="flex h-[82%] w-[82%] flex-col items-center justify-center rounded-full bg-white text-center leading-none">
        <ShieldCheck className="h-3.5 w-3.5 text-cyan-500 sm:h-4 sm:w-4" />
        <span className="mt-0.5 text-[6.5px] font-black uppercase tracking-wide text-slate-700 sm:text-[7px]">
          SkinConsult
        </span>
        <span className="text-[6.5px] font-black uppercase tracking-wide text-slate-700 sm:text-[7px]">
          24/7
        </span>
        <span className="mt-0.5 text-[5.5px] font-semibold uppercase tracking-wider text-cyan-500 sm:text-[6px]">
          AI Verified
        </span>
      </div>
    </motion.div>
  );
}

function CertificateBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -left-16 -top-16 h-56 w-56 animate-pulse-slow rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #a5f3fc, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-16 -right-16 h-56 w-56 animate-pulse-slow rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #ddd6fe, transparent 70%)", animationDelay: "1.5s" }}
      />
      <svg className="absolute inset-0 h-full w-full opacity-[0.08]">
        <circle cx="15%" cy="20%" r="60" stroke="#38bdf8" strokeWidth="1" fill="none" />
        <circle cx="85%" cy="80%" r="80" stroke="#8b5cf6" strokeWidth="1" fill="none" />
        <circle cx="90%" cy="15%" r="30" stroke="#06b6d4" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}

function getSeverityMeta(severity) {
  const map = {
    Mild: { label: "Mild", color: "#10b981" },
    Moderate: { label: "Moderate", color: "#f59e0b" },
    Severe: { label: "Severe", color: "#ef4444" },
    "No Clear Match": { label: "No Clear Match", color: "#94a3b8" },
    Undetermined: { label: "No Clear Match", color: "#94a3b8" },
  };
  return map[severity] || { label: severity || "Undetermined", color: "#94a3b8" };
}