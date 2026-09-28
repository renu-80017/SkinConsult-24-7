# AI Doctor Backend API Contract

The SkinConsult 24/7 frontend (`src/services/api/consultationApi.js`) is built
against this contract. It contains **no AI logic and no fake responses** —
every reply, memory decision, and report comes from this backend. Implement
this as a Python REST API (FastAPI is assumed by the existing mock-service
comments elsewhere in the repo) with your ML/LLM model behind it.

Base URL comes from the frontend's `VITE_API_BASE_URL` env var (see
`.env.example`), default `http://localhost:8000`.

All requests/responses are JSON unless noted. All routes are prefixed `/api`.

---

## 1. Conversation behavior the backend must implement

This is the product spec the model/orchestration layer needs to follow —
nothing here is enforced by the frontend.

**Persona:** calm, patient, professional healthcare assistant. Simple
language, explain medical terms when used, never robotic/judgmental/curt.
Acknowledge the patient's concern before guiding. Ask relevant follow-ups,
one (or few) at a time. Never re-ask for information already given. Give
concise answers by default; expand when asked. Flow per turn: **LISTEN →
UNDERSTAND → ASK → EXPLAIN → GUIDE → CONTINUE**.

**Natural information collection (no upfront form):** gather name, age, and
gender (only when medically relevant) naturally, then dynamically collect
whatever is relevant to the concern: symptoms, onset/duration, location,
severity, trend (better/worse), prior similar issues, current skincare
routine, new products, treatments, medications, allergies, relevant medical
or family history, lifestyle/environmental factors, and anything about prior
reports/tests/diagnoses the patient volunteers. Skip anything irrelevant to
the concern; never force an answer — "I don't know" is a valid answer and the
conversation continues naturally.

