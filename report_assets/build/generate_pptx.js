const pptxgen = require("pptxgenjs");
const FIG = "C:/Users/Vicke/OneDrive/Desktop/Python/A_COH_10/Rishwanth/mediquick-ai/report_assets/figures/";
const OUT = "C:/Users/Vicke/OneDrive/Desktop/Python/A_COH_10/Rishwanth/mediquick-ai/MediQuickAI_Presentation.pptx";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
const W = 13.333, H = 7.5;

// palette
const BG = "0B1220", PANEL = "121F33", PANEL2 = "172a44", INK = "F8FAFC", MUT = "94A3B8", DIM = "64748B";
const TEAL = "2DD4BF", TEALD = "0EA5A4";
const GREEN = "22C55E", AMBER = "F59E0B", RED = "EF4444";
const HF = "Georgia", BF = "Calibri";

function dark(s) { s.background = { color: BG }; }
function brand(s, x, y, sz) {
  s.addShape(pptx.ShapeType.roundRect, { x, y, w: sz, h: sz, fill: { color: TEAL }, line: { type: "none" }, rectRadius: sz * 0.28 });
  s.addText("+", { x, y: y - 0.02, w: sz, h: sz, align: "center", valign: "middle", fontFace: BF, fontSize: sz * 34, bold: true, color: "06281f" });
}
function header(s, title, accent = TEAL) {
  brand(s, 0.62, 0.5, 0.5);
  s.addText(title, { x: 1.3, y: 0.46, w: 11.4, h: 0.7, fontFace: HF, fontSize: 30, bold: true, color: INK, valign: "middle" });
}
function dots(s, x, y) {
  [GREEN, AMBER, RED].forEach((c, i) => s.addShape(pptx.ShapeType.ellipse, { x: x + i * 0.28, y, w: 0.16, h: 0.16, fill: { color: c }, line: { type: "none" } }));
}
function caption(s, t, x, y, w) {
  s.addText(t, { x, y, w, h: 0.4, align: "center", fontFace: BF, fontSize: 11, italic: true, color: MUT });
}

// ---------- Slide 1 — Title ----------
let s = pptx.addSlide(); dark(s);
brand(s, W / 2 - 0.55, 1.55, 1.1);
s.addText("MediQuick AI", { x: 0, y: 2.85, w: W, h: 1.0, align: "center", fontFace: HF, fontSize: 56, bold: true, color: INK });
s.addText("An Advanced Multimodal Medical Triage Assistant", { x: 0, y: 3.95, w: W, h: 0.5, align: "center", fontFace: BF, fontSize: 22, color: TEAL });
s.addText("Mid-Semester Progress Review  ·  June 2026", { x: 0, y: 4.6, w: W, h: 0.4, align: "center", fontFace: BF, fontSize: 15, color: MUT });
s.addText([
  { text: "Dissertation: Rishwanth [Last Name]", options: { color: MUT } },
  { text: "      Developer: Vignesh V", options: { color: DIM } },
  { text: "      BITS ZG628T", options: { color: DIM } },
], { x: 0, y: 6.55, w: W, h: 0.4, align: "center", fontFace: BF, fontSize: 13 });
dots(s, W / 2 - 0.34, 5.35);

// ---------- Slide 2 — The Problem ----------
s = pptx.addSlide(); dark(s); header(s, "The Problem");
s.addText([{ text: "“How urgent is this — ", options: {} }, { text: "and who should I see?”", options: { color: TEAL } }],
  { x: 0.7, y: 1.55, w: 12, h: 1.0, fontFace: HF, fontSize: 34, italic: true, bold: true, color: INK });
