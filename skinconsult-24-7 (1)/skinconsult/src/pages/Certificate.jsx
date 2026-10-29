import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PartyPopper, Award } from "lucide-react";
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
  const [searchParams] = useSearchParams();
  const { addCertificate, certificates } = useReports();
  const [savedId, setSavedId] = useState(null);
  const certificateId = useMemo(genCertId, []);

  const viewId = searchParams.get("id");
  const autoDownload = searchParams.get("auto") || undefined;
  const existingCert = viewId ? certificates.find((c) => c.id === viewId) : null;

  const { patientName, quizResult, analysis, imageDataUrl } = location.state || {};
  const mode = existingCert ? existingCert.mode : quizResult ? "quiz" : "assessment";

  useEffect(() => {
    if (existingCert) return; // viewing a saved certificate — nothing to generate
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

  if (!existingCert && !quizResult && !analysis) return null;

  return (
    <Layout>
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <SkinCellBackground variant="cells" />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mx-auto mb-8 flex max-w-2xl flex-col items-center text-center"
        >
          {existingCert ? (
            <>
              <Award className="h-8 w-8 text-[var(--accent-1)]" />
              <h1 className="mt-3 text-2xl font-bold text-[var(--text)]">Your Certificate</h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Certificate ID: <span className="font-mono">{existingCert.id}</span>
              </p>
            </>
          ) : (
            <>
              <PartyPopper className="h-8 w-8 text-[var(--accent-1)]" />
              <h1 className="mt-3 text-2xl font-bold text-[var(--text)]">Assessment Complete!</h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Your certificate has been generated below. This confirms completion of the assessment only —
                it does not certify medical expertise or qualification.
              </p>
              {savedId && (
                <p className="mt-2 text-xs text-[var(--text-faint)]">
                  Certificate ID: <span className="font-mono">{savedId}</span> — find it anytime under{" "}
                  <button onClick={() => navigate("/reports")} className="text-[var(--accent-1)] underline">
                    Reports → Certificates
                  </button>
                </p>
              )}
            </>
          )}
        </motion.div>

        <div className="relative mx-auto max-w-3xl">
          <CertificateCanvas
            mode={mode}
            certificateId={existingCert ? existingCert.id : certificateId}
            patientName={existingCert ? existingCert.patientName : patientName}
            quizScore={existingCert ? existingCert.quizScore : quizResult?.overallScore}
            quizGrade={existingCert ? existingCert.quizGrade : quizResult?.grade}
            prediction={existingCert ? existingCert.prediction : analysis?.prediction}
            confidence={existingCert ? existingCert.confidence : analysis?.confidence}
            severity={existingCert ? existingCert.severity : analysis?.severity}
            completionDate={existingCert ? existingCert.issuedAt : undefined}
            imageDataUrl={existingCert ? undefined : imageDataUrl}
            editable={!existingCert}
            autoDownload={autoDownload}
          />
        </div>
      </section>
    </Layout>
  );
}