**Previous reports/documents:** mentioning a report (e.g. "my blood test
showed low Vitamin D") is just information to remember and fold into the
consultation — it must **not** by itself trigger report generation. Track
whether a finding was *patient-reported* vs *extracted from an uploaded
document*, and never fabricate a finding that wasn't actually provided.

**Session memory** the backend should maintain per `session_id`:
`patient_details` (name/age/gender), `main_concern`, `symptoms` (with
location/duration/severity/trend), `relevant_history` (prior issues,
medications, allergies, treatments), `reports_discussed` (type, date,
finding, source), and `consultation_notes` (guidance given, next steps
discussed). This state is what the final report is built from — never from
raw chat transcript.

**Medical safety:** no definitive diagnoses, no invented tests/meds/history,
no claim of having examined the patient. Distinguish possible causes from
confirmed findings. Encourage professional evaluation when appropriate, and
clearly escalate to urgent/emergency care language for red-flag symptoms
(e.g. facial/throat swelling, breathing difficulty, rapidly spreading
infection, severe uncontrolled bleeding, high fever with rash).

**Report generation is opt-in only.** Never produce a report just because
the conversation ended or because "report" was mentioned in passing. Only
generate one when the patient's message is an explicit request, e.g. "give
me a report", "generate my report", "summarize my consultation", "can you
give me what we discussed" — as opposed to "my previous report says...",
"I have a report", which are just information. When explicit, set
`report_requested: true` on that turn's response (see §3) and include the
generated `report` inline. The frontend also exposes a manual "Generate
Report" button that always calls `POST /consultations/{id}/report` (§4)
directly regardless of wording — treat that as an explicit request too.

**Report content:** an intelligent summary of the session's structured
memory (never a chat transcript). Omit sections with no data — never invent
placeholder content. See §5 for the exact schema.

---

## 2. `POST /api/consultations` — start a session

Request:
```json
{ "patient": { "name": "Anu", "age": 24, "gender": "female" } }
```
`patient` is optional and usually empty — details are collected via
conversation, not a form.

Response `200`:
```json
{
  "session_id": "b3f1...",
  "message": {
    "id": "msg_1",
    "role": "assistant",
    "content": "Hi! I'm your SkinConsult AI Doctor... may I know your name?",
    "timestamp": "2026-09-15T10:00:00Z"
  }
}
```

## 3. `POST /api/consultations/{session_id}/messages` — send a turn

Request:
```json
{
  "message": "My face has been itchy and red for five days.",
  "image_data_url": "data:image/png;base64,....",
  "image_name": "cheek.jpg"
}
```
`image_data_url`/`image_name` are omitted when no image was attached.

Response `200`:
```json
{
  "reply": {
    "id": "msg_7",
    "role": "assistant",
    "content": "Thanks for sharing that. Have you started any new cream or product recently?",
    "timestamp": "2026-09-15T10:02:00Z"
  },
  "report_requested": false,
  "report": null
}
```
When the message is an explicit report request, `report_requested: true` and
`report` is the full object from §5 (already generated and persisted).

## 4. `POST /api/consultations/{session_id}/report` — explicit report request

No body required. Generates, persists, and returns the report immediately
(this is what the frontend's manual "Generate Report" button calls).

Response `200`: `{ "report": { ...see §5... } }`

Errors (this endpoint and §3) should return `4xx/5xx` with
`{ "detail": "human-readable message" }` — the frontend surfaces `detail` in
toasts.

## 5. Report object shape

```json
{
  "report_id": "RPT-8F2A1C",
  "session_id": "b3f1...",
  "created_at": "2026-09-15T10:15:00Z",
  "patient": { "name": "Anu", "age": null, "gender": null },
  "consultation_date": "2026-09-15T10:15:00Z",
  "primary_concern": "Facial itching and redness for about five days.",
  "symptoms": ["Facial itching", "Redness", "Mainly affecting the cheek area", "Started approximately 5 days ago"],
  "relevant_history": ["Started a new cream (XYZ cream) shortly before symptoms began"],
  "previous_reports": [
    {
      "report_type": "Blood test",
      "date": null,
      "finding": "Patient reported low Vitamin D (previous month; exact date not provided).",
      "source": "patient_reported"
    }
  ],
  "key_findings": ["Symptom onset coincides with a new cream", "No prior history of similar reactions reported"],
  "guidance_provided": ["Discontinue the new cream and monitor for improvement", "Use a gentle, fragrance-free moisturizer"],
  "recommended_next_steps": ["Observe symptoms for 3-5 days after stopping the new product", "Consult a dermatologist if no improvement"],
  "when_to_seek_care": ["Rapid spreading, swelling, blistering, or signs of infection", "Symptoms lasting more than 2 weeks without improvement"],
  "disclaimer": "This consultation provides general health information and does not replace evaluation, diagnosis, or treatment by a qualified healthcare professional.",
  "has_pdf": true
}
```

Rules: only include fields with real data (omit/empty-array the rest — the
frontend already hides empty sections). Never invent patient details, dates,
or findings. `previous_reports[].source` must be `"patient_reported"` or
`"uploaded_document"`.

Persistence: generating a report via §3 or §4 must save both the report
JSON and a rendered PDF server-side. Do not create a new PDF for the same
report unless the patient explicitly asks again (a fresh request creates a
new `report_id`/version, it does not overwrite silently).

## 6. `GET /api/reports` — list saved reports (Reports page)

Response `200`:
```json
{
  "reports": [
    {
      "report_id": "RPT-8F2A1C",
      "patient_name": "Anu",
      "consultation_date": "2026-09-15T10:15:00Z",
      "primary_concern": "Facial itching and redness for about five days.",
      "created_at": "2026-09-15T10:15:00Z",
      "has_pdf": true
    }
  ]
}
```
Newest first.

## 7. `GET /api/reports/{report_id}` — full report

Response `200`: `{ "report": { ...see §5... } }`

## 8. `GET /api/reports/{report_id}/pdf` — PDF download

Response `200`, `Content-Type: application/pdf`, raw PDF bytes. The PDF must
mirror the structured report (sections, headings, bullets, SkinConsult
branding) — never a raw chat transcript.

## 9. `DELETE /api/reports/{report_id}` — delete a report

Deletes the report record and its stored PDF. Response `200`:
`{ "success": true }`.

---

## Error format

Any non-2xx response should be JSON with a `detail` (or `message`) string;
the frontend displays it directly to the user in a toast, e.g.:
```json
{ "detail": "Session not found or has expired." }
```