const probs = [
  ["Noise, not clarity", "Search results are overwhelming and often alarming, not reassuring."],
  ["Cost & access", "Booking a consultation for every minor concern is impractical and expensive."],
  ["Wrong question", "People need to know the urgency and the right specialist — not a self-diagnosis."],
];
probs.forEach((p, i) => {
  const y = 3.0 + i * 1.35;
  s.addShape(pptx.ShapeType.roundRect, { x: 0.7, y, w: 11.9, h: 1.15, fill: { color: PANEL }, line: { type: "none" }, rectRadius: 0.1 });
  s.addShape(pptx.ShapeType.ellipse, { x: 1.0, y: y + 0.32, w: 0.5, h: 0.5, fill: { color: TEALD }, line: { type: "none" } });
  s.addText(String(i + 1), { x: 1.0, y: y + 0.32, w: 0.5, h: 0.5, align: "center", valign: "middle", fontFace: HF, fontSize: 20, bold: true, color: INK });
  s.addText([{ text: p[0] + "\n", options: { bold: true, fontSize: 18, color: INK } }, { text: p[1], options: { fontSize: 14, color: MUT } }],
    { x: 1.75, y: y + 0.12, w: 10.6, h: 0.9, fontFace: BF, valign: "middle", lineSpacingMultiple: 1.05 });
});

// ---------- Slide 3 — The Approach ----------
s = pptx.addSlide(); dark(s); header(s, "The Approach");
s.addText([{ text: "MediQuick AI triages — it does not diagnose.", options: { bold: true, color: INK } },
  { text: "  Describe symptoms in chat, optionally add a photo, and receive a structured, urgency-ranked assessment.", options: { color: MUT } }],
  { x: 0.7, y: 1.55, w: 12, h: 0.9, fontFace: BF, fontSize: 17, lineSpacingMultiple: 1.1 });
const cards = [
  ["Multimodal", "Understands text and images together via a Vision-Language Model."],
  ["Structured JSON", "Every reply follows a strict, validated six-field schema."],
  ["Three urgency tiers", "Self-care · consult a doctor · seek emergency care."],
  ["Safe by design", "Emergency override and a disclaimer on every response."],
];
cards.forEach((c, i) => {
  const x = 0.7 + (i % 2) * 6.15, y = 2.7 + Math.floor(i / 2) * 2.15;
  s.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.85, h: 1.9, fill: { color: PANEL }, line: { color: PANEL2, width: 1 }, rectRadius: 0.12 });
  s.addShape(pptx.ShapeType.roundRect, { x, y, w: 0.12, h: 1.9, fill: { color: TEAL }, line: { type: "none" }, rectRadius: 0.05 });
  s.addText(c[0], { x: x + 0.4, y: y + 0.28, w: 5.2, h: 0.5, fontFace: HF, fontSize: 21, bold: true, color: TEAL });
  s.addText(c[1], { x: x + 0.4, y: y + 0.85, w: 5.2, h: 0.9, fontFace: BF, fontSize: 15, color: INK, lineSpacingMultiple: 1.1 });
});

// ---------- Slide 4 — Architecture ----------
s = pptx.addSlide(); dark(s); header(s, "System Architecture");
s.addImage({ path: FIG + "fig_architecture.png", x: 2.92, y: 1.5, w: 7.5, h: 5.16 });
caption(s, "React + FastAPI + NVIDIA NIM · JWT auth · specialist-agent routing — all layers complete and validated.", 1.0, 6.78, 11.33);

// ---------- Slide 5 — Demo A: doctor-style consultation ----------
s = pptx.addSlide(); dark(s); header(s, "Demo · Doctor-Style Consultation");
const flow = [
  ["1", "User describes a symptom in plain language."],
  ["2", "The assistant asks focused follow-up questions."],
  ["3", "It hands off to the right specialist agent."],
  ["4", "It concludes with a colour-coded triage card."],
];
flow.forEach((f, i) => {
  const y = 1.85 + i * 1.15;
  s.addShape(pptx.ShapeType.ellipse, { x: 0.75, y, w: 0.55, h: 0.55, fill: { color: TEALD }, line: { type: "none" } });
  s.addText(f[0], { x: 0.75, y, w: 0.55, h: 0.55, align: "center", valign: "middle", fontFace: HF, fontSize: 20, bold: true, color: INK });
  s.addText(f[1], { x: 1.5, y: y - 0.1, w: 4.2, h: 0.8, fontFace: BF, fontSize: 15, color: INK, valign: "middle", lineSpacingMultiple: 1.05 });
});
s.addImage({ path: FIG + "fig_app_chat.png", x: 6.05, y: 1.5, w: 6.75, h: 4.22 });
caption(s, "Real consultation: General Physician → Eye Specialist handoff, concluding with a triage card.", 6.05, 5.85, 6.75);

