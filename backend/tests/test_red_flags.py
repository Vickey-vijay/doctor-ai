"""Tests for the deterministic emergency red-flag safety net.

This is the one behaviour that must never regress: an emergency that reaches the model and is
mis-classified still has to be escalated. Over-triage is acceptable, under-triage is not.
"""
import json
import pathlib

import pytest

from services import red_flags

SCENARIOS = json.loads(
    (pathlib.Path(__file__).resolve().parents[1] / "evaluation" / "scenarios.json").read_text(
        encoding="utf-8"
    )
)["scenarios"]


@pytest.mark.parametrize(
    "text",
    [
        "I have crushing chest pain spreading to my left arm and jaw.",
        "I am suddenly struggling to breathe even sitting still.",
        "I hit my head in a fall, briefly blacked out, and have vomited twice since.",
        "There is a deep cut still bleeding heavily after fifteen minutes of pressure.",
        "My face is drooping and my speech is slurred.",
        "My throat feels tight and my lips are swelling.",
        "I suddenly got the worst headache of my life.",
        "I have been coughing up blood.",
        "I honestly want to die and have thought about killing myself.",
        "I have a fever of 39.5 C and I am becoming confused and very drowsy.",
        "I spilled boiling water and have a large blistering burn covering most of my forearm.",
    ],
)
def test_emergencies_are_detected(text):
    """Textbook emergency phrasings raise at least one red flag."""
    assert red_flags.detect(text), f"no red flag raised for: {text}"


@pytest.mark.parametrize(
    "text",
    [
        "I have a mild headache this evening after a long day at work.",
        "I got a mild sunburn on my shoulders yesterday, a bit red but no blisters.",
        "I touched a hot pan and have a small red mark on my finger, no blister.",
        "I have a small dry, itchy patch of eczema on my elbow.",
        "I have a tiny paper cut on my finger, it barely bled.",
        "My seasonal allergies are acting up with itchy eyes and sneezing.",
        "I get occasional heartburn after eating spicy food.",
    ],
)
def test_benign_symptoms_do_not_escalate(text):
    """Everyday complaints must not be escalated — over-triage still has a cost."""
    assert red_flags.detect(text) == [], f"unexpected red flag for: {text}"


@pytest.mark.parametrize(
    "text",
    [
        "I have no chest pain at all.",
        "Denies shortness of breath.",
        "The doctor said it is not a stroke, no slurred speech.",
    ],
)
def test_negated_symptoms_are_ignored(text):
    """A denied symptom ('no chest pain') must not trigger an escalation."""
    assert red_flags.detect(text) == [], f"negation not honoured for: {text}"


def test_negation_does_not_leak_across_sentences():
    """'No fever. Chest pain started an hour ago.' must still flag the chest pain."""
    assert "chest pain" in red_flags.detect("No fever. Chest pain started an hour ago.")


def test_every_evaluation_emergency_is_caught():
    """All seek_emergency scenarios in the evaluation set raise a red flag."""
    missed = [
        s["id"] for s in SCENARIOS
        if s["expected_urgency"] == "seek_emergency" and not red_flags.detect(s["symptom"])
    ]
    assert missed == [], f"emergency scenarios missed by the safety net: {missed}"


def test_no_evaluation_scenario_is_over_escalated():
    """No self-care or consult-a-doctor scenario is wrongly flagged as an emergency."""
    wrong = [
        (s["id"], red_flags.detect(s["symptom"]))
        for s in SCENARIOS
        if s["expected_urgency"] != "seek_emergency" and red_flags.detect(s["symptom"])
    ]
    assert wrong == [], f"scenarios wrongly escalated: {wrong}"


def test_empty_input_is_safe():
    """Empty or missing text returns no flags rather than raising."""
    assert red_flags.detect("") == []
    assert red_flags.detect(None) == []
