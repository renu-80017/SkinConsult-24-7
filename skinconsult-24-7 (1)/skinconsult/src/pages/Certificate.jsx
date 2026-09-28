import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import Layout from "../components/ui/Layout";
import CertificateCanvas from "../components/certificate/CertificateCanvas";
import SkinCellBackground from "../components/skin/SkinCellBackground";
import { useReports } from "../context/ReportsContext";

function genCertId() {
  return `SC-CERT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export default function Certificate() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addCertificate } = useReports();
  const [savedId, setSavedId] = useState(null);
  const certificateId = useMemo(genCertId, []);

  const { patientName, quizResult, analysis, imageDataUrl } = location.state || {};
  const mode = quizResult ? "quiz" : "assessment";

  useEffect(() => {
    if (!quizResult && !analysis) {
      navigate("/quiz", { replace: true });
      return;
    }
    const cert = addCertificate({
      id: certificateId,
      mode,
      patientName: patientName || "Guest User",
      quizScore: quizResult?.overallScore,
      quizGrade: quizResult?.grade,
      prediction: analysis?.prediction,
      confidence: analysis?.confidence,
      severity: analysis?.severity,
    });
    setSavedId(cert.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!quizResult && !analysis) return null;

  return (
    <Layout>
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <SkinCellBackground variant="cells" />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mx-auto mb-8 flex max-w-2xl flex-col items-center text-center"
        >
          <PartyPopper className="h-8 w-8 text-[var(--accent-1)]" />
          <h1 className="mt-3 text-2xl font-bold text-[var(--text)]">Assessment Complete!</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Your certificate has been generated below. This confirms completion of the assessment only —
            it does not certify medical expertise or qualification.
          </p>
          {savedId && (
            <p className="mt-2 text-xs text-[var(--text-faint)]">
              Certificate ID: <span className="font-mono">{savedId}</span> — verify anytime at{" "}
              <button onClick={() => navigate("/verify-certificate")} className="text-[var(--accent-1)] underline">
                /verify-certificate
              </button>
            </p>
          )}
        </motion.div>

        <div className="relative mx-auto max-w-3xl">
          <CertificateCanvas
            mode={mode}
            certificateId={certificateId}
            patientName={patientName}
            quizScore={quizResult?.overallScore}
            quizGrade={quizResult?.grade}
            prediction={analysis?.prediction}
            confidence={analysis?.confidence}
            severity={analysis?.severity}
            imageDataUrl={imageDataUrl}
          />
        </div>
      </section>
    </Layout>
  );
}