// ---------- Slide 6 — Specialist routing & dashboard ----------
s = pptx.addSlide(); dark(s); header(s, "Specialist Routing & Dashboard");
s.addImage({ path: FIG + "fig_app_dashboard.png", x: 0.6, y: 1.55, w: 7.4, h: 4.63 });
caption(s, "Dashboard: every concluded consultation summarised by urgency and specialist — no medication content.", 0.6, 6.3, 7.4);
const stats = [["10 agents", "General Physician routes to the right specialist"], ["Context carried", "Full history follows the handoff"], ["Photos in-memory", "Validated, resized, never saved to disk"]];
stats.forEach((st, i) => {
  const y = 1.7 + i * 1.6;
  s.addShape(pptx.ShapeType.roundRect, { x: 8.4, y, w: 4.3, h: 1.4, fill: { color: PANEL }, line: { color: PANEL2, width: 1 }, rectRadius: 0.12 });
  s.addText(st[0], { x: 8.7, y: y + 0.18, w: 3.7, h: 0.6, fontFace: HF, fontSize: 24, bold: true, color: TEAL });
  s.addText(st[1], { x: 8.7, y: y + 0.82, w: 3.7, h: 0.5, fontFace: BF, fontSize: 12, color: MUT, lineSpacingMultiple: 1.0 });
});

// ---------- Slide 7 — Evaluation results ----------
s = pptx.addSlide(); dark(s); header(s, "Evaluation · 30 Structured Scenarios");
s.addText("100%", { x: 0.7, y: 2.0, w: 4.7, h: 1.9, align: "center", fontFace: HF, fontSize: 116, bold: true, color: GREEN });
s.addText("urgency-classification accuracy", { x: 0.7, y: 3.95, w: 4.7, h: 0.5, align: "center", fontFace: BF, fontSize: 16, color: INK });
s.addText("0 unsafe under-triage cases", { x: 0.7, y: 4.45, w: 4.7, h: 0.5, align: "center", fontFace: BF, fontSize: 13, color: MUT });
const ev = [["Dermatology", "10 / 10"], ["General medicine", "10 / 10"], ["Minor injury", "10 / 10"], ["Overall", "30 / 30"]];
ev.forEach((e, i) => {
  const y = 1.75 + i * 1.18;
  s.addShape(pptx.ShapeType.roundRect, { x: 5.9, y, w: 6.8, h: 1.0, fill: { color: PANEL }, line: { color: PANEL2, width: 1 }, rectRadius: 0.1 });
  s.addText(e[0], { x: 6.25, y, w: 4.2, h: 1.0, fontFace: BF, fontSize: 16, color: INK, valign: "middle" });
  s.addText(e[1], { x: 9.9, y, w: 2.5, h: 1.0, align: "right", fontFace: HF, fontSize: 22, bold: true, color: i === 3 ? TEAL : GREEN, valign: "middle" });
});
caption(s, "Compared against standard triage reference guidelines, across all three urgency tiers.", 5.9, 6.55, 6.8);

