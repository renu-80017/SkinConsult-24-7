# SkinConsult 24/7 — Your AI Skin Health Companion

A premium, highly animated AI skin-health companion frontend, built with
React + Vite + Tailwind CSS v4 + Framer Motion + React Router.

This is a real, multi-file project you can open in VS Code, install with
npm, and run locally. It currently works fully in **DEMO mode** — every
AI prediction, chat reply, and model metric is clearly labeled as
demo/mock data, with no backend required.

## Getting Started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

To create a production build:

```bash
npm run build
npm run preview
```

## What's included

- **Cinematic startup screen** on first load ("Initializing Skin
  Intelligence...")
- **About** page (first main route) with hero, pipeline, feature, and
  responsibility sections
- **Sign In / Sign Up / Forgot Password / Profile** — demo authentication
  (no real backend; state is kept in `localStorage`)
- **AI Skin Analyzer** (`/analyzer`) — upload or demo image → animated
  scanning sequence → DEMO AI result with confidence, severity, and
  alternatives
- **AI Doctor Chat** (`/ai-doctor`) — SkinConsult AI assistant with typing
  animation, quick prompts, and "Generate Report" flow
- **Daily Skin Health Check** (`/quiz`) — the full 20-question quiz, one
  question per screen, with a **deterministic scoring engine**
  (`src/utils/quizScoring.js` — no AI/LLM involved in the math)
- **Reports** (`/reports`, `/reports/:id`) — gallery + detail viewer for
  AI Analysis, Quiz, and AI Conversation reports
- **Certificates** (`/certificate`, `/verify-certificate`) — the premium
  `CertificateCanvas` component (PNG/PDF download, share, verification)
- **Dashboard** (`/dashboard`) — score history charts, category
  breakdown, recent activity, quick actions
- **AI Models** (`/models`) — DermNet / HAM10000 / Burn Classification
  model info cards + explainable-AI prototype section
- **FAQ / Privacy / Disclaimer** pages
- **Theme system** — 5 visual themes × light/dark/system mode, persisted
  to `localStorage`, plus a reduced-motion preference
- Fully responsive, keyboard-accessible components with loading, empty,
  and error states throughout

## Project structure

```
src/
  components/
    ui/          Navbar, Footer, GlassCard, GradientButton, ThemeSwitcher, etc.
    skin/        AIOrb, ScanRing, SkinCellBackground (decorative visuals)
    certificate/ CertificateCanvas.jsx (premium certificate component)
  context/       ThemeContext, AuthContext, ReportsContext, ToastContext
  data/          quizQuestions.js
  pages/         One file per route (About, Analyzer, AIDoctor, Quiz, ...)
  services/      analyzerService, chatService, reportService (DEMO/MOCK — swap for real API calls)
  utils/         quizScoring.js (deterministic scoring engine)
```

## Connecting a real backend later

The `src/services/*.js` files are the seams where a real FastAPI backend
would plug in:

- `analyzerService.js` → `POST /predict`
- `chatService.js` → `POST /chat`
- `reportService.js` → `POST /api/reports/generate`, `GET /reports`, etc.

Swap the mock implementations for real `fetch`/`axios` calls without
touching any page or component code.

## Medical safety

This application provides AI-assisted, educational information only and
does not replace professional medical advice, diagnosis, or treatment.
All demo predictions are clearly labeled and never presented as a
confirmed diagnosis.
