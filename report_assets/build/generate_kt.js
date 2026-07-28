const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Footer, AlignmentType, LevelFormat, TabStopType, HeadingLevel, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak
} = require("docx");

const FIG = "C:/Users/Vicke/OneDrive/Desktop/Python/A_COH_10/Rishwanth/mediquick-ai/report_assets/figures/";
const OUT = "C:/Users/Vicke/OneDrive/Desktop/Python/A_COH_10/Rishwanth/mediquick-ai/docs/MediQuickAI_KnowledgeTransfer.docx";
const INK = "1F2937", BRAND = "0F766E", MUT = "6B7280";

const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const P = (t) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 150, line: 276 }, children: [new TextRun(t)] });
const center = (runs, opts = {}) => new Paragraph({ alignment: AlignmentType.CENTER, children: runs, ...opts });
const num = { config: [{ reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 620, hanging: 320 } } } }] },
  { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } }] }] };
const step = (t) => new Paragraph({ numbering: { reference: "steps", level: 0 }, spacing: { after: 80 }, children: [new TextRun(t)] });
const bullet = (t) => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 70 }, children: [new TextRun(t)] });

function figp(file, w, h, cap) {
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 },
      children: [new ImageRun({ type: "png", data: fs.readFileSync(FIG + file), transformation: { width: w, height: h }, altText: { title: cap, description: cap, name: cap } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 180 }, children: [new TextRun({ text: cap, italics: true, size: 18, color: MUT })] }),
  ];
}

const cb = { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" };
const borders = { top: cb, bottom: cb, left: cb, right: cb };
function cell(text, w, head) {
  return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 110, right: 110 },
    shading: head ? { fill: "0F766E", type: ShadingType.CLEAR, color: "auto" } : undefined, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text, bold: !!head, color: head ? "FFFFFF" : INK, size: 18 })] })] });
}
const table = (widths, rows) => new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
  rows: rows.map((r, i) => new TableRow({ tableHeader: i === 0, children: r.map((c, j) => cell(c, widths[j], i === 0)) })) });
const cap = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 50, after: 200 }, children: [new TextRun({ text: t, italics: true, size: 18, color: MUT })] });

