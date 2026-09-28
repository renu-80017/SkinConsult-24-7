// Thin fetch wrapper shared by every API service. Centralizes the backend
// base URL, JSON handling, and error normalization so callers never touch
// `fetch` directly.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseErrorDetail(response) {
  try {
    const data = await response.json();
    return data?.detail || data?.message || "";
  } catch {
    return "";
  }
}

export async function apiRequest(path, { method = "GET", body, headers } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Unable to reach the AI Doctor backend. Please make sure the server is running.",
      0
    );
  }

  if (!response.ok) {
    const detail = await parseErrorDetail(response);
    throw new ApiError(detail || `Request failed (${response.status}).`, response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function apiRequestBlob(path, { method = "GET", body, headers } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Unable to reach the AI Doctor backend. Please make sure the server is running.",
      0
    );
  }

  if (!response.ok) {
    const detail = await parseErrorDetail(response);
    throw new ApiError(detail || `Request failed (${response.status}).`, response.status);
  }

  return response.blob();
}