# MediQuick AI

An advanced multimodal medical **triage** assistant. Describe symptoms in a natural chat — optionally attach a photo of a visible condition — and get a structured, urgency-ranked assessment: possible directions, urgency tier (self-care / consult a doctor / seek emergency care), a recommended specialist, and follow-up questions.

MediQuick AI **triages, it does not diagnose**, and every response carries a medical disclaimer.

## Quick Start (Windows)

1. **Download and extract** this repository as a ZIP.
2. **Double-click `setup.bat`** — installs everything (Python + Node dependencies) automatically.
   - When prompted, open `backend\.env` and set `NVIDIA_NIM_API_KEY` (get a free key at [build.nvidia.com](https://build.nvidia.com/)).
3. **Double-click `run.bat`** — starts both the backend and frontend.
4. Open **http://localhost:5173** in your browser, register an account, and start a consultation.

### Requirements
- [Python 3.12](https://www.python.org/downloads/) — tick "Add python.exe to PATH" during install.
  Python **3.14+ is not supported yet** (some dependencies have no prebuilt installer for it).
- [Node.js LTS](https://nodejs.org/)

> **Tip:** extract the project to a plain local folder such as `C:\MediQuickAI`. Running setup
> from inside Dropbox / OneDrive / Google Drive can fail, because those apps lock files while
> Python is still installing. `setup.bat` will warn you if it detects this.

## What's Inside

| Folder | Purpose |
|---|---|
| `backend/` | FastAPI server — auth, chat/triage engine, specialist routing, dashboard API |
| `frontend/` | React + Vite + Tailwind CSS single-page app |
| `backend/evaluation/` | 30-scenario evaluation harness (100% accuracy on urgency classification) |
| `backend/tests/` | Automated pytest suite for the backend services |
| `docs/` | Final report, presentation, and knowledge-transfer document |
| `report_assets/` | Source generators, figures, and mockups used to build the documents |

## Running the Tests

```
cd backend
.venv\Scripts\python.exe -m pytest tests/ -q
```

## Architecture

React (chat UI, triage cards, dashboard) → FastAPI (JWT auth, REST endpoints) → service layer (prompt engine, specialist router, image pipeline) → NVIDIA NIM (Meta Llama 3.2 90B Vision) + SQLite.

## Documentation

All deliverables live in `docs/`:

- `docs/MediQuickAI_FinalReport.docx` — full project report
- `docs/MediQuickAI_KnowledgeTransfer.docx` — developer onboarding guide
- `docs/MediQuickAI_Presentation.pptx` — slide deck
- `docs/archive/` — superseded mid-semester report, kept for reference

## Safety Note

This tool provides preliminary triage guidance only. It is not a medical diagnosis and cannot replace a qualified healthcare professional. In an emergency, call your local emergency number immediately.
