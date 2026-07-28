"""Tests for JSON extraction/coercion in services/prompt_engine.py — critical for triage safety.

These guard the parsing contract that keeps the assistant's structured triage card reliable
even when the model's raw text is fenced, wrapped in prose, or occasionally malformed.
"""
import json

from services import prompt_engine


def _triage_payload(**overrides) -> dict:
    """Build a minimal valid triage dict, with any fields overridden."""
    base = {
        "reply": "Thanks for sharing that.",
        "assessment_status": "concluded",
        "possible_conditions": ["Common cold"],
        "urgency_tier": "self_care",
        "urgency_reason": "Mild symptoms consistent with a cold.",
        "specialist_type": "General Physician",
        "follow_up_questions": [],
        "disclaimer": "Some disclaimer text.",
    }
    base.update(overrides)
    return base


def test_try_extract_json_clean_json():
    """A plain, well-formed JSON object parses directly."""
    raw = json.dumps(_triage_payload())
    result = prompt_engine.try_extract_json(raw)
    assert result is not None
    assert result["urgency_tier"] == "self_care"
    assert result["assessment_status"] == "concluded"


def test_try_extract_json_fenced_in_markdown():
    """JSON wrapped in a ```json ... ``` fence still parses."""
    raw = f"```json\n{json.dumps(_triage_payload())}\n```"
    result = prompt_engine.try_extract_json(raw)
    assert result is not None
    assert result["specialist_type"] == "General Physician"


def test_try_extract_json_with_surrounding_prose():
    """A JSON object with leading/trailing prose is still extracted via the outer-brace fallback."""
    raw = f"Sure, here is my assessment:\n{json.dumps(_triage_payload())}\nLet me know if you need more."
    result = prompt_engine.try_extract_json(raw)
    assert result is not None
    assert result["urgency_tier"] == "self_care"


def test_try_extract_json_pure_prose_returns_none():
    """Plain prose with no JSON object returns None — no silent fallback dict.

    Regression guard: an off-topic image previously caused the model to reply in plain
    prose; try_extract_json must surface that as None so the caller can retry with a
    reformat reminder, rather than a fallback dict masking the failure.
    """
    raw = "I'm sorry, that doesn't look like something I can triage. Could you describe a symptom?"
    assert prompt_engine.try_extract_json(raw) is None


def test_try_extract_json_empty_string_returns_none():
    """An empty or whitespace-only response returns None."""
    assert prompt_engine.try_extract_json("") is None
    assert prompt_engine.try_extract_json("   \n  ") is None


def test_coerce_schema_invalid_tier_falls_back_to_consult_doctor():
    """An unrecognised urgency_tier value is coerced to the safe 'consult_doctor' default."""
    raw = json.dumps(_triage_payload(urgency_tier="not_a_real_tier"))
    result = prompt_engine.try_extract_json(raw)
    assert result["urgency_tier"] == "consult_doctor"


def test_coerce_schema_emergency_forces_concluded_status():
    """seek_emergency always forces assessment_status to 'concluded', even if given as 'gathering'."""
    raw = json.dumps(_triage_payload(urgency_tier="seek_emergency", assessment_status="gathering"))
    result = prompt_engine.try_extract_json(raw)
    assert result["urgency_tier"] == "seek_emergency"
    assert result["assessment_status"] == "concluded"


def test_coerce_schema_missing_disclaimer_filled_with_default():
    """A missing/blank disclaimer is filled with DEFAULT_DISCLAIMER."""
    raw = json.dumps(_triage_payload(disclaimer=""))
    result = prompt_engine.try_extract_json(raw)
    assert result["disclaimer"] == prompt_engine.DEFAULT_DISCLAIMER


def test_parse_triage_json_falls_back_on_pure_prose():
    """parse_triage_json (unlike try_extract_json) wraps unparseable prose into a safe schema dict."""
    raw = "This is not JSON at all."
    result = prompt_engine.parse_triage_json(raw)
    assert result["urgency_tier"] == "consult_doctor"
    assert result["assessment_status"] == "gathering"
    assert result["disclaimer"] == prompt_engine.DEFAULT_DISCLAIMER
    assert result["possible_conditions"] == []


def test_parse_triage_json_passes_through_valid_json():
    """parse_triage_json returns the coerced dict directly when the JSON is valid."""
    raw = json.dumps(_triage_payload(urgency_tier="seek_emergency"))
    result = prompt_engine.parse_triage_json(raw)
    assert result["urgency_tier"] == "seek_emergency"
    assert result["assessment_status"] == "concluded"
