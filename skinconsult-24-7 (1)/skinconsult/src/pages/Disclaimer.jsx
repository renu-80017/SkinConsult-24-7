import { ShieldAlert } from "lucide-react";
import Layout from "../components/ui/Layout";
import SectionHeading from "../components/ui/SectionHeading";
import GlassCard from "../components/ui/GlassCard";

export default function Disclaimer() {
  return (
    <Layout>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Important" title="Medical Disclaimer" align="left" />
        <GlassCard className="mt-10 flex gap-4 p-8">
          <ShieldAlert className="h-8 w-8 flex-shrink-0 text-amber-500" />
          <div className="space-y-4 text-sm leading-relaxed text-[var(--text-muted)]">
            <p>
              SkinConsult 24/7 provides AI-assisted educational information and does not replace
              professional medical advice, diagnosis, or treatment.
            </p>
            <p>
              All AI predictions, confidence scores, and skin-health scores are AI-assisted estimates
              and educational tools — not confirmed medical diagnoses. The AI assistant is not a licensed
              doctor and does not claim to be one.
            </p>
            <p>
              Certificates generated within this application confirm completion of an assessment or
              quiz only. They do not certify medical expertise, qualification, or a confirmed diagnosis.
            </p>
            <p>
              If you are experiencing a medical emergency or a rapidly worsening condition, contact a
              licensed healthcare professional or emergency services immediately.
            </p>
          </div>
        </GlassCard>
      </section>
    </Layout>
  );
}
