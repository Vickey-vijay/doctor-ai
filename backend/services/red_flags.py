"""Deterministic emergency red-flag detection — a safety net that does not depend on the model.

The system prompt instructs the model to escalate emergencies, but model behaviour varies (the
smaller fallback model, for example, has been observed continuing to ask questions when presented
with textbook cardiac symptoms). For a triage tool, missing an emergency is the one failure mode we
cannot accept, so red flags are also detected in plain Python and force an escalation.

Over-triage is deliberately preferred to under-triage: a false escalation is an inconvenience,
a missed emergency is not.
"""
import re

# Each entry: (label shown to the clinician-facing reason, regex of phrasings patients actually use)
RED_FLAG_PATTERNS: list[tuple[str, str]] = [
    ("chest pain",            r"\bchest (?:pain|pressure|tightness|tight|discomfort)\b|\bpain in my chest\b|\bcrushing (?:pain|chest)\b"),
    ("difficulty breathing",  r"\b(?:can'?t|cannot|struggling to|trouble|difficulty|hard to)\s+breath\w*\b|\bshort(?:ness)? of breath\b|\bgasping\b|\bcan'?t catch my breath\b"),
    ("loss of consciousness", r"\b(?:passed out|blacked out|fainted|unconscious|lost consciousness)\b"),
    ("severe bleeding",       r"\b(?:heav(?:y|ily)|severe|uncontrolled|won'?t stop|not stopping|profuse)\w*\s+bleed\w*\b|\bbleeding (?:heavily|badly|a lot|non-?stop|uncontrollably)\b|\bspurting blood\b"),
    ("stroke signs",          r"\bface (?:is )?droop\w*\b|\bslurr\w+ speech\b|\bcan'?t speak\b|\bweak(?:ness)? (?:in|on) one side\b|\bnumb\w* (?:on )?one side\b|\bsudden(?:ly)? (?:numb|weak)\w*\b"),
    ("severe allergic reaction", r"\bthroat (?:is )?(?:closing|tight|swelling|swollen)\b|\b(?:lips?|tongue|face) (?:is |are )?swell\w*\b|\banaphyla\w*\b"),
    ("suspected major fracture", r"\bbone (?:is )?(?:sticking out|protruding|visible|through the skin)\b|\bbent at (?:an? )?(?:odd|strange|wrong|unnatural) angle\b|\bcompound fracture\b"),
    ("head injury",           r"\bhit my head\b(?=[\s\S]{0,120}?\b(?:vomit\w*|threw up|passed out|blacked out|unconscious|confus\w*)\b)"),
    ("worst headache",        r"\bworst headache of my life\b|\bthunderclap headache\b"),
    ("coughing or vomiting blood", r"\b(?:cough\w*|vomit\w*|throwing up|spitting)\s+(?:up\s+)?blood\b|\bblood in my vomit\b"),
    ("suicidal ideation",     r"\b(?:kill myself|end my life|suicidal|take my own life|don'?t want to live|want to die)\b"),
    ("sepsis signs",          r"\bred streaks?\b(?=[\s\S]{0,120}?\bfever\b)|\bspreading redness\b(?=[\s\S]{0,120}?\bfever\b)"),
    # Fever together with altered mental state — possible sepsis or meningitis.
    ("fever with confusion or drowsiness",
     r"\bfever\b(?=[\s\S]{0,140}?\b(?:confus\w*|drowsy|disorient\w*|unrespons\w*|lethargic|delirious|not making sense)\b)"
     r"|\b(?:confus\w*|drowsy|disorient\w*|unrespons\w*|lethargic|delirious)\b(?=[\s\S]{0,140}?\bfever\b)"),
    # Extensive or blistering burns need emergency care; small red marks do not.
    ("severe burn",
     r"\bblistering burn\b|\bburn\w*\b(?=[\s\S]{0,60}?\bcovering (?:most|all|a large|much)\b)"
     r"|\b(?:large|deep|severe|extensive|third[- ]degree|second[- ]degree)\s+burn\b"),
    # Widespread blistering/peeling rash with mucosal involvement or fever (e.g. SJS/TEN).
    ("widespread blistering rash",
     r"\b(?:widespread|extensive|all over)\b[\s\S]{0,40}?\bblister\w*\b(?=[\s\S]{0,160}?\b(?:fever|mouth|peel\w*)\b)"
     r"|\bblister\w*\s+rash\b(?=[\s\S]{0,160}?\b(?:fever|sores in my mouth|peeling)\b)"
     r"|\bpeeling skin\b(?=[\s\S]{0,160}?\bfever\b)"),
]

# Phrases that negate a symptom mentioned right after them ("no chest pain", "denies fainting").
_NEGATION = re.compile(
    r"\b(?:no|not|without|never|denies|denied|deny|didn'?t|doesn'?t|don'?t|haven'?t|hasn'?t|isn'?t|aren'?t|free of|ruled out)\b",
    re.IGNORECASE,
)
_NEGATION_WINDOW = 32  # characters before the match to inspect for a negation cue


def _is_negated(text: str, start: int) -> bool:
    """True when a negation cue appears close before the match (e.g. 'no chest pain')."""
    window = text[max(0, start - _NEGATION_WINDOW):start]
    # Stop at sentence boundaries so "No fever. Chest pain." is not treated as negated.
    window = re.split(r"[.!?;]", window)[-1]
    return bool(_NEGATION.search(window))


def detect(text: str) -> list[str]:
    """Return the labels of any emergency red flags present (and not negated) in the text."""
    if not text:
        return []
    lowered = text.lower()
    found: list[str] = []
    for label, pattern in RED_FLAG_PATTERNS:
        for match in re.finditer(pattern, lowered, re.IGNORECASE):
            if not _is_negated(lowered, match.start()):
                found.append(label)
                break
    return found
