const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, LevelFormat, TabStopType, TabStopPosition,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageNumber, PageBreak
} = require("docx");

const FIG = "C:/Users/Vicke/OneDrive/Desktop/Python/A_COH_10/Rishwanth/mediquick-ai/report_assets/figures/";
const OUT = "C:/Users/Vicke/OneDrive/Desktop/Python/A_COH_10/Rishwanth/mediquick-ai/MediQuickAI_MidSem_Report.docx";

const INK = "1F2937", BRAND = "0F766E", MUT = "6B7280";
const CONTENT_W = 9026; // A4, 1" margins

// ---------- helpers ----------
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const P = (t) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 160, line: 276 },
  children: [new TextRun(t)],
});
const center = (runs, opts = {}) => new Paragraph({ alignment: AlignmentType.CENTER, children: runs, ...opts });

function fig(file, w, h, cap) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [new ImageRun({
        type: file.endsWith(".jpg") ? "jpg" : "png",
        data: fs.readFileSync(FIG + file),
        transformation: { width: w, height: h },
        altText: { title: cap, description: cap, name: cap },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: cap, italics: true, size: 18, color: MUT })],
    }),
  ];
}

const listItem = (label, title) => new Paragraph({
  spacing: { after: 60 },
  tabStops: [{ type: TabStopType.LEFT, position: 1500 }],
  children: [new TextRun({ text: label, bold: true }), new TextRun({ text: "\t" + title })],
});

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
function cell(text, w, { head = false, bold = false } = {}) {
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    margins: { top: 70, bottom: 70, left: 120, right: 120 },
    shading: head ? { fill: "0F766E", type: ShadingType.CLEAR, color: "auto" } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text, bold: head || bold, color: head ? "FFFFFF" : INK, size: 19 })] })],
  });
}
function table(widths, rows) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: i === 0,
      children: r.map((c, j) => cell(c, widths[j], { head: i === 0 })),
    })),
  });
}
const cap = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 220 },
  children: [new TextRun({ text: t, italics: true, size: 18, color: MUT })] });
const spacer = (n = 1) => new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: " ".repeat(1), size: n })] });

