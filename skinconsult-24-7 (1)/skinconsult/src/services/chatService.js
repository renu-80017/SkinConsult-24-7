// AI Doctor conversation service. All replies come from the Python backend —
// see src/services/api/consultationApi.js and /docs/ai-doctor-backend-api.md.
// This file intentionally contains no canned/fake responses.
export {
  sendChatMessage,
  startConsultation,
  sendConsultationMessage,
  requestConsultationReport,
} from "./api/consultationApi";

export const QUICK_PROMPTS = [
  "What could cause dry skin?",
  "How can I improve my daily skin-care routine?",
  "Help me understand my skin analysis.",
  "Generate my consultation report.",
];
