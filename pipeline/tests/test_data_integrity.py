"""
Regression tests for the defects that actually shipped.

Each test here corresponds to something that was wrong in app/data or in the
pipeline and was not caught by anything. They run against the real committed
data, so CI fails if any of it comes back.
"""

import json
import re
import sys
from pathlib import Path

import pytest

PIPELINE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PIPELINE))

from config import USE_CASE_TAGS  # noqa: E402

DATA = PIPELINE.parent / "app" / "data"


def load(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def models():
    return load("models.json")


@pytest.fixture(scope="module")
def live(models):
    return [m for m in models if m.get("status", "live") == "live"]


# --------------------------------------------------------------------------
# model-sources.json: its absence made the whole weekly sync a no-op that
# still reported success.
# --------------------------------------------------------------------------

def test_model_sources_exists_and_is_not_empty():
    sources = load("model-sources.json")
    assert sources, (
        "model-sources.json is empty. update_models.py skips every model without "
        "it, so the weekly sync silently does nothing."
    )


def test_every_live_model_has_an_openrouter_id(live):
    sources = load("model-sources.json")
    missing = [m["id"] for m in live if not sources.get(m["id"], {}).get("openrouterId")]
    assert not missing, f"live models with no OpenRouter id, so never synced: {missing}"


# --------------------------------------------------------------------------
# Wizard scores: 59 of 64 models had none, so they all tied at a default 5 and
# ranking collapsed into "cheapest wins".
# --------------------------------------------------------------------------

def test_every_live_model_has_wizard_scores(live):
    scores = load("wizard-scores.json")
    missing = [m["id"] for m in live if m["id"] not in scores]
    assert not missing, f"live models with no Wizard scores would all tie: {missing}"


def test_legacy_models_are_never_recommendable(models):
    scores = load("wizard-scores.json")
    legacy = [m["id"] for m in models if m.get("status") == "legacy"]
    scored = [mid for mid in legacy if mid in scores]
    assert not scored, f"retired models must not be recommended: {scored}"


def test_wizard_scores_are_not_all_zero():
    """The LLM returned coding:0/agentic:0 for models it had no evidence about,
    which ranked them below unscored models rather than above."""
    for mid, entry in load("wizard-scores.json").items():
        values = entry["scores"].values()
        assert any(v > 0 for v in values), f"{mid}: every score is 0"
        assert all(0 <= v <= 10 for v in values), f"{mid}: score outside 0-10"


# --------------------------------------------------------------------------
# Specs: maxOutputTokens was a blanket 16384 placeholder on 33 models, and
# releaseDate was "2025/2026" on every one of them.
# --------------------------------------------------------------------------

def test_release_dates_are_real_dates(models):
    bad = [m["id"] for m in models if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", m["releaseDate"])]
    assert not bad, f"releaseDate must be YYYY-MM-DD, not a placeholder: {bad}"


def test_max_output_never_exceeds_context_window(models):
    bad = [
        m["id"] for m in models
        if m["specs"].get("maxOutputTokens")
        and m["specs"]["maxOutputTokens"] > m["specs"]["contextWindow"]
    ]
    assert not bad, f"maxOutputTokens larger than the context window: {bad}"


def test_max_output_is_not_a_uniform_placeholder(live):
    """A single value repeated across most of the directory means it was typed in,
    not measured."""
    values = [m["specs"].get("maxOutputTokens") for m in live]
    most_common = max(set(values), key=values.count)
    share = values.count(most_common) / len(values)
    assert share < 0.6, (
        f"{share:.0%} of live models report maxOutputTokens={most_common}, which "
        f"looks like a placeholder rather than real data"
    )


def test_prices_are_non_negative(models):
    for m in models:
        p = m["specs"]["pricing"]
        assert p["input"] >= 0 and p["output"] >= 0, f"{m['id']}: negative price"


# --------------------------------------------------------------------------
# Benchmarks: the directory shipped round placeholder scores (MMLU 90,
# HumanEval 92) with nothing backing them.
# --------------------------------------------------------------------------

def test_every_benchmark_names_its_source(models):
    for m in models:
        for b in m.get("benchmarks", []):
            assert b.get("source"), (
                f"{m['id']}: benchmark {b['name']!r} has no source. An unsourced "
                f"score is exactly what this site exists to call out."
            )


def test_benchmark_caveat_is_always_present(models):
    bad = [m["id"] for m in models if not m.get("benchmarkCaveat", "").strip()]
    assert not bad, f"missing benchmarkCaveat: {bad}"


# --------------------------------------------------------------------------
# Tags: the data held 22 distinct tags against a 7-tag vocabulary, so the
# frontend filters and the pipeline disagreed about what a tag was.
# --------------------------------------------------------------------------

def test_all_tags_are_in_the_shared_vocabulary(models):
    unknown = {t for m in models for t in m["useCaseTags"] if t not in USE_CASE_TAGS}
    assert not unknown, f"tags not in config.USE_CASE_TAGS: {sorted(unknown)}"


def test_frontend_tag_list_matches_the_pipeline():
    """app/data/tags.json feeds the directory filters. If it drifts from
    config.USE_CASE_TAGS, models become unreachable by filter."""
    frontend = [t["tag"] for t in load("tags.json")]
    assert frontend == list(USE_CASE_TAGS), "tags.json is out of sync with config.USE_CASE_TAGS"


# --------------------------------------------------------------------------
# Editorial content and identity.
# --------------------------------------------------------------------------

def test_no_duplicate_ids(models):
    ids = [m["id"] for m in models]
    dupes = {i for i in ids if ids.count(i) > 1}
    assert not dupes, f"duplicate model ids: {sorted(dupes)}"


def test_every_model_has_a_summary_and_tradeoffs(models):
    for m in models:
        assert m["summary"].strip(), f"{m['id']}: empty summary"
        assert m["inPractice"]["strengths"], f"{m['id']}: no strengths"
        assert m["inPractice"]["weaknesses"], f"{m['id']}: no weaknesses"


def test_model_names_carry_no_provider_prefix(models):
    """Names like "OpenAI: GPT-6 Sol" render the provider twice on a card."""
    bad = [m["id"] for m in models if ":" in m["name"]]
    assert not bad, f"strip the provider prefix from these names: {bad}"


def test_legacy_models_explain_why_they_are_retired(models):
    bad = [m["id"] for m in models if m.get("status") == "legacy" and not m.get("retiredNote")]
    assert not bad, f"legacy models need a retiredNote: {bad}"


def test_open_weights_flag_is_not_inferred_from_provider(models):
    """`openSource` was set by provider name, which marked every API-only Qwen
    Max/Plus tier and Mistral Medium as open source."""
    for mid, expected in [
        ("qwen3-8-max-prime", False),
        ("qwen3-8-flash", False),
        ("mistral-medium-3-5", False),
        ("qwen3-8-27b", True),
        ("gpt-oss-120b", True),
    ]:
        model = next((m for m in models if m["id"] == mid), None)
        if model is None:
            continue
        assert model["openSource"] is expected, (
            f"{mid}: openSource should be {expected}"
        )


# --------------------------------------------------------------------------
# News: news.json was hand-written with source URLs that do not resolve.
# --------------------------------------------------------------------------

def test_news_references_only_known_models(models):
    news = load("news.json")
    ids = {m["id"] for m in models}
    for i, item in enumerate(news.get("items", [])):
        unknown = [mid for mid in item["modelIds"] if mid not in ids]
        assert not unknown, f"news.items[{i}] references unknown models: {unknown}"


def test_news_urls_are_absolute():
    news = load("news.json")
    for i, item in enumerate(news.get("items", [])):
        assert item["sourceUrl"].startswith(("http://", "https://")), (
            f"news.items[{i}]: {item['sourceUrl']!r} is not a URL"
        )


def test_model_news_references_only_known_models(models):
    ids = {m["id"] for m in models}
    for mid, items in load("model-news.json").items():
        assert mid in ids, f"model-news.json references unknown model {mid!r}"
        for item in items:
            assert item["url"].startswith(("http://", "https://")), f"{mid}: bad url"
