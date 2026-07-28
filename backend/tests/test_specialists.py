"""Unit tests for specialist routing/registry in services/specialists.py."""
from services import specialists


def test_resolve_specialty_exact_display_name():
    """A model's exact display name maps to its canonical key."""
    assert specialists.resolve_specialty("Dermatologist") == "dermatology"
    assert specialists.resolve_specialty("Cardiologist") == "cardiology"


def test_resolve_specialty_alias_and_case_insensitive():
    """Free-text lower/mixed case and alias substrings still route correctly."""
    assert specialists.resolve_specialty("dermatology") == "dermatology"
    assert specialists.resolve_specialty("I think this needs a skin doctor") == "dermatology"
    assert specialists.resolve_specialty("possible heart issue, see cardio") == "cardiology"


def test_resolve_specialty_unknown_falls_back_to_default():
    """Unrecognised or missing free text falls back to the default specialty."""
    assert specialists.resolve_specialty("Podiatrist") == specialists.DEFAULT_SPECIALTY
    assert specialists.resolve_specialty(None) == specialists.DEFAULT_SPECIALTY
    assert specialists.resolve_specialty("") == specialists.DEFAULT_SPECIALTY


def test_display_name_and_persona_nonempty_for_every_specialist():
    """Every canonical specialist key resolves to a non-empty display name and persona."""
    for key in specialists.SPECIALISTS:
        assert specialists.display_name(key).strip() != ""
        assert specialists.persona(key).strip() != ""


def test_display_name_and_persona_fall_back_for_unknown_key():
    """An unknown or None key falls back to the default specialist's display name/persona."""
    default_display = specialists.display_name(specialists.DEFAULT_SPECIALTY)
    assert specialists.display_name("not_a_real_key") == default_display
    assert specialists.display_name(None) == default_display
    assert specialists.persona(None) == specialists.persona(specialists.DEFAULT_SPECIALTY)
