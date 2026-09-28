import { AlertTriangle, FileText } from "lucide-react";
import GlassCard from "../ui/GlassCard";

const SOURCE_LABEL = {
  patient_reported: "Patient reported",
  uploaded_document: "Information from uploaded document",
};

export default function ConsultationReportView({ report }) {
  if (!report) return null;

  const { patient } = report;
  const hasPatientDetails = patient?.name || patient?.age || patient?.gender;

  return (
    <GlassCard className="overflow-hidden p-0">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--accent-soft)] px-8 py-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent-2)]">SkinConsult 24/7</p>
        <h1 className="mt-2 text-xl font-bold text-[var(--text)]">AI Consultation Summary</h1>
        <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-[var(--text-faint)]">
          <span>Report ID: {report.reportId}</span>
          {report.consultationDate && <span>Date: {new Date(report.consultationDate).toLocaleString()}</span>}
        </div>
      </div>

      <div className="space-y-8 px-8 py-8">
        {hasPatientDetails && (
          <ReportSection title="Patient Details">
            <dl className="grid gap-x-6 gap-y-2 text-sm text-[var(--text)] sm:grid-cols-3">
              {patient?.name && (
                <div>
                  <dt className="text-xs text-[var(--text-faint)]">Name</dt>
                  <dd className="font-medium">{patient.name}</dd>
                </div>
              )}
              {patient?.age && (
                <div>
                  <dt className="text-xs text-[var(--text-faint)]">Age</dt>
                  <dd className="font-medium">{patient.age}</dd>
                </div>
              )}
              {patient?.gender && (
                <div>
                  <dt className="text-xs text-[var(--text-faint)]">Gender</dt>
                  <dd className="font-medium">{patient.gender}</dd>
                </div>
              )}
            </dl>
          </ReportSection>
        )}

        {report.primaryConcern && (
          <ReportSection title="Primary Concern">
            <p className="text-sm leading-relaxed text-[var(--text)]">{report.primaryConcern}</p>
          </ReportSection>
        )}

        {report.symptoms?.length > 0 && (
          <ReportSection title="Symptoms Discussed">
            <BulletList items={report.symptoms} />
          </ReportSection>
        )}

        {report.relevantHistory?.length > 0 && (
          <ReportSection title="Relevant History & Information">
            <BulletList items={report.relevantHistory} />
          </ReportSection>
        )}

        {report.previousReports?.length > 0 && (
          <ReportSection title="Previous Reports / Medical Documents">
            <div className="grid gap-3 sm:grid-cols-2">
              {report.previousReports.map((doc, i) => (
                <div key={i} className="rounded-2xl border border-[var(--border)] p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-[var(--accent-1)]" />
                    <p className="text-sm font-semibold text-[var(--text)]">{doc.reportType || "Medical report"}</p>
                  </div>
                  {doc.date && <p className="mt-1 text-xs text-[var(--text-faint)]">Date: {doc.date}</p>}
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{doc.finding}</p>
                  {doc.source && (
                    <span className="mt-3 inline-block rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-2)]">
                      {SOURCE_LABEL[doc.source] || doc.source}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ReportSection>
        )}

        {report.keyFindings?.length > 0 && (
          <ReportSection title="Key Consultation Findings">
            <BulletList items={report.keyFindings} />
          </ReportSection>
        )}

        {report.guidanceProvided?.length > 0 && (
          <ReportSection title="Guidance Provided">
            <BulletList items={report.guidanceProvided} />
          </ReportSection>
        )}

        {report.recommendedNextSteps?.length > 0 && (
          <ReportSection title="Recommended Next Steps">
            <BulletList items={report.recommendedNextSteps} />
          </ReportSection>
        )}

        {report.whenToSeekCare?.length > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">When to Seek Professional Care</p>
              <ul className="mt-2 space-y-1 text-xs leading-relaxed">
                {report.whenToSeekCare.map((line, i) => (
                  <li key={i}>• {line}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <p className="text-center text-xs leading-relaxed text-[var(--text-faint)]">
          {report.disclaimer ||
            "This consultation provides general health information and does not replace evaluation, diagnosis, or treatment by a qualified healthcare professional."}
        </p>
      </div>

      <div className="border-t border-[var(--border)] px-8 py-4 text-center text-[10px] text-[var(--text-faint)]">
        SkinConsult 24/7 · AI Skin Health Companion · Informational AI assessment — not a medical diagnosis.
      </div>
    </GlassCard>
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

function BulletList({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((line, i) => (
        <li key={i} className="rounded-xl bg-[var(--accent-soft)] px-4 py-2 text-sm text-[var(--text)]">
          • {line}
        </li>
      ))}
    </ul>
  );
}
