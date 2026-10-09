import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from build_models import diff_models, retire_missing

TODAY = "2026-10-12"


def model(mid, status="live", price_in=1.0, price_out=4.0, ctx=128_000, max_out=8_000):
    return {
        "id": mid,
        "status": status,
        "specs": {
            "contextWindow": ctx,
            "maxOutputTokens": max_out,
            "pricing": {"input": price_in, "output": price_out, "unit": "per 1M tokens"},
        },
        "howToUse": {"docsUrl": "https://example.com", "openRouterUrl": "https://openrouter.ai/x"},
    }


def test_no_previous_build_logs_nothing():
    assert diff_models([], [model("a")], TODAY) == []


def test_unchanged_models_log_nothing():
    assert diff_models([model("a")], [model("a")], TODAY) == []


def test_price_drop_is_logged_with_old_and_new():
    [e] = diff_models([model("a", price_in=3.0)], [model("a", price_in=2.5)], TODAY)
    assert e["type"] == "price-change"
    assert e["field"] == "specs.pricing.input"
    assert (e["old"], e["new"]) == (3.0, 2.5)
    assert e["date"] == TODAY


def test_context_and_max_output_changes_are_logged():
    changes = diff_models([model("a")], [model("a", ctx=1_000_000, max_out=None)], TODAY)
    assert {c["type"] for c in changes} == {"context-change", "max-output-change"}


def test_added_retired_and_restored_models():
    previous = [model("gone"), model("back", status="legacy")]
    current = [model("new"), model("gone", status="legacy"), model("back")]
    types = {e["modelId"]: e["type"] for e in diff_models(previous, current, TODAY)}
    assert types == {"new": "model-added", "gone": "model-retired", "back": "model-restored"}


def test_frozen_legacy_models_never_log_spec_changes():
    previous = [model("old", status="legacy", price_in=1.0)]
    current = [model("old", status="legacy", price_in=9.0)]
    assert diff_models(previous, current, TODAY) == []


def test_missing_model_keeps_its_page_as_retired():
    previous = {"a": model("a")}
    retired = retire_missing({"id": "a"}, previous, TODAY)
    assert retired["status"] == "legacy"
    assert retired["retiredNote"] == f"Removed from OpenRouter on {TODAY}"
    # The OpenRouter link would be dead; the provider docs are still useful.
    assert "openRouterUrl" not in retired["howToUse"]
    assert retired["howToUse"]["docsUrl"]
    # The previous build's entry is not mutated.
    assert previous["a"]["status"] == "live"


def test_already_retired_model_keeps_its_original_date():
    earlier = dict(model("a", status="legacy"), retiredNote="Removed from OpenRouter on 2026-09-01")
    assert retire_missing({"id": "a"}, {"a": earlier}, TODAY)["retiredNote"].endswith("2026-09-01")


def test_never_published_missing_model_is_dropped():
    assert retire_missing({"id": "a"}, {}, TODAY) is None
