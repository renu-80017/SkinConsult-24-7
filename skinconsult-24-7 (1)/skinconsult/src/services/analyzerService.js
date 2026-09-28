// Real service: calls the FastAPI backend's POST /predict endpoint.

const API_BASE_URL = "http://127.0.0.1:8000";

export async function analyzeImage(imageFile, modelType = "dermnet") {
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("model_type", modelType);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    throw new Error(
      `Could not reach the analysis server at ${API_BASE_URL}. Is the backend running? (${err.message})`
    );
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body);
    } catch {
      // Response body was not JSON; fall back to status text.
    }
    throw new Error(
      `Analysis failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Analysis server returned an invalid response.");
  }

  const toPercent = (value) => Math.round(value * 1000) / 10;

  return {
    prediction: data.predicted_class,
    confidence: toPercent(data.confidence),
    severity: null,
    model: modelType,
    alternatives: (data.top_3 ?? []).map((item) => ({
      label: item.class,
      confidence: toPercent(item.confidence),
    })),
    isDemo: false,
    analyzedAt: new Date().toISOString(),
  };
}

export function getConfidenceThreshold() {
  return 25; // below this => "No Clear Match" messaging
}
