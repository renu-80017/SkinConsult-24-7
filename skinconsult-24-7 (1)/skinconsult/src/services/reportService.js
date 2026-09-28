// DEMO / MOCK report engine for the Analyzer and Quiz features. In production
// this would call POST /api/reports/generate on a FastAPI backend, which would
// retrieve persisted data and render report_template.html through WeasyPrint
// into a PDF. (The AI Doctor consultation report is a separate flow served
// directly by the Python backend — see src/services/api/consultationApi.js.)

export function buildReportFromAnalysis({ patientName, analysis, imageDataUrl }) {
  return {
    type: "analysis",
    patient: { name: patientName || "Not provided" },
    consultation: {
      consultationId: `ANLZ-${Date.now()}`,
      date: new Date().toISOString(),
      type: "skin_condition",
    },
    image: {
      imageUrl: imageDataUrl || null,
      qualityStatus: "Good",
    },
    aiAssessment: analysis,
    recommendations: {
      homeCare: [
        "Keep the affected area clean and gently moisturized.",
        "Avoid unnecessary scratching or irritation.",
      ],
      generalTreatmentGuidance: [
        "Consider discussing appropriate treatment options with a healthcare professional.",
      ],
      habitsToChange: [
        "Maintain a consistent, gentle skincare routine.",
        "Use daily sun protection.",
      ],
      whenToSeeDoctor:
        "Seek professional medical evaluation if symptoms worsen, spread rapidly, become severely painful, show signs of infection, or do not improve.",
    },
  };
}

export function buildReportFromQuiz({ patientName, quizResult }) {
  return {
    type: "quiz",
    patient: { name: patientName || "Not provided" },
    consultation: {
      consultationId: `QUIZ-${Date.now()}`,
      date: new Date().toISOString(),
      type: "daily_skin_check",
    },
    quizResult,
  };
}

export async function generateReport(reportPayload, addReportFn) {
  // Simulate report + PDF generation pipeline latency.
  await new Promise((r) => setTimeout(r, 1600));
  return addReportFn(reportPayload);
}
