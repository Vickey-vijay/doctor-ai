"""Module 12 — Evaluation harness.

Runs the 30 structured scenarios in scenarios.json through the live NVIDIA NIM model using a
one-shot triage prompt (the model is asked to CONCLUDE immediately, so each scenario yields a
definitive urgency tier). Compares the predicted urgency against the ground-truth tier from
standard triage reference guidelines, writes eval_report.csv, and prints an accuracy summary.

Run from the backend/ directory:
    .venv/Scripts/python.exe evaluation/run_eval.py
"""
import os
import sys
import csv
import json
import time
import asyncio

# Make the backend package importable when run from anywhere.
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from services import nvidia_nim, prompt_engine, specialists  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
SCENARIOS_PATH = os.path.join(HERE, "scenarios.json")
REPORT_PATH = os.path.join(HERE, "eval_report.csv")

# One-shot evaluation prompt — same triage schema, but force an immediate conclusion so each
# scenario produces a single definitive urgency classification (no multi-turn gathering).
EVAL_SYSTEM_PROMPT = """You are MediQuick AI, a preliminary medical TRIAGE assistant being evaluated.
For this evaluation, read the single symptom description and give your FINAL triage immediately.

Respond with ONE valid JSON object and nothing else, using exactly this schema:
{
  "reply": "one short sentence of guidance",
  "assessment_status": "concluded",
  "possible_conditions": ["..."],
  "urgency_tier": "self_care | consult_doctor | seek_emergency",
  "urgency_reason": "one short sentence",
  "specialist_type": "the most appropriate kind of doctor",
  "follow_up_questions": ["..."],
  "disclaimer": "a brief disclaimer"
}

Rules:
- "urgency_tier" MUST be exactly one of: self_care, consult_doctor, seek_emergency.
- self_care = safely manageable at home; consult_doctor = should see a doctor soon (non-emergency);
  seek_emergency = needs immediate/emergency attention.
- EMERGENCY signs (chest pain, trouble breathing, fainting, uncontrolled bleeding, stroke signs,
  severe allergic reaction, suspected major fracture, head injury with LOC/vomiting, sepsis signs
  like spreading redness with fever) MUST be seek_emergency.
- Triage only; never diagnose. Return ONLY the JSON object."""


async def classify(symptom: str) -> dict:
    """Send one scenario to NIM and return the parsed triage dict."""
    messages = [
        {"role": "system", "content": EVAL_SYSTEM_PROMPT},
        {"role": "user", "content": symptom},
    ]
    resp = await nvidia_nim.send_text_request(messages)
    if resp.get("error"):
        return {"urgency_tier": "ERROR", "possible_conditions": [resp.get("message", "error")],
                "specialist_type": "", "_error": resp.get("message")}
    raw = nvidia_nim.extract_text(resp)
    return prompt_engine.parse_triage_json(raw)


async def main() -> None:
    with open(SCENARIOS_PATH, encoding="utf-8") as f:
        data = json.load(f)
    scenarios = data["scenarios"]

    rows = []
    correct = 0
    # adjacency: predicting a more cautious neighbouring tier is a "safe" near-miss
    order = {"self_care": 0, "consult_doctor": 1, "seek_emergency": 2}

    print(f"Running {len(scenarios)} scenarios against {nvidia_nim.settings.nvidia_nim_model}\n")
    for s in scenarios:
        triage = await classify(s["symptom"])
        predicted = triage.get("urgency_tier", "ERROR")
        expected = s["expected_urgency"]
        match = predicted == expected
        if match:
            correct += 1
        spec = specialists.display_name(specialists.resolve_specialty(triage.get("specialist_type")))
        safe = ""
        if not match and predicted in order and expected in order:
            safe = "over-cautious" if order[predicted] > order[expected] else "under-cautious"

        rows.append({
            "id": s["id"],
            "category": s["category"],
            "symptom": s["symptom"],
            "expected_urgency": expected,
            "predicted_urgency": predicted,
            "match": "YES" if match else "NO",
            "miss_type": safe,
            "predicted_specialist": spec,
            "possible_conditions": "; ".join(triage.get("possible_conditions", [])[:3]),
        })
        flag = "OK " if match else ("!! " if safe == "under-cautious" else "~  ")
        print(f"  [{flag}] #{s['id']:>2} {s['category']:<16} expect={expected:<15} got={predicted}")
        time.sleep(0.4)  # be gentle with the free NIM tier

    # ── Write CSV ─────────────────────────────────────────────────────────────
    with open(REPORT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    # ── Summary ───────────────────────────────────────────────────────────────
    total = len(scenarios)
    acc = correct / total * 100
    under = sum(1 for r in rows if r["miss_type"] == "under-cautious")
    over = sum(1 for r in rows if r["miss_type"] == "over-cautious")

    by_cat = {}
    for r in rows:
        c = r["category"]
        by_cat.setdefault(c, [0, 0])
        by_cat[c][1] += 1
        if r["match"] == "YES":
            by_cat[c][0] += 1

    print("\n" + "=" * 56)
    print(f"  OVERALL ACCURACY : {correct}/{total} = {acc:.1f}%")
    print(f"  Safe (over-cautious) misses   : {over}")
    print(f"  UNSAFE (under-cautious) misses: {under}   <-- must be ~0")
    print("  By category:")
    for c, (ok, n) in sorted(by_cat.items()):
        print(f"     {c:<16} {ok}/{n} = {ok / n * 100:.0f}%")
    print("=" * 56)
    print(f"\nWrote {REPORT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