// ---------- title page ----------
const titlePage = [
  center([new ImageRun({ type: "jpg", data: fs.readFileSync(FIG + "logo_candidates/p0_Image13.jpg"),
    transformation: { width: 96, height: 90 }, altText: { title: "BITS", description: "BITS Pilani logo", name: "BITS" } })],
    { spacing: { before: 200, after: 120 } }),
  center([new TextRun({ text: "MEDIQUICK AI — AN ADVANCED MULTIMODAL", bold: true, size: 30, color: INK })], { spacing: { after: 40 } }),
  center([new TextRun({ text: "MEDICAL TRIAGE ASSISTANT", bold: true, size: 30, color: INK })], { spacing: { after: 220 } }),
  center([new TextRun({ text: "BITS ZG628T: Dissertation", size: 26, color: INK })], { spacing: { after: 40 } }),
  center([new TextRun({ text: "Mid-Semester Progress Report", italics: true, size: 24, color: BRAND })], { spacing: { after: 260 } }),
  center([new TextRun({ text: "by", size: 24 })], { spacing: { after: 120 } }),
  center([new TextRun({ text: "Rishwanth [Last Name]", bold: true, size: 26 })], { spacing: { after: 30 } }),
  center([new TextRun({ text: "[Student ID]", size: 22, color: MUT })], { spacing: { after: 220 } }),
  center([new TextRun({ text: "Dissertation work carried out at", size: 22 })], { spacing: { after: 60 } }),
  center([new TextRun({ text: "[Organization Name, Location]", size: 22, color: MUT })], { spacing: { after: 200 } }),
  center([new TextRun({ text: "Submitted in partial fulfilment of [Programme Name]", size: 22 })], { spacing: { after: 30 } }),
  center([new TextRun({ text: "degree programme", size: 22 })], { spacing: { after: 200 } }),
  center([new TextRun({ text: "Under the Supervision of", size: 22 })], { spacing: { after: 60 } }),
  center([new TextRun({ text: "[Supervisor Name]", bold: true, size: 22 })], { spacing: { after: 30 } }),
  center([new TextRun({ text: "[Organization Name, Location]", size: 22, color: MUT })], { spacing: { after: 300 } }),
  center([new TextRun({ text: "BIRLA INSTITUTE OF TECHNOLOGY & SCIENCE", bold: true, size: 24 })], { spacing: { after: 30 } }),
  center([new TextRun({ text: "PILANI (RAJASTHAN)", bold: true, size: 24 })], { spacing: { after: 30 } }),
  center([new TextRun({ text: "June 2026", size: 22 })], {}),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- abstract ----------
const abstract = [
  H1("Abstract"),
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 160, line: 276 }, children: [new TextRun(
    "MediQuick AI is an advanced multimodal medical triage assistant that lets a user describe symptoms in a natural, multi-turn chat and optionally upload a photograph of a visible condition such as a rash or wound. A hosted Vision-Language Model — Meta Llama 3.2 (90B) Vision served through the NVIDIA NIM platform — interprets the text and image together and returns a strictly structured triage assessment: a short list of possible conditions, an urgency tier (self-care, consult a doctor, or seek emergency care), the reasoning behind that tier, a recommended medical specialist, and clarifying follow-up questions. Crucially, the system triages rather than diagnoses, and every response carries a clinical disclaimer. This report documents the mid-semester milestone, at which a complete, working full-stack application has been built and validated end-to-end. The Python FastAPI backend — JWT authentication and user profiles, the NVIDIA NIM client, prompt-engineering with JSON-schema enforcement, a multi-turn context manager, a privacy-preserving image pipeline, a specialist-agent routing layer, and all REST endpoints — and a React with Tailwind CSS front end — registration and login, a conversational chat interface, colour-coded triage cards, image upload, a session sidebar, and a summary dashboard — are implemented and were exercised live in the browser. The assistant conducts a doctor-style conversation, gathering details before it concludes, and routes each case from a General Physician to the most appropriate specialist agent (for example Dermatology or Cardiology) while carrying the full prior context across the handoff. A structured evaluation across thirty curated scenarios spanning dermatology, general medicine, and minor injury achieved 100% urgency-classification accuracy with zero unsafe under-triage. The project is approximately 88% complete; only final error-handling polish and developer handover documentation remain.")] }),
  spacer(),
  new Paragraph({ spacing: { before: 200, after: 80 }, tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    children: [new TextRun({ text: "Signature of the Student", bold: true }), new TextRun({ text: "\tSignature of the Supervisor", bold: true })] }),
  new Paragraph({ spacing: { before: 220, after: 80 }, tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    children: [new TextRun("Name:  Rishwanth [Last Name]"), new TextRun("\tName:  [Supervisor Name]")] }),
  new Paragraph({ spacing: { after: 80 }, tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    children: [new TextRun("Date:"), new TextRun("\tDate:")] }),
  new Paragraph({ spacing: { after: 80 }, tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    children: [new TextRun("Place:"), new TextRun("\tPlace:")] }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- TOC + lists ----------
const toc = [
  H1("Table of Contents"),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] }),
  H1("List of Figures"),
  listItem("Figure 1", "System architecture of MediQuick AI"),
  listItem("Figure 2", "Conversational triage interface with specialist handoff and triage card"),
  listItem("Figure 3", "Health dashboard — summarised resolutions across urgency tiers"),
  listItem("Figure 4", "Live FastAPI interactive API documentation (Swagger UI)"),
  new Paragraph({ spacing: { before: 220 }, children: [] }),
  H1("List of Tables"),
  listItem("Table 1", "Major technical specifications"),
  listItem("Table 2", "Implementation progress by phase (≈88% complete)"),
  listItem("Table 3", "REST API endpoints implemented"),
  listItem("Table 4", "Triage evaluation results across 30 scenarios"),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- body ----------
