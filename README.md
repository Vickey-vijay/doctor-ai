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
- [Python 3.11+](https://www.python.org/downloads/) (tick "Add Python to PATH" during install)
- [Node.js LTS](https://nodejs.org/)

## What's Inside

| Folder | Purpose |
|---|---|
| `backend/` | FastAPI server — auth, chat/triage engine, specialist routing, dashboard API |
| `frontend/` | React + Vite + Tailwind CSS single-page app |
| `backend/evaluation/` | 30-scenario evaluation harness (100% accuracy on urgency classification) |
| `report_assets/` | Source files for the project report, KT document, and presentation |

## Architecture

React (chat UI, triage cards, dashboard) → FastAPI (JWT auth, REST endpoints) → service layer (prompt engine, specialist router, image pipeline) → NVIDIA NIM (Meta Llama 3.2 90B Vision) + SQLite.

## Documentation

- `MediQuickAI_MidSem_Report.docx` — full project report
- `MediQuickAI_KnowledgeTransfer.docx` — developer onboarding guide
- `MediQuickAI_Presentation.pptx` — slide deck

## Safety Note

This tool provides preliminary triage guidance only. It is not a medical diagnosis and cannot replace a qualified healthcare professional. In an emergency, call your local emergency number immediately.
