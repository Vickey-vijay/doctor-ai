# MediQuick AI — Project Memory

## What This Is
Advanced multimodal medical triage web application. Users describe symptoms in chat and optionally upload photos.
NVIDIA NIM Llama 3.2 Vision VLM returns structured JSON triage: conditions, urgency tier, specialist, follow-ups.
This is a BITS Pilani dissertation project for client Rishwanth, built by Vignesh V.

## Owner
Vignesh V (developer) — Local deployment on Rishwanth's machine first.
Academic project: no live deployment, no regulatory requirements.

## Stack
| Layer | Choice |
|---|---|
| Backend | Python 3.11 + FastAPI + Uvicorn |
| AI API | NVIDIA NIM — meta/llama-3.2-11b-vision-instruct |
| Database | SQLite + SQLAlchemy |
| Image | Pillow |
| Frontend | React + Vite + Tailwind CSS |
| HTTP | Axios |

## Folder Structure
```
mediquick-ai/
├── backend/                  # FastAPI backend
│   ├── main.py               # App entry + CORS
│   ├── config.py             # Env vars
│   ├── database.py           # SQLite init
│   ├── models.py             # Session + Message ORM models
│   ├── routers/              # chat.py, sessions.py, upload.py
│   ├── services/             # nvidia_nim.py, prompt_engine.py, context_manager.py, image_pipeline.py
│   ├── evaluation/           # scenarios.json, run_eval.py, eval_report.csv
│   └── requirements.txt
├── frontend/                 # React + Vite
│   └── src/
│       ├── components/       # ChatWindow, TriageCard, UrgencyBadge, ImageUpload, SessionSidebar, Disclaimer
│       ├── hooks/            # useChat.js, useSession.js
│       └── api/client.js
└── CLAUDE.md
```

## Environment Variables (.env in backend/)
```
NVIDIA_NIM_API_KEY=⚠️ ASK USER
DATABASE_URL=sqlite:///./mediquick.db
MAX_IMAGE_SIZE_MB=5
MAX_CONTEXT_TURNS=10
LOG_LEVEL=INFO
EVAL_BACKEND_URL=http://localhost:8000
```

## Module Checklist
- [x] Module 1 — Project Scaffold & Environment
- [x] Module 2 — NVIDIA NIM API Client
- [x] Module 3 — System Prompt & JSON Schema Enforcer
- [x] Module 4 — Multi-Turn Context Manager
- [x] Module 5 — Image Upload & Preprocessing Pipeline
- [x] Module 6 — FastAPI REST Endpoints
- [x] Module 7 — React Chat Interface (Chat.jsx + MessageBubble + composer)
- [x] Module 8 — React Triage Output Display (TriageCard, colour-coded)
- [x] Module 9 — React Image Upload Component (ImageUpload → /upload)
- [x] Module 10 — React Session Sidebar & History (Sidebar, per-user)
- [x] Module 11 — Safety & Disclaimer System (DisclaimerBanner + triage-not-diagnose prompt)
- [ ] Module 12 — Evaluation Module (30 scenarios + CSV)  ← only remaining build item
- [x] Module 13 — Polish, Error Handling & Final QA (error toasts, loading states, empty states)

## Scope Expansion (Session 2 — agreed with client 2026-06-21)
Project grew beyond the original abstract into a full product. Added:
- [x] Authentication — register / login / JWT (PyJWT + passlib pbkdf2_sha256), `users` table
- [x] User health profile (age, sex, height, weight, allergies, conditions)
- [x] Per-user sessions (sessions.user_id), login loads past consultations
- [x] Conversational gathering→concluding flow (doctor-style; asks before concluding)
- [x] Multi-specialist agent routing/handoff (services/specialists.py — 10 personas;
      General Physician → Dermatology/Cardiology/Ortho/Mental Health/ENT/Eye/Neuro/etc.)
