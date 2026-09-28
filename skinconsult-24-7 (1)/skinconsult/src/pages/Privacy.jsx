import Layout from "../components/ui/Layout";
import SectionHeading from "../components/ui/SectionHeading";
import GlassCard from "../components/ui/GlassCard";

const SECTIONS = [
  {
    title: "User Information",
    body: "In this prototype, account information (name, email) you provide during sign-up is stored locally in your browser for demo purposes only. No real account system or server-side database is currently connected.",
  },
  {
    title: "Uploaded Images",
    body: "Images you upload to the AI Skin Analyzer are processed in-browser for this demo and are not sent to a real backend or stored permanently. A production deployment would require explicit, documented image-handling and retention policies.",
  },
  {
    title: "Reports & Certificates",
    body: "Generated reports and certificates are saved to your browser's local storage so you can revisit them during this session. They are not currently synced to any cloud database.",
  },
  {
    title: "Demo Data",
    body: "AI analysis results, chat responses, and model information shown throughout the app are clearly labeled DEMO or MOCK and do not reflect a trained, validated medical AI system.",
  },
  {
    title: "Future Backend Storage",
    body: "The architecture is designed to later connect to a FastAPI backend with persistent storage (e.g. PostgreSQL/MySQL). No such connection currently exists in this build.",
  },
];

export default function Privacy() {
  return (
    <Layout>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Legal" title="Privacy" align="left" />
        <div className="mt-10 space-y-6">
          {SECTIONS.map((s) => (
            <GlassCard key={s.title} className="p-6">
              <h3 className="font-semibold text-[var(--text)]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{s.body}</p>
            </GlassCard>
          ))}
        </div>
      </section>
    </Layout>
  );
}
