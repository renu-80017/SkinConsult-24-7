// REST client for the AI Doctor consultation feature. All AI reasoning,
// conversation memory, and report generation live on the Python backend —
// see /docs/ai-doctor-backend-api.md for the full contract this talks to.
import { apiRequest, apiRequestBlob } from "./httpClient";

/** Normalizes the backend's snake_case report JSON into a stable camelCase shape. */
function normalizeReport(raw) {
  if (!raw) return null;
  return {
    reportId: raw.report_id,
    sessionId: raw.session_id,
    createdAt: raw.created_at,
    patient: {
      name: raw.patient?.name,
      age: raw.patient?.age,
      gender: raw.patient?.gender,
    },
    consultationDate: raw.consultation_date,
    primaryConcern: raw.primary_concern,
    symptoms: raw.symptoms || [],
    relevantHistory: raw.relevant_history || [],
    previousReports: (raw.previous_reports || []).map((r) => ({
      reportType: r.report_type,
      date: r.date,
      finding: r.finding,
      source: r.source,
    })),
    keyFindings: raw.key_findings || [],
    guidanceProvided: raw.guidance_provided || [],
    recommendedNextSteps: raw.recommended_next_steps || [],
    whenToSeekCare: raw.when_to_seek_care || [],
    disclaimer: raw.disclaimer,
    hasPdf: Boolean(raw.has_pdf ?? raw.pdf_url),
  };
}

function normalizeReportSummary(raw) {
  return {
    reportId: raw.report_id,
    patientName: raw.patient_name,
    consultationDate: raw.consultation_date,
    primaryConcern: raw.primary_concern,
    createdAt: raw.created_at,
    hasPdf: Boolean(raw.has_pdf),
  };
}

/**
 * Sends the full chat history to the AI Doctor endpoint and returns the
 * assistant's reply. Stateless — the real backend (backend/app.py,
 * POST /api/consultations, via local Ollama) has no session concept and no
 * memory of its own; every request must carry the whole conversation.
 * `messages` is an array of { role: "user" | "assistant", content }.
 */
export async function sendChatMessage(messages) {
  const data = await apiRequest("/api/consultations", {
    method: "POST",
    body: { messages },
  });
  return { role: data.role, content: data.content };
}

/**
 * Generates a PDF report from a chat conversation via the real backend's
 * POST /generate-chat-report endpoint, and returns the PDF as a Blob.
 * Mirrors the Analyzer's report flow: the caller saves this into Reports
 * rather than auto-downloading it.
 */
export async function generateChatReport({ patientName, messages, imageBase64 }) {
  return apiRequestBlob("/generate-chat-report", {
    method: "POST",
    body: {
      patient_name: patientName || null,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      image_base64: imageBase64 || null,
    },
  });
}

/**
 * Legacy session-based helpers below this line are built against the richer
 * contract documented in docs/ai-doctor-backend-api.md, which the current
 * backend does not implement (no /api/consultations/:id/*, no /api/reports
 * routes, no image support). They're kept for when/if that backend lands,
 * but calling them today will fail against the real server.
 */

/** Starts a new consultation session. Returns { sessionId, message }. */
export async function startConsultation(patient = {}) {
  const data = await apiRequest("/api/consultations", {
    method: "POST",
    body: { patient },
  });
  return { sessionId: data.session_id, message: data.message };
}

/**
 * Sends a patient message (and optional image) to the active session.
 * Returns { reply, reportRequested, report }.
 */
export async function sendConsultationMessage(sessionId, { message, imageDataUrl, imageName }) {
  const data = await apiRequest(`/api/consultations/${sessionId}/messages`, {
    method: "POST",
    body: {
      message,
      image_data_url: imageDataUrl || undefined,
      image_name: imageName || undefined,
    },
  });
  return {
    reply: data.reply,
    reportRequested: Boolean(data.report_requested),
    report: normalizeReport(data.report),
  };
}

/** Explicitly requests the structured consultation report for a session. */
export async function requestConsultationReport(sessionId) {
  const data = await apiRequest(`/api/consultations/${sessionId}/report`, { method: "POST" });
  return normalizeReport(data.report);
}

/** Lists previously generated & saved consultation reports (newest first). */
export async function fetchConsultationReports() {
  const data = await apiRequest("/api/reports");
  return (data.reports || []).map(normalizeReportSummary);
}

/** Fetches one full structured consultation report. */
export async function fetchConsultationReport(reportId) {
  const data = await apiRequest(`/api/reports/${reportId}`);
  return normalizeReport(data.report || data);
}

/** Downloads the backend-rendered PDF for a saved report as a Blob. */
export function downloadConsultationReportPdf(reportId) {
  return apiRequestBlob(`/api/reports/${reportId}/pdf`);
}

/** Permanently deletes a saved consultation report (and its PDF). */
export function deleteConsultationReport(reportId) {
  return apiRequest(`/api/reports/${reportId}`, { method: "DELETE" });
}