const content = [
  center([new TextRun({ text: "MediQuick AI", bold: true, size: 40, color: BRAND })], { spacing: { before: 120, after: 30 } }),
  center([new TextRun({ text: "Knowledge-Transfer Document", size: 26, color: INK })], { spacing: { after: 20 } }),
  center([new TextRun({ text: "An onboarding guide to the completed multimodal medical triage assistant  ·  June 2026", size: 18, color: MUT })], { spacing: { after: 60 } }),
  center([new TextRun({ text: "Developer: Vignesh V   ·   Dissertation: Rishwanth [Last Name]   ·   BITS ZG628T", size: 18, color: MUT })], { spacing: { after: 240 } }),

  H1("1. What It Is and Why It Exists"),
  P("MediQuick AI is a web application that helps a person make sense of a new health symptom. The user describes what they feel in plain language — and, if useful, uploads a photo of something visible such as a rash or wound. The system replies with a structured assessment: what the symptom might be, how urgent it is, which kind of doctor to see, and a few clarifying questions."),
  P("The pain point it solves is uncertainty about urgency. When something feels wrong, the hardest question is not the exact diagnosis but “how seriously should I take this, and who should I see?” Web searches are noisy and often frightening, and seeing a doctor for every small concern is impractical. MediQuick AI gives calm, structured, first-line guidance. Importantly, it triages rather than diagnoses, and it shows a medical disclaimer on every answer."),

  H1("2. How It Works"),
  P("The application is built in clear layers. A request flows from the browser to the backend API, through a set of focused services, to the AI model and the database, and back. The table below lists each component; every one of them is finished, tested, and delivered."),
  table([2600, 4626, 1800], [
    ["Component", "What it does", "Status"],
    ["FastAPI app (main.py)", "Entry point, CORS, auth, starts the database", "Done"],
    ["Security (security.py)", "Password hashing + JWT issue / verify", "Done"],
    ["NIM client (nvidia_nim.py)", "Calls NVIDIA NIM for text and image inference", "Done"],
    ["Prompt engine (prompt_engine.py)", "System prompt; gather→conclude; JSON schema", "Done"],
    ["Specialists (specialists.py)", "10 agent personas + routing / handoff", "Done"],
    ["Context manager (context_manager.py)", "Assembles multi-turn history for the model", "Done"],
    ["Image pipeline (image_pipeline.py)", "Validates, resizes, and base64-encodes photos", "Done"],
    ["Routers (auth/chat/sessions/upload/dashboard)", "REST endpoints the front end calls", "Done"],
    ["Database (SQLite + SQLAlchemy)", "Stores users, sessions, and messages", "Done"],
    ["React front end", "Login, chat, triage card, sidebar, dashboard", "Done"],
    ["Test suite (backend/tests/)", "39 automated pytest tests, isolated DB, mocked NIM client", "Done"],
    ["Evaluation harness", "30 scenarios, accuracy report", "Done — 100%"],
  ]),
  cap("Each component is small and independently testable. All components above are complete and were validated live."),

  H1("3. Architecture at a Glance"),
  P("Figure 1 shows how the pieces fit together. All components shown in green are complete and were validated live."),
  ...figp("fig_architecture.png", 590, 405, "Figure 1: MediQuick AI system architecture (green = complete and validated)."),

  H1("4. How It Handles Symptoms, Photos, and Summaries"),
  H2("4.1 Text symptoms"),
  P("When the user types a symptom, the backend combines the active specialist’s system prompt, the earlier turns in the session, and the new message, then asks the model for a structured assessment. The assistant first asks a few focused follow-up questions; once it has enough detail it concludes, and the interface renders a colour-coded triage card. If a clear specialty emerges, the session is handed from the General Physician to that specialist agent, carrying the full context. Figure 2 shows a real consultation."),
  P("The system prompt is also profile-aware: the age, sex, height, weight, allergies, and known conditions a user provides at registration are fed into every specialist's prompt. This information was always collected but sat unused earlier in the project — it now genuinely shapes the assessment."),
  ...figp("fig_app_chat.png", 590, 369, "Figure 2: A real consultation — the assistant gathers detail, hands off to the Eye Specialist, and concludes with a triage card."),
  H2("4.2 Photographs"),
  P("If a photo is attached, it is first sent to the /upload endpoint, which checks the file type and size, shrinks it to a sensible resolution, and converts it to a compact form the model can read — all in memory, so the image is never saved to disk. The photo is then analysed together with the text in a single multimodal request to the Vision-Language Model."),
  H2("4.3 The dashboard"),
  P("Every concluded consultation is summarised on a dashboard as a colour-coded card showing the possible directions, the urgency tier, and the recommended specialist — with no medication content. Figure 3 shows the dashboard."),
  ...figp("fig_app_dashboard.png", 590, 369, "Figure 3: The health dashboard summarising concluded consultations by urgency and specialist."),
  H2("4.4 Mobile-responsive interface"),
  P("Below the medium (\"md\") screen-width breakpoint, the sidebar becomes an off-canvas drawer: a hamburger button opens it over a dimmed backdrop, and it closes on Escape or when a session is selected. This was verified at a 375px viewport width, a common phone size."),
  H2("4.5 A note on response time"),
  P("Vision responses genuinely take 14–42 seconds, because the request goes to a large multimodal model hosted by NVIDIA NIM. This is expected behaviour, not a fault — if a photo-based consultation feels slow, it is working as intended, not stuck."),

  H1("5. Project and File Structure"),
  P("The repository separates the backend from the front end, with dedicated folders for tests, evaluation, and the report deliverables. The most important paths are listed below."),
  table([3300, 5726], [
    ["Path", "Purpose"],
    ["backend/main.py, config.py, database.py", "FastAPI app entry point, settings, and DB session setup"],
    ["backend/models.py", "User, Session, and Message database models"],
    ["backend/services/security.py", "Password hashing + JWT issue / verify"],
    ["backend/services/nvidia_nim.py", "NVIDIA NIM API client (text + vision)"],
    ["backend/services/prompt_engine.py", "System prompt, gather→conclude, JSON parser"],
    ["backend/services/specialists.py", "10 specialist personas + routing"],
    ["backend/services/context_manager.py", "Assembles multi-turn conversation history for the model"],
    ["backend/services/image_pipeline.py", "Image validation and preprocessing"],
    ["backend/routers/", "auth, chat, sessions, upload, dashboard endpoints"],
    ["backend/tests/", "The 39-test automated pytest suite"],
    ["backend/evaluation/", "scenarios.json, run_eval.py, eval_report.csv"],
    ["frontend/src/pages/", "Login, Register, Chat, Dashboard"],
    ["frontend/src/components/", "Sidebar, TriageCard, ImageUpload, banner"],
    ["frontend/src/auth/", "Auth context and route guards"],
    ["frontend/src/api/client.js", "Axios client with JWT handling"],
    ["docs/", "The three deliverables; docs/archive/ holds the superseded mid-semester report"],
    ["report_assets/", "build/ (these document generators), figures/, mockups/"],
    ["setup.bat / run.bat", "One-click installer and launcher for Windows"],
  ]),
  cap("Table: key files and folders in the MediQuick AI repository."),

  H1("6. Current Status — 100% Complete"),
  P("The project is finished. Every planned phase — backend, authentication, specialist routing, the React interface, the dashboard, testing, and evaluation — is built, tested, and was verified against the running application. Nothing is left pending; the sections below summarise what was delivered."),
  table([2400, 6626], [
    ["Area", "What was delivered"],
    ["Core application", "FastAPI backend + SQLite, JWT auth, NVIDIA NIM client (text + vision), prompt engine, 10 specialist agents with routing/handoff, React UI (chat, triage card, sidebar, dashboard)"],
    ["Automated tests", "39 pytest tests across security, prompt engine, specialists, image pipeline, and the API — all passing, ~1 second runtime, isolated from the real database and network"],
    ["Evaluation", "30 curated scenarios — 100% urgency-classification accuracy, zero unsafe under-triage"],
    ["Live end-to-end verification", "29 of 29 functional checks passed against the running app, covering auth, routing, images, sessions, dashboard, and cross-user isolation"],
    ["New features", "Profile-aware triage, mobile-responsive off-canvas sidebar, loading/empty/error-state polish"],
    ["Defects fixed", "JSON-contract breakdown on off-topic images, hardcoded JWT secret fallback, tight vision timeout, a dead configuration value"],
    ["Deployment hardening", "Python version guard, Dropbox/OneDrive warning, pip-upgrade fix, network retries, damaged-venv detection"],
  ]),
  cap("Delivery summary — every area above is complete, tested, and verified."),

  H1("7. How to Run It"),
  P("The easiest path is the one-click installer: run setup.bat from the project root, then run.bat to start both the backend and the front end. The manual steps below are useful when something needs a closer look."),
  step("In the backend folder, create a virtual environment and install dependencies: pip install -r requirements.txt"),
  step("Create a file named .env (copy from .env.example) and set NVIDIA_NIM_API_KEY to your NVIDIA NIM key from build.nvidia.com. setup.bat generates a unique JWT_SECRET automatically, but NVIDIA_NIM_API_KEY must be set by hand — the app will not work without it."),
  step("Start the API: uvicorn main:app --port 8001  (then open http://localhost:8001/docs to try the endpoints)."),
  step("In the frontend folder, run npm install, then npm run dev, and open http://localhost:5173."),
  step("Register an account, then describe a symptom to begin a consultation; concluded consultations appear on the Dashboard."),

  H1("8. How to Run the Tests"),
  P("The backend ships with 39 automated pytest tests covering security, the prompt engine, specialist routing, the image pipeline, and the API. They run against an isolated temporary database and mock the NVIDIA NIM client, so running them never touches the real database or the network, and never spends API credits."),
  step("From the backend folder, run: .venv\\Scripts\\python.exe -m pytest tests/ -q"),
  step("All 39 tests should pass in about a second. A quick way to sanity-check a fresh setup before touching any code."),
  table([2600, 2000, 4326], [
    ["Test file", "Tests", "Covers"],
    ["test_security.py", "7", "Password hashing, JWT issue and verification"],
    ["test_prompt_engine.py", "10", "System prompt assembly, gather→conclude, JSON parsing"],
    ["test_specialists.py", "5", "Specialist personas and routing/handoff logic"],
    ["test_image_pipeline.py", "6", "Image validation, resizing, base64 encoding"],
    ["test_api.py", "11", "End-to-end API behaviour across the routers"],
  ]),
  cap("The 39-test breakdown by file, all in backend/tests/."),

  H1("9. Troubleshooting"),
  P("These are the installation problems a new developer is most likely to hit, and what actually fixes each one."),
  bullet("Python 3.14 or newer is rejected with an actionable message. One dependency has no prebuilt binary for that version, so pip tries to build it from source and fails. Install Python 3.10–3.13 instead."),
  bullet("The project sits inside Dropbox, OneDrive, or Google Drive. These services lock files mid-install and can corrupt the virtual environment (Windows error 32). Move the project to a plain local folder, e.g. C:\\MediQuickAI, and re-run setup.bat."),
  bullet("Installs fail or hang on a slow network. setup.bat retries automatically; if it still fails, re-run it once your connection is stable."),
  bullet("A damaged or half-installed virtual environment. Delete backend\\.venv entirely and re-run setup.bat to rebuild it from scratch."),
  bullet("The app starts but every request fails. Check that NVIDIA_NIM_API_KEY is set in backend\\.env — it is the one setting the installer cannot fill in for you."),
  bullet("A photo-based consultation feels slow. NVIDIA NIM vision responses genuinely take 14–42 seconds; this is expected, not a hang."),

  H1("10. Key Terms Glossary"),
  table([2400, 6626], [
    ["Term", "Meaning"],
    ["Triage", "Estimating how urgent a condition is and routing to the right care — not diagnosing."],
    ["VLM", "Vision-Language Model: an AI that understands text and images together."],
    ["NVIDIA NIM", "A hosted platform that serves models (here, Llama 3.2 90B Vision) over an API."],
    ["FastAPI", "The Python web framework used to build the backend."],
    ["SQLAlchemy", "The library that maps Python objects to SQLite database tables."],
    ["Pillow", "The Python imaging library used to validate and resize photos."],
    ["Base64", "A text encoding for binary data, used to send images inside a JSON request."],
    ["Triage schema", "The fixed JSON shape every assessment must follow."],
    ["Urgency tier", "One of self_care, consult_doctor, or seek_emergency."],
    ["Emergency override", "A safety rule that always escalates danger signs to emergency care."],
    ["Multimodal", "Using more than one input type at once — here, text plus an image."],
    ["Specialist routing", "Handing a session from the General Physician to the most relevant expert agent."],
    ["JWT", "JSON Web Token — the signed token that keeps a user logged in securely."],
    ["pytest", "The Python testing framework used to write and run the 39 automated backend tests."],
    ["Mocking", "Replacing a real dependency (here, the NVIDIA NIM client) with a fake stand-in during tests, so tests run fast and never touch the network."],
    ["Off-canvas drawer", "A sidebar that normally lives beside the content but slides in over it on small screens, closing when you tap away."],
  ]),
  cap("Glossary of the main technical terms used in the project."),

  H1("11. Next Steps"),
  P("The project is complete for its current scope. The items below are genuine future directions, not unfinished work."),
  bullet("A clinician-reviewed validation study, comparing triage outputs against real clinical judgement."),
  bullet("A larger evaluation set, beyond the current 30 scenarios, for stronger statistical confidence."),
  bullet("Integration with electronic health record (EHR) systems for richer patient context."),
  bullet("Multilingual support, extending triage and the interface beyond English."),
  bullet("On-device inference, to explore keeping sensitive health data off the network entirely."),
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 22, color: INK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, color: BRAND, font: "Calibri" }, paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: INK, font: "Calibri" }, paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 1 } },
    ],
  },
  numbering: num,
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MediQuick AI — Knowledge-Transfer Document    |    Page ", size: 16, color: MUT }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUT })] })] }) },
    children: content,
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(OUT, buf); console.log("WROTE " + OUT + " (" + buf.length + " bytes)"); });
