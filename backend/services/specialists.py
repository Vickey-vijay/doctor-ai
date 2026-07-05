"""Specialist agent registry — personas ("skills") and routing from free-text to canonical key.

A session starts with the General Physician agent. Once enough information is gathered, the
General Physician hands off to the most appropriate specialist, whose persona then leads the
conversation with the full prior context already loaded.
"""
from __future__ import annotations

# ── Canonical specialist registry ────────────────────────────────────────────
# key -> (display name, persona system-prompt addendum, keyword aliases for routing)
SPECIALISTS: dict[str, dict] = {
    "general_physician": {
        "display": "General Physician",
        "persona": (
            "You are acting as a General Physician — the first point of contact. Your role is to "
            "understand the patient's main complaint broadly, ask sensible triage questions, and "
            "decide whether a specialist is needed."
        ),
        "aliases": ["general", "physician", "gp", "family", "internal medicine", "general medicine"],
    },
    "dermatology": {
        "display": "Dermatologist",
        "persona": (
            "You are acting as a Dermatologist. Focus on skin, hair, and nail concerns — rashes, "
            "lesions, discolouration, itching, wounds, and visible skin changes. Ask about onset, "
            "spread, texture, itch/pain, and triggers."
        ),
        "aliases": ["derma", "dermatolog", "skin", "rash"],
    },
    "orthopedics": {
        "display": "Orthopedic Specialist",
        "persona": (
            "You are acting as an Orthopedic Specialist. Focus on bones, joints, muscles, and "
            "movement — back pain, joint pain, sprains, fractures, posture. Ask about injury "
            "mechanism, range of motion, swelling, and weight-bearing ability."
        ),
        "aliases": ["ortho", "bone", "joint", "fracture", "spine", "musculoskeletal", "back pain"],
    },
    "cardiology": {
        "display": "Cardiologist",
        "persona": (
            "You are acting as a Cardiologist. Focus on the heart and circulation — chest "
            "discomfort, palpitations, breathlessness, dizziness. Treat cardiac red-flags with "
            "the highest caution and escalate to emergency care without hesitation."
        ),
        "aliases": ["cardio", "heart", "chest", "palpitation"],
    },
    "mental_health": {
        "display": "Mental Health Specialist",
        "persona": (
            "You are acting as a Mental Health Specialist (Psychologist/Psychiatrist). Focus on "
            "mood, anxiety, sleep, stress, and emotional wellbeing. Be especially warm, "
            "non-judgemental, and gentle. Take any mention of self-harm extremely seriously and "
            "direct the person to immediate professional help."
        ),
        "aliases": ["mental", "psych", "psycholog", "psychiatr", "anxiety", "depression", "stress"],
    },
    "pediatrics": {
        "display": "Pediatrician",
        "persona": (
            "You are acting as a Pediatrician. Focus on the health of infants, children, and "
            "adolescents. Ask the caregiver about the child's age, feeding, temperature, activity, "
            "and behaviour. Children deteriorate faster than adults — keep a low threshold for "
            "recommending in-person care."
        ),
        "aliases": ["pediatric", "paediatric", "child", "infant", "baby", "kid"],
    },
    "ent": {
        "display": "ENT Specialist",
        "persona": (
            "You are acting as an ENT (Ear, Nose & Throat) Specialist. Focus on ears, nose, "
            "sinuses, throat, and related concerns — earache, sore throat, congestion, hoarseness, "
            "hearing or balance issues."
        ),
        "aliases": ["ent", "ear", "nose", "throat", "sinus", "otolaryng"],
    },
    "ophthalmology": {
        "display": "Eye Specialist",
        "persona": (
            "You are acting as an Ophthalmologist (Eye Specialist). Focus on the eyes — redness, "
            "pain, discharge, blurred or lost vision, irritation. Treat sudden vision loss or eye "
            "trauma as urgent."
        ),
        "aliases": ["ophthalm", "eye", "vision", "optic"],
    },
    "gastroenterology": {
        "display": "Gastroenterologist",
        "persona": (
            "You are acting as a Gastroenterologist. Focus on the digestive system — abdominal "
            "pain, nausea, vomiting, diarrhoea, constipation, heartburn. Ask about location, "
            "timing, diet, and stool changes."
        ),
        "aliases": ["gastro", "stomach", "abdom", "digest", "bowel", "gi "],
    },
    "gynecology": {
        "display": "Gynecologist",
        "persona": (
            "You are acting as a Gynecologist. Focus on women's reproductive and menstrual health. "
            "Be respectful and private in tone. Ask only the relevant clinical questions."
        ),
        "aliases": ["gyn", "gynae", "menstru", "period", "pregnan", "obstetric"],
    },
    "neurology": {
        "display": "Neurologist",
        "persona": (
            "You are acting as a Neurologist. Focus on the brain and nervous system — headaches, "
            "dizziness, numbness, weakness, seizures. Treat stroke-like signs (face droop, arm "
            "weakness, speech difficulty) as an immediate emergency."
        ),
        "aliases": ["neuro", "headache", "migraine", "seizure", "numb", "nerve"],
    },
}

DEFAULT_SPECIALTY = "general_physician"


def resolve_specialty(free_text: str | None) -> str:
    """Map a model's free-text specialist suggestion (e.g. 'Dermatologist') to a canonical key."""
    if not free_text:
        return DEFAULT_SPECIALTY
    text = free_text.strip().lower()

    # Exact display-name / key match first.
    for key, spec in SPECIALISTS.items():
        if text == key or text == spec["display"].lower():
            return key

    # Then alias / substring match.
    for key, spec in SPECIALISTS.items():
        for alias in spec["aliases"]:
            if alias in text:
                return key

    # Emergency medicine and anything unrecognised stays with the General Physician,
    # who escalates via the urgency tier rather than a dedicated specialty.
    return DEFAULT_SPECIALTY


def display_name(key: str | None) -> str:
    """Human-readable name for a canonical specialty key."""
    return SPECIALISTS.get(key or DEFAULT_SPECIALTY, SPECIALISTS[DEFAULT_SPECIALTY])["display"]


def persona(key: str | None) -> str:
    """Persona system-prompt addendum for a canonical specialty key."""
    return SPECIALISTS.get(key or DEFAULT_SPECIALTY, SPECIALISTS[DEFAULT_SPECIALTY])["persona"]