// ---------- Slide 8 — Progress ----------
s = pptx.addSlide(); dark(s); header(s, "Progress at the Milestone");
s.addText("88%", { x: 0.7, y: 1.7, w: 4.6, h: 2.2, align: "center", fontFace: HF, fontSize: 130, bold: true, color: TEAL });
s.addText("of the project complete", { x: 0.7, y: 3.95, w: 4.6, h: 0.5, align: "center", fontFace: BF, fontSize: 18, color: INK });
s.addText("full app + evaluation — only polish remains", { x: 0.7, y: 4.45, w: 4.6, h: 0.5, align: "center", fontFace: BF, fontSize: 13, color: MUT });
// completed column
s.addShape(pptx.ShapeType.roundRect, { x: 5.7, y: 1.7, w: 3.4, h: 5.2, fill: { color: PANEL }, line: { type: "none" }, rectRadius: 0.12 });
s.addText("Completed", { x: 5.95, y: 1.9, w: 2.9, h: 0.45, fontFace: HF, fontSize: 18, bold: true, color: GREEN });
["FastAPI backend + JWT auth", "NVIDIA NIM client (text + vision)", "Prompt engine, gather→conclude", "10 specialist agents + routing", "React UI: chat, card, sidebar", "Dashboard of resolutions", "Evaluation — 30/30 (100%)"]
  .forEach((t, i) => s.addText([{ text: "✓  ", options: { color: GREEN, bold: true } }, { text: t, options: { color: INK } }],
    { x: 5.95, y: 2.5 + i * 0.6, w: 2.95, h: 0.5, fontFace: BF, fontSize: 13, valign: "middle" }));
// remaining column
s.addShape(pptx.ShapeType.roundRect, { x: 9.3, y: 1.7, w: 3.4, h: 5.2, fill: { color: PANEL }, line: { type: "none" }, rectRadius: 0.12 });
s.addText("Remaining", { x: 9.55, y: 1.9, w: 2.9, h: 0.45, fontFace: HF, fontSize: 18, bold: true, color: AMBER });
["Error-handling & UI polish", "Automated backend tests", "Responsive-layout review", "Developer README & handover"]
  .forEach((t, i) => s.addText([{ text: "○  ", options: { color: AMBER, bold: true } }, { text: t, options: { color: INK } }],
    { x: 9.55, y: 2.5 + i * 0.6, w: 2.95, h: 0.5, fontFace: BF, fontSize: 13, valign: "middle" }));

// ---------- Slide 9 — What's next ----------
s = pptx.addSlide(); dark(s); header(s, "What's Next");
const steps = [
  ["Polish error handling", "Harden empty / loading / error states across the interface."],
  ["Automated tests", "A short test suite for the backend services."],
  ["Responsive review", "Tune the layout for smaller screens."],
  ["Handover docs", "Developer README and setup guide for the team."],
];
steps.forEach((p, i) => {
  const y = 1.75 + i * 1.32;
  s.addShape(pptx.ShapeType.roundRect, { x: 0.7, y, w: 11.9, h: 1.12, fill: { color: PANEL }, line: { type: "none" }, rectRadius: 0.1 });
  s.addShape(pptx.ShapeType.ellipse, { x: 1.0, y: y + 0.31, w: 0.5, h: 0.5, fill: { color: TEAL }, line: { type: "none" } });
  s.addText(String(i + 1), { x: 1.0, y: y + 0.31, w: 0.5, h: 0.5, align: "center", valign: "middle", fontFace: HF, fontSize: 20, bold: true, color: "06281f" });
  s.addText([{ text: p[0] + "   ", options: { bold: true, fontSize: 17, color: TEAL } }, { text: p[1], options: { fontSize: 14, color: INK } }],
    { x: 1.75, y: y + 0.12, w: 10.6, h: 0.9, fontFace: BF, valign: "middle", lineSpacingMultiple: 1.05 });
});

// ---------- Slide 10 — Closing ----------
s = pptx.addSlide(); dark(s);
brand(s, W / 2 - 0.5, 1.9, 1.0);
s.addText("Thank You", { x: 0, y: 3.1, w: W, h: 1.0, align: "center", fontFace: HF, fontSize: 50, bold: true, color: INK });
s.addText("MediQuick AI provides preliminary triage guidance only — not a medical diagnosis.",
  { x: 0, y: 4.25, w: W, h: 0.5, align: "center", fontFace: BF, fontSize: 16, italic: true, color: TEAL });
s.addText("Rishwanth [Last Name]  ·  BITS ZG628T Dissertation  ·  Developer: Vignesh V  ·  June 2026",
  { x: 0, y: 6.5, w: W, h: 0.4, align: "center", fontFace: BF, fontSize: 13, color: MUT });
dots(s, W / 2 - 0.34, 5.0);

pptx.writeFile({ fileName: OUT }).then((f) => console.log("WROTE " + f));
