import { createContext, useContext, useEffect, useState } from "react";

const ReportsContext = createContext(null);
const REPORTS_KEY = "sc-reports";
const CERTS_KEY = "sc-certificates";

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function genId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

export function ReportsProvider({ children }) {
  const [reports, setReports] = useState(() => load(REPORTS_KEY));
  const [certificates, setCertificates] = useState(() => load(CERTS_KEY));

  useEffect(() => localStorage.setItem(REPORTS_KEY, JSON.stringify(reports)), [reports]);
  useEffect(() => localStorage.setItem(CERTS_KEY, JSON.stringify(certificates)), [certificates]);

  const addReport = (report) => {
    const existingVersions = reports.filter((r) => r.consultationId === report.consultationId);
    const version = existingVersions.length + 1;
    const newReport = {
      id: genId("SC"),
      version,
      createdAt: new Date().toISOString(),
      ...report,
    };
    setReports((prev) => [newReport, ...prev]);
    return newReport;
  };

  const deleteReport = (id) => setReports((prev) => prev.filter((r) => r.id !== id));

  const getReport = (id) => reports.find((r) => r.id === id);

  const addCertificate = (cert) => {
    const newCert = {
      id: cert.id || genId("SC-CERT"),
      issuedAt: new Date().toISOString(),
      ...cert,
    };
    setCertificates((prev) => [newCert, ...prev]);
    return newCert;
  };

  const verifyCertificate = (id) => certificates.find((c) => c.id === id?.trim());

  return (
    <ReportsContext.Provider
      value={{
        reports,
        certificates,
        addReport,
        deleteReport,
        getReport,
        addCertificate,
        verifyCertificate,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error("useReports must be used within ReportsProvider");
  return ctx;
}
