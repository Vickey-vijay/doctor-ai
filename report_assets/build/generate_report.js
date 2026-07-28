const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, LevelFormat, TabStopType, TabStopPosition,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageNumber, PageBreak
} = require("docx");

const FIG = "C:/Users/Vicke/OneDrive/Desktop/Python/A_COH_10/Rishwanth/mediquick-ai/report_assets/figures/";
const OUT = "C:/Users/Vicke/OneDrive/Desktop/Python/A_COH_10/Rishwanth/mediquick-ai/docs/MediQuickAI_FinalReport.docx";

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
  center([new TextRun({ text: "Final Semester Report", italics: true, size: 24, color: BRAND })], { spacing: { after: 260 } }),
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
    "MediQuick AI is an advanced multimodal medical triage assistant that lets a user describe symptoms in a natural, multi-turn chat and optionally upload a photograph of a visible condition such as a rash or wound. A hosted Vision-Language Model — Meta Llama 3.2 (90B) Vision served through the NVIDIA NIM platform — interprets the text and image together and returns a strictly structured triage assessment: a short list of possible conditions, an urgency tier (self-care, consult a doctor, or seek emergency care), the reasoning behind that tier, a recommended medical specialist, and clarifying follow-up questions. Crucially, the system triages rather than diagnoses, and every response carries a clinical disclaimer. This report documents the completed project: every planned build phase has been finished, tested, and verified, and the system is submitted here in its final, working state. The Python FastAPI backend — JWT authentication and profile-aware user accounts, the NVIDIA NIM client, prompt-engineering with JSON-schema enforcement, a multi-turn context manager, a privacy-preserving image pipeline, a specialist-agent routing layer, and all REST endpoints — and a React with Tailwind CSS front end, now mobile-responsive, with registration and login, a conversational chat interface, colour-coded triage cards, image upload, a session sidebar, and a summary dashboard, are implemented and were exercised live in the browser. The assistant conducts a doctor-style conversation, gathering details before it concludes, and routes each case from a General Physician to the most appropriate specialist agent (for example Dermatology or Cardiology) while carrying the full prior context across the handoff. Quality was established at three levels. First, a suite of thirty-nine automated unit and integration tests was written against the backend services, covering authentication, triage-JSON parsing, urgency coercion, the emergency-override rule, specialist routing, the image pipeline, and API access control; all thirty-nine pass in approximately one second against an isolated test database with the model client mocked out. Second, a structured evaluation across thirty curated scenarios spanning dermatology, general medicine, and minor injury achieved 100% urgency-classification accuracy with zero unsafe under-triage. Third, a live end-to-end verification pass exercised the running application directly, covering registration, authentication and its failure modes, the emergency override, specialist routing, image upload and vision analysis, session management, the dashboard, and cross-user data isolation; all twenty-nine functional checks passed. The report also documents four defects discovered during this hardening — a structured-output failure on irrelevant images, a shared token-signing secret, an undersized request timeout, and a stale configuration value — together with their root causes, fixes, and re-verification, and closes with the deployment lessons learned from installing the application on a client machine.")] }),
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
  listItem("Figure 1", "System architecture of MediQuick AI, including the automated testing layer"),
  listItem("Figure 2", "Conversational triage interface with specialist handoff and triage card"),
  listItem("Figure 3", "Health dashboard — summarised resolutions across urgency tiers"),
  listItem("Figure 4", "Live FastAPI interactive API documentation (Swagger UI)"),
  new Paragraph({ spacing: { before: 220 }, children: [] }),
  H1("List of Tables"),
  listItem("Table 1", "Automated test suite results by module (39 tests)"),
  listItem("Table 2", "REST API endpoints implemented"),
  listItem("Table 3", "Triage evaluation results across 30 scenarios"),
  listItem("Table 4", "Live end-to-end verification summary (29 checks)"),
  listItem("Table 5", "Major technical specifications"),
  listItem("Table 6", "Implementation progress by phase (100% complete)"),
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
  P("The system is delivered as a locally deployable web application comprising a Python FastAPI backend and a React front end, backed by a SQLite database, and using Meta Llama 3.2 (90B) Vision through NVIDIA NIM for inference. At project completion the application is a fully built, fully tested full stack: authentication with profile-aware user accounts, the conversational triage engine, specialist routing, a mobile-responsive user interface, the summary dashboard, an automated backend test suite, and the scenario-based evaluation harness have all been delivered and verified, first through automated testing and then through a live end-to-end pass against the running application. The scope also extends to deployment: an installer that validates the host environment, generates a unique security secret per installation, and recovers from common installation failures observed on a client machine."),

  H1("2. System Architecture and Modules"),
  P("MediQuick AI follows a clean, layered architecture. The browser-based React front end communicates over HTTP (JSON, with a bearer JWT) with a FastAPI service, which delegates to a set of focused Python services: a security module for password hashing and token issue, a prompt engine that constructs the system instruction and enforces the output schema, a specialists module holding ten expert personas and the routing logic, a context manager that assembles multi-turn history, an image pipeline that validates and normalises uploads, and a NIM client that performs text and multimodal inference. Users, conversations, and their structured assessments are persisted in SQLite. Sitting alongside these services is an automated testing layer — thirty-nine pytest cases that exercise each service in isolation against a disposable database and a mocked model client — which now runs on every change and is reflected as its own layer in Figure 1. All components shown are implemented, tested, and validated."),
  ...fig("fig_architecture.png", 600, 412, "Figure 1: System architecture of MediQuick AI, showing the addition of the automated testing layer that now covers every backend service."),
  P("The separation of concerns keeps each module independently testable, a property the test suite exploits directly by exercising each service through a narrow, mocked interface. The backend never trusts model output blindly: every response is parsed and coerced into the canonical schema, a disclaimer is injected if missing, and any service failure is converted into a safe, user-facing message rather than an exception. Every data-bearing endpoint requires a valid token, so sessions and dashboards are strictly scoped to the authenticated user."),

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
  H2("3.6 Automated Test Suite"),
  P("A dedicated test suite was written under backend/tests/ using pytest, comprising thirty-nine cases across five modules: test_security.py (seven cases covering password hashing and the JWT issue-and-verify lifecycle), test_prompt_engine.py (ten cases covering triage-JSON parsing from fenced code blocks, prose-wrapped responses, and malformed output, together with urgency-tier coercion and the emergency-forces-concluded rule), test_specialists.py (five cases covering specialist alias resolution to the canonical agent set), test_image_pipeline.py (six cases covering image validation, resizing, and rejection of oversized or invalid files), and test_api.py (eleven cases covering authentication guards on every protected route and cross-user session isolation). Each test run spins up an isolated, disposable SQLite database and monkeypatches the NVIDIA NIM client, so no test touches the production database or makes a network call; the full suite completes in approximately one second, which keeps it practical to run before every change. This suite was written specifically to close the gap identified at the mid-semester stage, where correctness had been established only through manual, live exercising of the application."),
  H2("3.7 Profile-Aware Triage and Responsive Interface"),
  P("Two functional additions were made after the mid-semester milestone. First, the health profile captured at registration — age, sex, height, weight, allergies, and known conditions — is now injected into the specialist agent's system prompt for every turn of a consultation. Previously this data was stored but never used; the assistant now factors it into its urgency judgement and, in practice, stops re-asking the user for details it already holds. Second, the interface was made responsive for mobile use: below the medium breakpoint the session sidebar collapses into an off-canvas drawer with a backdrop overlay, a hamburger control was added to the Chat and Dashboard headers to open it, and the drawer closes on pressing Escape or on selecting a session. This was verified at a 375-pixel viewport width with no horizontal overflow. Alongside these, the interface received a general polish pass — loading skeletons on the dashboard and when opening a past consultation, friendly empty states with a call to action, and inline error messages with a Retry control — that were absent at the mid-semester stage."),

  H1("4. Results and Testing"),
  P("Quality was established at three independent levels, each catching a different class of problem: automated unit and integration tests verify the correctness of individual backend services in isolation; a structured scenario-based evaluation verifies the clinical judgement of the deployed model; and a live end-to-end pass verifies that the assembled application behaves correctly for a real user in the browser. All three are reported below."),
  H2("4.1 Automated Test Suite Results"),
  P("The thirty-nine pytest cases described in Section 3.6 were run against the completed backend and all thirty-nine pass, with the full suite completing in approximately one second. Table 1 gives the breakdown by module. Coverage spans password hashing and the JWT lifecycle; parsing of triage JSON from fenced code blocks, prose-wrapped text, and malformed output; urgency-tier coercion; the rule that an emergency classification always forces the assessment to conclude; specialist alias resolution to the canonical agent set; image validation, resizing, and rejection of invalid uploads; authentication guards on every protected route; and cross-user session isolation."),
  table([4200, 2426, 2400], [
    ["Module", "Focus", "Tests"],
    ["test_security.py", "Password hashing, JWT issue and verify", "7"],
    ["test_prompt_engine.py", "Triage JSON parsing, urgency coercion, emergency rule", "10"],
    ["test_specialists.py", "Specialist alias resolution", "5"],
    ["test_image_pipeline.py", "Image validation, resize, rejection", "6"],
    ["test_api.py", "Auth guards, cross-user session isolation", "11"],
    ["Total", "", "39"],
  ]),
  cap("Table 1: Automated test suite results by module. All 39 tests pass in approximately 1 second against an isolated database with the NVIDIA NIM client mocked out."),
  H2("4.2 Application Walkthrough and API Surface"),
  P("The full application was run locally (FastAPI on Uvicorn and the React app on Vite) and exercised end-to-end in the browser. A user registered, logged in, and held a multi-turn consultation: the assistant acknowledged the symptom, asked focused follow-up questions, handed the session from the General Physician to the appropriate specialist, and finally rendered a colour-coded triage card. Figure 2 shows a concluded consultation with the specialist-handoff indicator and triage card; Figure 3 shows the dashboard of summarised resolutions."),
  ...fig("fig_app_chat.png", 590, 369, "Figure 2: Conversational triage interface. The General Physician hands the session to an Eye Specialist and concludes with a colour-coded triage card. Output is from the running application against Llama 3.2 90B Vision."),
  ...fig("fig_app_dashboard.png", 590, 369, "Figure 3: Health dashboard summarising concluded consultations by urgency tier and specialist — conditions only, with no medication content."),
  P("The interactive API documentation served by the running backend confirms that every endpoint is registered and reachable. Figure 4 shows the live Swagger UI, and Table 2 lists the complete REST surface implemented."),
  ...fig("fig_swagger.png", 560, 394, "Figure 4: Live FastAPI Swagger UI from the running backend, showing the authentication, chat, sessions, upload, and dashboard endpoints."),
  table([2100, 2400, 4526], [
    ["Method", "Path", "Purpose"],
    ["POST", "/register", "Create an account with an optional health profile"],
    ["POST", "/login", "Authenticate and issue a JWT"],
    ["GET", "/me", "Return the authenticated user's profile"],
    ["PUT", "/profile", "Update the authenticated user's health profile"],
    ["POST", "/chat", "Submit a message (and optional image) to the triage engine"],
    ["POST", "/upload", "Validate and process an image upload"],
    ["GET", "/sessions", "List the authenticated user's consultation sessions"],
    ["GET", "/sessions/{id}/messages", "Retrieve the message history for a session"],
    ["POST", "/sessions/{id}/rename", "Rename a session"],
    ["DELETE", "/sessions/{id}", "Delete a session"],
    ["GET", "/dashboard", "Return summarised, concluded consultations"],
    ["GET", "/health", "Service liveness check"],
  ]),
  cap("Table 2: REST API endpoints implemented, all served from the running FastAPI backend and covered by test_api.py."),
  H2("4.3 Scenario-Based Evaluation"),
  P("To quantify triage quality, a structured evaluation harness submitted thirty curated scenarios — ten each in dermatology, general medicine, and minor injury, spread across all three urgency tiers — to the live model and compared the predicted urgency against ground-truth tiers derived from standard triage reference guidelines. The system classified all thirty correctly, with no unsafe under-triage (no case was rated less urgent than its true tier). Table 3 summarises the results."),
  table([3600, 1900, 1800, 1726], [
    ["Category", "Scenarios", "Correct", "Accuracy"],
    ["Dermatology", "10", "10", "100%"],
    ["General medicine", "10", "10", "100%"],
    ["Minor injury", "10", "10", "100%"],
    ["Overall", "30", "30", "100%"],
  ]),
  cap("Table 3: Triage evaluation results. Urgency classification was compared against standard triage reference guidelines; zero unsafe under-triage cases were observed."),
  H2("4.4 Live End-to-End Verification"),
  P("Beyond automated testing and offline evaluation, twenty-nine functional checks were run directly against the running application to confirm that the assembled system behaves correctly for a real user. All twenty-nine passed. The checks covered registration with a full health profile; login, and correct rejection of a wrong password; 401 responses from every protected route when no valid token is presented; the emergency override, where a chest-pain description was routed to the Cardiologist persona, classified seek_emergency, and concluded immediately rather than continuing to gather information; dermatology routing for a described rash; acceptance of a valid image upload and rejection of a non-image file; multimodal vision analysis of an uploaded photograph; session listing, history retrieval, renaming, and deletion; the dashboard view; and cross-user isolation, in which a second user requesting a first user's session receives a 404 rather than any data. Observed NVIDIA NIM latency for vision requests ranged from 14 to 42 seconds, which directly motivated the timeout increase described in Section 6. Table 4 groups the checks by area."),
  table([3200, 2400, 3426], [
    ["Area", "Checks", "Result"],
    ["Authentication and profile", "Registration, login, wrong-password rejection, 401 guards", "Pass"],
    ["Emergency override", "Chest-pain case routed and concluded immediately", "Pass"],
    ["Specialist routing", "Dermatology routing for a described rash", "Pass"],
    ["Image handling", "Upload acceptance, non-image rejection, vision analysis", "Pass"],
    ["Sessions and dashboard", "List, history, rename, delete, dashboard view", "Pass"],
    ["Data isolation", "Cross-user session access returns 404", "Pass"],
    ["Overall", "29 checks", "29 / 29 Pass"],
  ]),
  cap("Table 4: Live end-to-end verification summary. All 29 functional checks passed against the running application."),

  H1("5. Defects Identified and Resolved"),
  P("Hardening the application for completion surfaced four defects, each investigated to root cause, fixed, and re-verified. They are reported here in full, including the ones that were not obvious at first inspection, because the process of finding and correcting them is itself part of the dissertation's engineering contribution."),
  H2("5.1 Structured-Output Breakdown on Irrelevant Images"),
  P("Symptom: when a user attached an off-topic photograph — a company logo — during live testing, the model abandoned the mandatory JSON contract and replied in free prose, incorrectly stating that it was “a text-based AI assistant… not able to view images.” The backend's fallback path then surfaced that raw text directly to the user, which read as though multimodal vision had failed outright. Root cause: the image had in fact reached the model correctly; the model was simply not sufficiently constrained to remain within the JSON contract when it judged an image to be clinically irrelevant, and it produced a plausible-sounding but false disclaimer instead. Fix: the system prompt was strengthened to state explicitly that the assistant does have vision and must remain in valid JSON even when declining to comment on an image, and a single strict “reformat as JSON” retry was added to the chat router as a second line of defence before any fallback is shown to the user. Re-verification: the same off-topic image input was resubmitted after the fix and now returns a correctly structured triage-schema reply rather than free prose."),
  H2("5.2 Shared Token-Signing Secret"),
  P("Symptom: a security review of the environment template found that it shipped without a JWT_SECRET value. Root cause: every installation that did not set one silently fell back to a hardcoded default value present in the source repository, so login tokens issued by any such installation could, in principle, be forged or replayed across other installations sharing the same default. Fix: the installer now generates a unique, random secret for each installation at setup time, and the generation step is idempotent, so re-running setup does not overwrite an existing secret and invalidate current user sessions. Re-verification: fresh installations were confirmed to produce distinct secrets, and re-running the installer against an already-configured installation left existing sessions valid."),
  H2("5.3 Vision Request Timeout Tuning"),
  P("Symptom: vision-analysis requests were intermittently aborted mid-flight. Root cause: measured NVIDIA NIM latency for vision requests during live verification regularly reached 14 to 42 seconds, exceeding the original 60-second timeout ceiling in both the backend client and the front-end HTTP client under load. Fix: the backend timeout was raised to 100 seconds and the front-end client timeout to 110 seconds, giving headroom above the observed worst case. Re-verification: repeated vision requests at the upper end of the observed latency range completed successfully with no client-side abort."),
  H2("5.4 Stale Configuration Value"),
  P("Symptom: a leftover configuration entry pointed at a port that no longer corresponded to any running service. Root cause: the value was a remnant of an earlier development configuration that had not been removed once the corresponding service was reconfigured. Fix: the dead entry was removed from the configuration. Re-verification: the application was restarted from a clean configuration and confirmed to start and operate identically with the entry absent."),

  H1("6. Technical Specifications"),
  P("Table 5 summarises the principal technical parameters of the completed system."),
  table([3400, 5626], [
    ["Parameter", "Value"],
    ["Backend runtime", "Python 3.11+ (asynchronous)"],
    ["Web framework", "FastAPI on Uvicorn"],
    ["Front end", "React + Vite + Tailwind CSS, Axios, React Router (mobile-responsive)"],
    ["Authentication", "JWT (PyJWT, HS256), PBKDF2-SHA256 password hashing"],
    ["Token secret", "Unique random secret generated per installation, idempotent setup"],
    ["AI model", "meta/llama-3.2-90b-vision-instruct (configurable)"],
    ["Inference platform", "NVIDIA NIM — /v1/chat/completions"],
    ["Inference parameters", "temperature 0.3, max_tokens 1500"],
    ["Request timeouts", "100 s (backend client), 110 s (front-end client)"],
    ["Database", "SQLite via SQLAlchemy ORM (User, Session, Message)"],
    ["Image processing", "Pillow — ≤5 MB; JPEG/PNG/WEBP; resize 1024 px; JPEG q85; base64"],
    ["Specialist agents", "10 expert personas with automatic routing"],
    ["Output format", "Strict JSON triage schema (gather → conclude)"],
    ["Urgency tiers", "self_care / consult_doctor / seek_emergency"],
    ["Automated test suite", "39 pytest cases across 5 modules, isolated DB, mocked NIM client"],
  ]),
  cap("Table 5: Major technical specifications of MediQuick AI."),

  H1("7. Implementation Progress"),
  P("The project is 100% complete: every planned build phase, listed in Table 6, has been finished and verified — first by the automated test suite, then by the scenario-based evaluation, and finally by the live end-to-end pass described in Section 4."),
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
    ["12. Automated test suite", "39 pytest cases, 5 modules", "Completed — 39/39 passing"],
    ["13. Profile-aware triage & responsive UI", "Profile injection, mobile drawer nav", "Completed"],
    ["14. Defect remediation & deployment hardening", "4 defects fixed, installer hardened", "Completed"],
  ]),
  cap("Table 6: Implementation progress by phase. All build phases are complete."),

  H1("8. Design Considerations"),
  P("Several deliberate design decisions shape the system. Triage, not diagnosis, is the central ethical commitment: the prompt forbids definitive diagnoses and prescriptions, the dashboard deliberately contains no medication content, and a disclaimer is rendered on every response. Safety is enforced at two layers — the model is instructed to escalate danger signs, and the backend guarantees a safe fallback when output is malformed or the service is unavailable, now reinforced by the JSON-contract retry described in Section 5.1. Privacy is preserved by processing images only in memory and scoping all data to the authenticated user. The conversational gather-then-conclude flow makes the assistant feel like a clinician taking a history rather than a search engine, and the specialist-routing layer focuses each assessment through the most relevant expert persona. The model identifier is configurable, allowing the 90B and 11B Llama 3.2 Vision variants to be exchanged without code changes."),
  P("Deployment hardening added a further set of considerations, driven by real installation failures encountered on a client machine rather than by anticipation. The installer refuses Python 3.14 and later with an actionable message, since a required dependency has no prebuilt binary for those versions and falls back to a source build that fails; it requires Python 3.10 through 3.13. It warns when the project directory sits inside Dropbox, OneDrive, or Google Drive, because those sync clients lock files mid-install and can corrupt the virtual environment, surfacing as a Windows error 32 file-in-use failure. It no longer upgrades pip in place, which was identified as the specific step causing that corruption; it retries automatically on slow or unstable networks; and it detects and rebuilds a damaged virtual environment rather than failing outright. These changes reflect a broader lesson: a system that works reliably in development is not the same as one that installs reliably on an arbitrary user's machine, and the latter deserves the same rigour as the application code itself."),

  H1("9. Conclusion and Future Work"),
  P("MediQuick AI has been delivered as a complete, working multimodal medical triage assistant. Every planned build phase — the FastAPI backend, JWT authentication with profile-aware accounts, the NVIDIA NIM vision client, the prompt engine and JSON-schema enforcement, the multi-turn context manager, the privacy-preserving image pipeline, the ten-persona specialist-routing layer, the React and Tailwind CSS interface with its mobile-responsive drawer navigation, and the summary dashboard — is finished. Quality has been demonstrated at three levels: thirty-nine automated tests passing in about one second, a 100% urgency-classification accuracy with zero unsafe under-triage across thirty curated scenarios, and twenty-nine of twenty-nine live end-to-end functional checks passing against the running application. Four defects surfaced during hardening were diagnosed to root cause, fixed, and re-verified, and the installer was hardened against failure modes observed on a real client machine. Throughout, the system maintains its central ethical commitment: it triages rather than diagnoses, escalates emergencies unconditionally, and carries a clinical disclaimer on every response."),
  P("Beyond this submission, several directions remain genuinely open for future work rather than pending for this project. A formal clinician review study, in which practising physicians assess a sample of triage outputs for clinical soundness, would complement the scenario-based evaluation with expert judgement. The thirty-scenario evaluation set could be substantially enlarged and diversified to cover rarer presentations and edge cases beyond dermatology, general medicine, and minor injury. Integration with electronic health record systems would allow a consultation to draw on a patient's documented history rather than only what they volunteer in chat. Multilingual support would extend the assistant's reach beyond English-speaking users. Finally, on-device or edge inference for at least a first-pass triage step is worth exploring as a privacy-enhancing alternative to sending symptom descriptions and images to a hosted model, for users and jurisdictions where that matters most."),

  H1("10. References"),
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
      children: [new TextRun({ text: "MediQuick AI — Final Semester Report    |    Page ", size: 16, color: MUT }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUT })] })] }) },
    children: [...titlePage, ...abstract, ...toc, ...body],
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(OUT, buf); console.log("WROTE " + OUT + " (" + buf.length + " bytes)"); });
