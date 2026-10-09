import ast
import sys
import os
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import generate_content
from generate_content import (
    DraftContent, DraftInPractice, DraftArchitecture, WizardScores,
    VerificationResponse, ExtractedBenchmark,
)

PENDING = {
    "id": "acme-widget-1.5",
    "openrouterId": "acme/widget-1.5",
    "name": "Widget 1.5",
    "provider": "Acme",
    "specs": {},
}


def make_draft():
    return DraftContent(
        summary="A small model.",
        inPractice=DraftInPractice(strengths=["Fast"], weaknesses=["Shallow"]),
        architecture=DraftArchitecture(archType="dense", explanation=""),
        benchmarkCaveat="",
        claims=[],
        confidence="high",
        insufficientEvidence=[],
        useCaseTags=["coding", "not-a-real-tag"],
        extractedBenchmarks=[ExtractedBenchmark(name="MMLU", score=80.0)],
        wizardScores=WizardScores(coding=6, writing=5, research=5, agentic=4, longContext=5, cheapVolume=8),
    )


def run(pending, sources=None, generate_side_effect=None, tmp_path=None):
    files = {"pending-models.json": pending, "model-sources.json": sources or {}}
    with patch.object(generate_content, "OUT_DIR", tmp_path), \
         patch("generate_content.build_evidence_pack", return_value="[E1] evidence"), \
         patch("generate_content.generate_json", side_effect=generate_side_effect or []) as gen, \
         patch("generate_content.load_json", side_effect=lambda f, default=None: files.get(f, default)), \
         patch("generate_content.save_json") as save:
        try:
            generate_content.main()
        except SystemExit:
            pass
    saved = {c.args[0]: c.args[1] for c in save.mock_calls}
    return saved, gen, (tmp_path / "3-content.md").read_text(encoding="utf-8")


def test_drafts_never_publish(tmp_path):
    saved, _, report = run(
        [dict(PENDING)],
        generate_side_effect=[make_draft(), VerificationResponse(unsupportedSentences=[], flagged=False)],
        tmp_path=tmp_path,
    )
    # build_models.py owns these; writing them here would be wiped next week.
    assert "models.json" not in saved
    assert "wizard-scores.json" not in saved

    [entry] = saved["pending-models.json"]
    assert entry["draft"]["confidence"] == "high"
    assert entry["draft"]["useCaseTags"] == ["coding"]
    assert entry["draft"]["wizardScores"]["cheapVolume"] == 8
    assert "acme/widget-1.5" in report


def test_snippet_is_valid_python(tmp_path):
    _, _, report = run(
        [dict(PENDING)],
        generate_side_effect=[make_draft(), VerificationResponse(unsupportedSentences=[], flagged=False)],
        tmp_path=tmp_path,
    )
    snippet = report.split("```python\n")[1].split("```")[0]
    # Wrapped the way curated_more.py holds entries.
    tree = ast.parse("X = {\n" + snippet + "\n}")
    call = tree.body[0].value.values[0]
    kwargs = {k.arg for k in call.keywords}
    assert {"id", "name", "provider", "summary", "tags", "scores"} <= kwargs
    # Extracted scores have no named source, so they must not become benchmarks.
    assert "benchmarks" not in kwargs
    assert "unverified benchmark" in snippet


def test_flagged_draft_is_low_confidence(tmp_path):
    saved, _, report = run(
        [dict(PENDING)],
        generate_side_effect=[make_draft(), VerificationResponse(unsupportedSentences=["A small model."], flagged=True)],
        tmp_path=tmp_path,
    )
    draft = saved["pending-models.json"][0]["draft"]
    assert draft["confidence"] == "low"
    assert draft["flagged"] is True
    assert "VERIFIER FLAGGED" in report


def test_already_drafted_is_not_redrafted(tmp_path):
    entry = dict(PENDING, draft={"confidence": "high"})
    saved, gen, report = run([entry], tmp_path=tmp_path)
    gen.assert_not_called()
    assert "awaiting review" in report


def test_curated_models_are_pruned_from_pending(tmp_path):
    sources = {"widget-1-5": {"openrouterId": "acme/widget-1.5", "aliases": []}}
    saved, gen, _ = run([dict(PENDING)], sources=sources, tmp_path=tmp_path)
    gen.assert_not_called()
    assert saved["pending-models.json"] == []
