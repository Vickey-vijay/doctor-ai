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
- [x] Module 12 — Evaluation Module (30 scenarios → 30/30 = 100%, zero unsafe under-triage)
- [x] Module 13 — Polish, Error Handling & Final QA (loading skeletons, empty states, retry on error)
- [x] Module 14 — Automated Test Suite (39 pytest tests, NIM mocked, isolated DB)
- [x] Module 15 — Mobile-Responsive Pass (off-canvas sidebar drawer below `md`, verified at 375px)
- [x] Module 16 — Profile-Aware Triage (age/sex/height/weight/allergies/conditions → system prompt)

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
**PROJECT COMPLETE ✅ (100%) — built, tested, verified live, and delivered.**
Backend (auth + triage + routing + dashboard) on :8001; React frontend on :5173.

Three levels of assurance, all green:
- **39 pytest tests** in `backend/tests/` — all passing (~1s). NIM mocked, temp DB, no network.
  Run: `cd backend && .venv\Scripts\python.exe -m pytest tests/ -q`
- **30-scenario evaluation** — 30/30 = 100% urgency accuracy, ZERO unsafe under-triage.
- **29/29 live end-to-end checks** against the running app (auth, 401 guards, emergency override,
  specialist routing, image upload + vision, sessions CRUD, dashboard, cross-user isolation).

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

## Final Deliverables (COMPLETE ✅) — all in `docs/`
- `docs/MediQuickAI_FinalReport.docx` — final semester report (BITS ZG628T format)
- `docs/MediQuickAI_KnowledgeTransfer.docx` — developer onboarding guide
- `docs/MediQuickAI_Presentation.pptx` — dark/teal deck
- `docs/archive/` — superseded mid-semester report, kept for reference
Regenerate any of them with `node report_assets/build/generate_{report,kt,pptx}.js`.
**Placeholders still to fill by the student (bracketed in all 3 docs):** [Last Name], [Student ID],
[Programme Name], [Supervisor Name], [Organization Name, Location].

## Defects Found & Fixed (Session 3)
1. **JSON-contract breakdown on off-topic images** — a logo upload made the model abandon JSON and
   reply in prose ("I'm a text-based AI assistant"), which the fallback surfaced verbatim. Vision was
   never broken. Fixed: strengthened prompt (model told it HAS vision, must stay in JSON even when
   declining) + one strict "reformat as JSON" retry in `routers/chat.py`. Re-verified.
2. **Shared JWT secret (security)** — `.env.example` shipped with no `JWT_SECRET`, so every install
   fell back to the hardcoded public default → tokens forgeable across deployments. Fixed:
   `setup.bat` now generates a unique random secret per install (idempotent).
3. **Timeouts too tight** — measured NIM vision latency is 14–42s (spikes past 60s). Raised to
   100s backend / 110s client.
4. **Dead config** — removed unused `eval_backend_url` (pointed at the wrong port).

## Deployment / Client Install Notes
`setup.bat` (one-time) then `run.bat`. Hardened after real client-machine failures:
- **Rejects Python 3.14+** — pydantic-core has no wheels for it, so pip source-builds and fails.
  Requires Python 3.10–3.13 (3.12 recommended).
- **Warns on Dropbox/OneDrive/Google Drive** — sync clients lock files mid-install and corrupt the
  venv (WinError 32). Fix: move the project to a plain local folder, e.g. `C:\MediQuickAI`.
- No longer upgrades pip in place (that caused the corruption); retries on slow networks; detects
  and rebuilds a damaged venv; auto-generates JWT_SECRET; reminds if NVIDIA_NIM_API_KEY is unset.

## Session 4 — Delivery Hardening
1. **Batch-file parser corruption (root cause of the client's failures)** — Unicode box-drawing
   characters (U+2500) in REM comments made cmd.exe lose track of line boundaries mid-run,
   executing comment fragments as commands while still printing "Setup complete". Both .bat files
   are now pure ASCII, and `.gitattributes` pins `*.bat` to `eol=crlf` so clones AND GitHub ZIP
   downloads get correct line endings.
2. **Model failover + circuit breaker** — NVIDIA's hosted 90B vision model periodically stops
   responding (verified: 75s timeout while 11B answered in 0.8s on the same key). `nvidia_nim.py`
   now fails over to `NVIDIA_NIM_FALLBACK_MODEL`, and remembers the primary is down for 5 minutes
   so only the first message pays the timeout (measured 73s -> 25s -> 12.6s).
3. **Deterministic emergency safety net** (`services/red_flags.py`) — the fallback model did NOT
   apply the emergency override (chest pain came back as `consult_doctor`/`gathering`). Red flags
   are now matched in plain Python and force `seek_emergency`/`concluded` regardless of the model.
   Validated: 11/11 evaluation emergencies caught, 0/19 false escalations, negation-aware
   ("no chest pain" does not fire).
4. **Flaky test fixed** — `test_decode_access_token_tampered_returns_none` corrupted the JWT's last
   base64 character, which only carries padding bits, so ~7% of runs (22/300 measured) produced an
   equivalent signature and failed. Now corrupts an early signature character: 0/300 failures.
5. `run.bat` now checks `.venv`/`.env`/`node_modules` separately and warns if the API key is still
   the placeholder. Test count: **64 passing**.

## Known UI Gaps (backend works, no UI entry point)
- **Session rename** — `POST /sessions/{id}/rename` works; no UI control calls it.
- **Profile view/edit** — `PUT /auth/profile` works; there is no screen to edit the health profile
  after registration. Since the profile now feeds the triage prompt, a mistyped age/allergy cannot
  be corrected from the UI.

## Known Issues
None outstanding. Note: NIM vision responses legitimately take 14–42s — slowness is expected, not a
fault. Free-tier NVIDIA NIM also throttles under rapid repeated calls.

## Repo
GitHub: https://github.com/Vickey-vijay/doctor-ai (branch `main`)