- [x] Dashboard (GET /dashboard) — concluded-session summary cards + stats. NO remedies/meds
      (client chose "No remedies feature" — keeps consistency with abstract's "no prescription").
Backend runs on :8001 (port 8000 is a different project). Frontend (React+Vite+Tailwind) on :5173.
Demo account: rishwanth@test.com / test1234. Verified end-to-end in-browser 2026-06-21.

## Urgency Color System (non-negotiable)
- self_care → green (#16a34a) — "✓ Manageable at Home"
- consult_doctor → amber (#d97706) — "⚠ See a Doctor Soon"
- seek_emergency → red (#dc2626) — "🚨 Seek Emergency Care"

## Triage JSON Schema (extended in Session 2)
```json
{
  "reply": "warm, doctor-style conversational message shown in the chat bubble",
  "assessment_status": "gathering | concluded",
  "possible_conditions": ["...", "..."],
  "urgency_tier": "self_care | consult_doctor | seek_emergency",
  "urgency_reason": "...",
  "specialist_type": "...",
  "follow_up_questions": ["...", "..."],
  "disclaimer": "This is a preliminary triage assessment..."
}
```
`reply` + `assessment_status` added so the AI can converse (gather) before it concludes; the
TriageCard only renders when `assessment_status == "concluded"`. Routing maps `specialist_type`
→ canonical specialty (services/specialists.py) to hand the session to a specialist agent.

## Current Build Status
**Sessions 1–2 COMPLETE ✅ — Full-stack app live and demonstrated in-browser (~88%).**
Backend (auth + triage + routing + dashboard) on :8001; React frontend on :5173.
Login → conversational triage → specialist handoff → triage card → dashboard all verified live.
**Only remaining build item: Module 12 — Evaluation (30 scenarios → accuracy CSV).**
NEXT (client checkpoint): regenerate the 3 deliverables (Mid-Sem Report, KT, PPT) to match the
expanded app — the existing docs in repo root describe the ~46% backend-only state and are now STALE.

## Model Note
`NVIDIA_NIM_MODEL` is configurable in `.env`. Currently set to **meta/llama-3.2-90b-vision-instruct**
(per the developer's tested snippet — more capable for medical reasoning). One-line switch back to
`meta/llama-3.2-11b-vision-instruct` if desired.

## Session Notes
- Session 1: scaffold + 4 subagent YAMLs + CLAUDE.md created.
- Modules 1–6 built: FastAPI app, SQLite/SQLAlchemy models, NIM async client (text+vision),
  prompt engine (JSON schema + fallback parser), context manager, Pillow image pipeline,
  and all REST endpoints (/chat, /upload, /sessions CRUD).
- Deps installed in `backend/.venv`; app imports clean; all routes registered.
- **Live validation against NVIDIA NIM (real responses), all three urgency tiers correct:**
  - consult_doctor → "red circular rash" → Ringworm/Contact dermatitis/Eczema → Dermatologist
  - seek_emergency → "crushing chest pain + sweating" → Acute Coronary Syndrome → Emergency Medicine
    (emergency override confirmed working)
  - self_care → "tiny paper cut" → minor cut → General Physician
- Next session: Modules 7–9 (React chat UI + triage card + image upload).

## Mid-Semester Deliverables (COMPLETE ✅)
Three academic docs produced in BITS ZG628T format (matched to sample in Rishwanth/Downloads),
delivered in repo root as both source + PDF:
- MediQuickAI_MidSem_Report.docx / .pdf — 11 pages: title page (BITS logo), abstract + signature
  block, TOC, List of Figures/Tables, 9 sections, 5 figures, 3 tables.
- MediQuickAI_KnowledgeTransfer.docx / .pdf — onboarding guide, 9 sections.
- MediQuickAI_Presentation.pptx / .pdf — 10-slide dark/teal deck, visually QA'd.
Author = Rishwanth (student), Vignesh V (developer). Honest framing: ~46% (backend done).
Figures in report_assets/figures/ (architecture diagram + 4 browser-rendered UI/Swagger shots).
Build scripts in report_assets/build/ (docx-js + pptxgenjs). BITS logo extracted from sample PDF.
**Placeholders still to fill (bracketed in all 3 docs):** [Last Name], [Student ID],
[Programme Name], [Supervisor Name], [Organization Name, Location]. Month used: June 2026.

## Known Issues
(none — backend validated against live NIM)

## Deployment Plan
Local: uvicorn (port 8000) + Vite dev server (port 5173) on Rishwanth's Windows machine.
Demo: Run both servers, open localhost:5173 in browser.