const body = [
  H1("1. Introduction"),
  H2("1.1 Background"),
  P("Access to timely and reliable first-line medical guidance remains uneven. When a non-specialist notices a new symptom — an unfamiliar rash, a persistent fever, or sudden chest discomfort — the immediate question is rarely “what exactly is this?” but rather “how urgent is this, and who should I see?” Search engines return undifferentiated and often alarming information, while booking a consultation for every minor concern is neither practical nor affordable. A growing class of Vision-Language Models (VLMs) can now reason jointly over text and images, opening the door to assistive tools that help people gauge urgency responsibly."),
  H2("1.2 Problem Statement"),
  P("There is a need for a responsible, accessible assistant that performs preliminary triage — estimating urgency and routing the user to the appropriate kind of care — without overstepping into diagnosis. Such a system must accept both written symptom descriptions and photographs, hold a natural conversation that gathers detail before concluding, produce consistent and machine-readable output, escalate genuine emergencies unconditionally, and make its non-diagnostic nature unmistakable at every step."),
  H2("1.3 Objectives"),
  P("The objectives of this dissertation are: (i) to design and build a multimodal triage assistant around a production-grade hosted VLM; (ii) to enforce a strict, validated JSON output schema so that every assessment is structured and auditable; (iii) to conduct a doctor-style multi-turn conversation and route each case to an appropriate specialist agent; (iv) to guarantee an emergency-override safety behaviour and an ever-present clinical disclaimer; and (v) to evaluate classification quality against a curated set of triage scenarios."),
  H2("1.4 Scope"),
  P("The system is delivered as a locally deployable web application comprising a Python FastAPI backend and a React front end, backed by a SQLite database, and using Meta Llama 3.2 (90B) Vision through NVIDIA NIM for inference. At the mid-semester milestone the application is a complete, working full stack — authentication, the conversational triage engine, specialist routing, the user interface, the dashboard, and the evaluation harness are all built and were verified live. Only final error-handling polish and developer handover documentation remain for the second half."),

  H1("2. System Architecture and Modules"),
  P("MediQuick AI follows a clean, layered architecture. The browser-based React front end communicates over HTTP (JSON, with a bearer JWT) with a FastAPI service, which delegates to a set of focused Python services: a security module for password hashing and token issue, a prompt engine that constructs the system instruction and enforces the output schema, a specialists module holding ten expert personas and the routing logic, a context manager that assembles multi-turn history, an image pipeline that validates and normalises uploads, and a NIM client that performs text and multimodal inference. Users, conversations, and their structured assessments are persisted in SQLite. Figure 1 shows the architecture; all layers shown in green are implemented and validated."),
  ...fig("fig_architecture.png", 600, 412, "Figure 1: System architecture of MediQuick AI. Green denotes components completed and validated at this milestone."),
  P("The separation of concerns keeps each module independently testable. The backend never trusts model output blindly: every response is parsed and coerced into the canonical schema, a disclaimer is injected if missing, and any service failure is converted into a safe, user-facing message rather than an exception. Every data-bearing endpoint requires a valid token, so sessions and dashboards are strictly scoped to the authenticated user."),

  H1("3. Methodology and Work Completed"),
  P("Development followed the build order defined in the project plan, completing the backend services first and then the user-facing application. Each module was implemented with asynchronous Python or modern React, type hints, and concise docstrings, and secrets are read exclusively from environment variables."),
  H2("3.1 Backend Foundation and Authentication"),
  P("The FastAPI application was initialised with CORS configured for the development front end and a SQLAlchemy engine bound to SQLite. Three ORM models — User, Session, and Message — capture accounts, conversations, and individual turns. Authentication is provided by a security service that hashes passwords with PBKDF2-SHA256 and issues signed JSON Web Tokens; registration also captures an optional health profile (age, sex, height, weight). A dependency validates the bearer token on every protected route."),
  H2("3.2 NVIDIA NIM Client and Prompt Engineering"),
  P("An asynchronous client built on httpx calls the NIM chat-completions endpoint, exposing a text path and a multimodal path that attaches the image to the final user message as a base64 data URL. Inference uses a low temperature of 0.3 for clinical consistency. The prompt engine defines the assistant’s identity as a preliminary triage tool, mandates JSON-only output in the exact triage schema, and encodes the emergency-override rule; a robust parser recovers valid JSON from fenced blocks, surrounding prose, or a safe fallback object."),
  H2("3.3 Conversational Flow and Specialist Routing"),
  P("The triage schema was extended with a conversational reply and an assessment-status field so the assistant can gather information across turns before concluding — mirroring how a clinician takes a history — while the emergency-override always concludes immediately. A specialists module defines ten expert personas (General Physician, Dermatology, Cardiology, Orthopedics, Mental Health, Pediatrics, ENT, Ophthalmology, Gastroenterology, Neurology). Each turn the recommended specialty is resolved to a canonical agent; when a concrete specialty emerges, the session is handed over to that agent, which continues with the full prior context intact."),
  H2("3.4 Image Pipeline and Multi-Turn Context"),
  P("Uploaded images are validated for type and size, opened with Pillow, converted to RGB, resized so the longest side is at most 1024 pixels, re-encoded as JPEG at quality 85, and base64-encoded — entirely in memory, never written to disk. The context manager loads a session’s prior messages, formats them into the role-tagged array the model expects, and caps the history to bound token usage."),
  H2("3.5 React Front End and Dashboard"),
  P("The front end is a React, Vite, and Tailwind CSS single-page application. It provides registration and login screens, a conversational chat window with a typing indicator and example prompts, an image-upload control with preview, colour-coded triage cards that render only once an assessment concludes, a visible specialist-handoff indicator, a session sidebar with per-conversation urgency dots, and a persistent disclaimer banner. A dashboard summarises every concluded consultation as a colour-coded card — conditions, urgency, and recommended specialist only, with no medication or prescription content, consistent with the triage-not-diagnosis design."),

  H1("4. Results and Testing"),
  P("The full application was run locally (FastAPI on Uvicorn and the React app on Vite) and exercised end-to-end in the browser. A user registered, logged in, and held a multi-turn consultation: the assistant acknowledged the symptom, asked focused follow-up questions, handed the session from the General Physician to the appropriate specialist, and finally rendered a colour-coded triage card. Figure 2 shows a concluded consultation with the specialist-handoff indicator and triage card; Figure 3 shows the dashboard of summarised resolutions."),
  ...fig("fig_app_chat.png", 590, 369, "Figure 2: Conversational triage interface. The General Physician hands the session to an Eye Specialist and concludes with a colour-coded triage card. Output is from the running application against Llama 3.2 90B Vision."),
  ...fig("fig_app_dashboard.png", 590, 369, "Figure 3: Health dashboard summarising concluded consultations by urgency tier and specialist — conditions only, with no medication content."),
  P("The interactive API documentation served by the running backend confirms that every endpoint — authentication, chat, upload, sessions, dashboard, and health — is registered and reachable. Figure 4 shows the live Swagger UI."),
  ...fig("fig_swagger.png", 560, 394, "Figure 4: Live FastAPI Swagger UI from the running backend, showing the authentication, chat, sessions, upload, and dashboard endpoints."),
  P("To quantify triage quality, a structured evaluation harness submitted thirty curated scenarios — ten each in dermatology, general medicine, and minor injury, spread across all three urgency tiers — to the live model and compared the predicted urgency against ground-truth tiers derived from standard triage reference guidelines. The system classified all thirty correctly, with no unsafe under-triage (no case was rated less urgent than its true tier). Table 4 summarises the results."),
  table([3600, 1900, 1800, 1726], [
    ["Category", "Scenarios", "Correct", "Accuracy"],
    ["Dermatology", "10", "10", "100%"],
    ["General medicine", "10", "10", "100%"],
    ["Minor injury", "10", "10", "100%"],
    ["Overall", "30", "30", "100%"],
  ]),
  cap("Table 4: Triage evaluation results. Urgency classification was compared against standard triage reference guidelines; zero unsafe under-triage cases were observed."),

  H1("5. Technical Specifications"),
  P("Table 1 summarises the principal technical parameters of the system as implemented at this milestone."),
  table([3400, 5626], [
    ["Parameter", "Value"],
    ["Backend runtime", "Python 3.11+ (asynchronous)"],
    ["Web framework", "FastAPI on Uvicorn"],
    ["Front end", "React + Vite + Tailwind CSS, Axios, React Router"],
    ["Authentication", "JWT (PyJWT), PBKDF2-SHA256 password hashing"],
    ["AI model", "meta/llama-3.2-90b-vision-instruct (configurable)"],
    ["Inference platform", "NVIDIA NIM — /v1/chat/completions"],
    ["Inference parameters", "temperature 0.3, max_tokens 1500"],
    ["Database", "SQLite via SQLAlchemy ORM (User, Session, Message)"],
    ["Image processing", "Pillow — ≤5 MB; JPEG/PNG/WEBP; resize 1024 px; JPEG q85; base64"],
    ["Specialist agents", "10 expert personas with automatic routing"],
    ["Output format", "Strict JSON triage schema (gather → conclude)"],
    ["Urgency tiers", "self_care / consult_doctor / seek_emergency"],
  ]),
  cap("Table 1: Major technical specifications of MediQuick AI."),

  H1("6. Implementation Progress"),
  P("The project is approximately 88% complete: the entire backend, the authentication and specialist-routing layers, the full React interface, the dashboard, and the evaluation harness are finished and were validated live. Only final polish and handover documentation remain. Table 2 details progress by phase."),
  table([3000, 4226, 1800], [
    ["Phase", "Scope", "Status"],
    ["1. Scaffold & environment", "FastAPI app, SQLite models, configuration", "Completed"],
    ["2. NVIDIA NIM client", "Async text + vision client, error handling", "Completed"],
    ["3. Prompt & schema", "System prompt, JSON enforcer, parser", "Completed"],
    ["4. Context manager", "Multi-turn history, token capping", "Completed"],
    ["5. Image pipeline & /upload", "Validate, resize, base64; endpoint", "Completed"],
    ["6. REST endpoints", "/chat and /sessions CRUD", "Completed"],
    ["7. Auth & user profiles", "Register, login, JWT, profile", "Completed"],
    ["8. Specialist-agent routing", "10 personas, handoff with context", "Completed"],
    ["9. React chat & triage UI", "Chat window, triage card, handoff", "Completed"],
    ["10. Image upload, sidebar & dashboard", "Upload UI, history, summaries", "Completed"],
    ["11. Evaluation module", "30 scenarios, accuracy report", "Completed — 100%"],
    ["12. Polish & handover docs", "Tests, responsive pass, README", "In progress"],
  ]),
  cap("Table 2: Implementation progress by phase. All build phases are complete; only final polish and handover documentation remain."),

  H1("7. Design Considerations"),
  P("Several deliberate design decisions shape the system. Triage, not diagnosis, is the central ethical commitment: the prompt forbids definitive diagnoses and prescriptions, the dashboard deliberately contains no medication content, and a disclaimer is rendered on every response. Safety is enforced at two layers — the model is instructed to escalate danger signs, and the backend guarantees a safe fallback when output is malformed or the service is unavailable. Privacy is preserved by processing images only in memory and scoping all data to the authenticated user. The conversational gather-then-conclude flow makes the assistant feel like a clinician taking a history rather than a search engine, and the specialist-routing layer focuses each assessment through the most relevant expert persona. Finally, the model identifier is configurable, allowing the 90B and 11B Llama 3.2 Vision variants to be exchanged without code changes."),

  H1("8. Future Plan"),
  P("The remaining work is limited and constitutes final hardening rather than new capability. A closing pass will strengthen error handling and empty/loading states across the interface, add a short automated test suite for the backend services, conduct a responsive-layout review for smaller screens, and produce developer documentation — a README and setup guide — for handover. Optional enhancements under consideration include richer profile-aware context in the prompt and a printable consultation summary generated from the dashboard."),

  H1("9. References"),
  ...[
    "FastAPI documentation. https://fastapi.tiangolo.com/",
    "NVIDIA NIM — build.nvidia.com. https://build.nvidia.com/",
    "Meta Llama 3.2 Vision models. https://ai.meta.com/llama/",
    "SQLAlchemy ORM documentation. https://docs.sqlalchemy.org/",
    "Pillow (Python Imaging Library) documentation. https://pillow.readthedocs.io/",
    "React documentation. https://react.dev/",
    "Tailwind CSS documentation. https://tailwindcss.com/",
    "JSON Web Tokens (JWT). https://jwt.io/",
    "Dunn, R., et al. (2018). The Emergency Medicine Manual (7th ed.).",
  ].map((r, i) => new Paragraph({ spacing: { after: 80 }, tabStops: [{ type: TabStopType.LEFT, position: 600 }],
    children: [new TextRun({ text: `[${i + 1}]` }), new TextRun({ text: "\t" + r })] })),
];

// ---------- doc ----------
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 22, color: INK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: BRAND, font: "Calibri" },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, color: INK, font: "Calibri" },
        paragraph: { spacing: { before: 180, after: 90 }, outlineLevel: 1 } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "MediQuick AI — Mid-Semester Progress Report    |    Page ", size: 16, color: MUT }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUT })] })] }) },
    children: [...titlePage, ...abstract, ...toc, ...body],
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(OUT, buf); console.log("WROTE " + OUT + " (" + buf.length + " bytes)"); });
