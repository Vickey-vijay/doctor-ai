"""FastAPI application entry point for MediQuick AI."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_tables
from routers import auth, chat, sessions, upload, dashboard

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise resources on startup; clean up on shutdown."""
    create_tables()
    logger.info("MediQuick AI backend started. SQLite tables initialised.")
    yield
    logger.info("MediQuick AI backend shutting down.")


# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="MediQuick AI",
    description="Advanced multimodal medical triage assistant — symptom chat + photo analysis",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Vite dev server on localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(sessions.router)
app.include_router(upload.router)
app.include_router(dashboard.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
async def health_check() -> dict:
    """Return the health status of the API."""
    return {"status": "ok", "service": "MediQuick AI", "version": "1.0.0"}
