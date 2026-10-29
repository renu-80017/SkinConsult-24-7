import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Search } from "lucide-react";
import Layout from "../components/ui/Layout";
import GlassCard from "../components/ui/GlassCard";
import GradientButton from "../components/ui/GradientButton";
import SkinCellBackground from "../components/skin/SkinCellBackground";
import { useReports } from "../context/ReportsContext";

export default function VerifyCertificate() {
  const [searchParams] = useSearchParams();
  const urlId = searchParams.get("id") || "";

  const [id, setId] = useState(urlId);
  const [result, setResult] = useState(null); // null | "valid" | "invalid"
  const [cert, setCert] = useState(null);
  const { verifyCertificate } = useReports();

  const runVerify = (rawId) => {
    const found = verifyCertificate(rawId);
    if (found) {
      setCert(found);
      setResult("valid");
    } else {
      setCert(null);
      setResult("invalid");
    }
  };

  // Auto-verify when arriving with ?id=... in the URL (same pattern as
  // Certificate.jsx / Reports "View" links) instead of requiring manual entry.
  useEffect(() => {
    if (urlId) {
      setId(urlId);
      runVerify(urlId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId]);

  const handleVerify = (e) => {
    e.preventDefault();
    runVerify(id);
  };

  return (
    <Layout>
      <section className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
        <SkinCellBackground variant="cells" />
        <div className="relative w-full max-w-md">
          <GlassCard className="p-8">
            <h1 className="text-2xl font-bold text-[var(--text)]">Verify Certificate</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Enter a SkinConsult 24/7 certificate ID to confirm its authenticity.
            </p>
            <form onSubmit={handleVerify} className="mt-6 flex gap-2">
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. SC-CERT-AB12CD"
                className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-1)]"
              />
              <GradientButton type="submit" icon={Search} iconRight={false} className="!px-4" />
            </form>

            <AnimatePresence mode="wait">
              {result === "valid" && cert && (
                <motion.div
                  key="valid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                >
                  <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-5 w-5" /> Valid Certificate
                  </div>
                  <dl className="mt-3 space-y-1 text-sm text-[var(--text)]">
                    <Row label="SkinConsult 24/7" value="" hideEmpty />
                    <Row label="Name" value={cert.patientName} />
                    <Row label="Date" value={new Date(cert.issuedAt).toLocaleDateString()} />
                    {cert.mode === "quiz" ? (
                      <>
                        <Row label="Score" value={`${cert.quizScore}/100`} />
                        <Row label="Grade" value={cert.quizGrade} />
                      </>
                    ) : (
                      <>
                        <Row label="Possible Match" value={cert.prediction || "No Clear Match"} />
                        <Row label="Confidence" value={cert.confidence ? `${cert.confidence}%` : "—"} />
                        <Row label="Severity" value={cert.severity || "—"} />
                      </>
                    )}
                    <Row label="Status" value="Completed" />
                  </dl>
                </motion.div>
              )}
              {result === "invalid" && (
                <motion.div
                  key="invalid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
                >
                  <ShieldAlert className="h-5 w-5" /> Invalid Certificate ID
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      </section>
    </Layout>
  );
}

function Row({ label, value, hideEmpty }) {
  if (hideEmpty && !value) return null;
  return (
    <div className="flex justify-between border-b border-[var(--border)] py-1 text-xs last:border-0">
      <dt className="text-[var(--text-faint)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}