"""
Gatekeeper for app/data. The weekly workflow commits straight to main, so this is
the only thing standing between a bad pipeline run and the live site. It must fail
loudly and it must fail on anything it is not sure about.

Every check here exists because the corresponding mistake actually shipped:
placeholder benchmark scores with no source, models flagged open-source that are
API-only, invented news URLs, tags the frontend has no filter for, and a Wizard
ranking 60 models that all scored a default 5.
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from config import USE_CASE_TAGS
from schemas import AIModel, NewsDigest
from storage import load_json
from pydantic import ValidationError

errors = []
warnings = []


def error(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def validate_models(models):
    print(f"Validating {len(models)} models...")

    for idx, item in enumerate(models):
        try:
            AIModel(**item)
        except ValidationError as e:
            error(f"models[{idx}] (id={item.get('id')}) fails the schema:\n{e}")
            continue

    ids = [m["id"] for m in models]
    for dupe in sorted({i for i in ids if ids.count(i) > 1}):
        error(f"duplicate model id: {dupe}")

    for m in models:
        mid = m["id"]
        specs = m["specs"]
        pricing = specs["pricing"]
        is_live = m.get("status", "live") == "live"

        # Tags must exist in the shared vocabulary or the directory filters
        # silently drop the model.
        for tag in m["useCaseTags"]:
            if tag not in USE_CASE_TAGS:
                error(f"{mid}: tag {tag!r} is not in config.USE_CASE_TAGS")
        if not m["useCaseTags"]:
            warn(f"{mid}: no useCaseTags, so it will not appear under any filter")

        # Every published score needs a source. An unsourced number is the exact
        # defect this site exists to call out.
        for b in m.get("benchmarks", []):
            if not b.get("source"):
                error(f"{mid}: benchmark {b.get('name')!r} has no source")

        # Specs that are obviously placeholders.
        if specs["contextWindow"] <= 0:
            error(f"{mid}: contextWindow is {specs['contextWindow']}")
        if specs.get("maxOutputTokens") in (None, 0) and is_live:
            warn(f"{mid}: no maxOutputTokens")
        if specs.get("maxOutputTokens") and specs["maxOutputTokens"] > specs["contextWindow"]:
            error(
                f"{mid}: maxOutputTokens ({specs['maxOutputTokens']}) exceeds "
                f"contextWindow ({specs['contextWindow']})"
            )
        if pricing["input"] < 0 or pricing["output"] < 0:
            error(f"{mid}: negative price")
        if is_live and pricing["input"] == 0 and pricing["output"] == 0:
            warn(f"{mid}: priced at zero — check this is really a free model")

        # releaseDate must be a real date, not "2026" or "2025/2026".
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", m["releaseDate"]):
            error(f"{mid}: releaseDate {m['releaseDate']!r} is not YYYY-MM-DD")
        if m.get("lastUpdated") and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", m["lastUpdated"]):
            error(f"{mid}: lastUpdated {m['lastUpdated']!r} is not YYYY-MM-DD")

        # Editorial content must actually be there.
        if not m["summary"].strip():
            error(f"{mid}: empty summary")
        if not m["inPractice"]["strengths"]:
            warn(f"{mid}: no strengths listed")
        if not m["inPractice"]["weaknesses"]:
            warn(f"{mid}: no weaknesses listed — every model has trade-offs")
        if not m["benchmarkCaveat"].strip():
            error(f"{mid}: empty benchmarkCaveat")
        if not m.get("howToUse", {}).get("docsUrl"):
            warn(f"{mid}: no docsUrl, so the detail page cannot link to the provider")

        if m.get("status") == "legacy" and not m.get("retiredNote"):
            error(f"{mid}: legacy models must explain why they are retired")


def validate_sources(models, sources):
    """model-sources.json drives the whole weekly sync. If it is empty, the sync
    is a no-op that reports success — the bug that broke auto-updates."""
    if not sources:
        error(
            "model-sources.json is missing or empty. update_models.py cannot sync "
            "anything without it. Run: python pipeline/build_models.py"
        )
        return

    live = [m for m in models if m.get("status", "live") == "live"]
    unmapped = [m["id"] for m in live if not sources.get(m["id"], {}).get("openrouterId")]
    if unmapped:
        warn(f"{len(unmapped)} live models have no OpenRouter id: {', '.join(unmapped[:8])}")

    model_ids = {m["id"] for m in models}
    for sid in sources:
        if sid not in model_ids:
            warn(f"model-sources.json references unknown model {sid!r}")


def validate_wizard(models, scores):
    """The Wizard was returning the three cheapest models for every question
    because 59 of 64 entries had no scores and therefore all tied."""
    if not scores:
        error("wizard-scores.json is empty — the Wizard cannot rank anything")
        return

    live = [m for m in models if m.get("status", "live") == "live"]
    unscored = [m["id"] for m in live if m["id"] not in scores]
    if unscored:
        error(
            f"{len(unscored)} live models have no Wizard scores and would all tie at "
            f"the default: {', '.join(unscored[:8])}"
        )

    legacy_scored = [
        m["id"] for m in models
        if m.get("status") == "legacy" and m["id"] in scores
    ]
    if legacy_scored:
        error(f"legacy models must not be recommendable: {', '.join(legacy_scored)}")

    keys = {"coding", "writing", "research", "agentic", "longContext", "cheapVolume"}
    for mid, entry in scores.items():
        s = entry.get("scores", {})
        if set(s) != keys:
            error(f"wizard-scores[{mid}]: expected keys {sorted(keys)}, got {sorted(s)}")
            continue
        for k, v in s.items():
            if not isinstance(v, int) or not 0 <= v <= 10:
                error(f"wizard-scores[{mid}].{k} = {v!r}, expected an int 0-10")
        if all(v == 0 for v in s.values()):
            error(f"wizard-scores[{mid}]: every score is 0, which is never a real rating")


def validate_news(models):
    news = load_json("news.json", default=None)
    if not news:
        warn("no news.json — the News page will show its empty state")
        return
    try:
        digest = NewsDigest(**news)
    except ValidationError as e:
        error(f"news.json fails the schema:\n{e}")
        return

    model_ids = {m["id"] for m in models}
    for i, item in enumerate(digest.items):
        if not item.sourceUrl.startswith(("http://", "https://")):
            error(f"news.items[{i}]: sourceUrl {item.sourceUrl!r} is not a URL")
        for mid in item.modelIds:
            if mid not in model_ids:
                error(f"news.items[{i}]: references unknown model {mid!r}")
    print(f"news.json is valid ({len(digest.items)} items).")

    model_news = load_json("model-news.json", default={})
    for mid, items in model_news.items():
        if mid not in model_ids:
            warn(f"model-news.json references unknown model {mid!r}")
        for item in items:
            if not item.get("url", "").startswith(("http://", "https://")):
                error(f"model-news[{mid}]: bad url {item.get('url')!r}")


def main():
    models = load_json("models.json", default=[])
    if not models:
        print("FATAL: models.json is empty or missing.")
        sys.exit(1)

    validate_models(models)
    validate_sources(models, load_json("model-sources.json", default={}))
    validate_wizard(models, load_json("wizard-scores.json", default={}))
    validate_news(models)

    if warnings:
        print(f"\n{len(warnings)} warning(s):")
        for w in warnings:
            print(f"  ! {w}")

    if errors:
        print(f"\n{len(errors)} error(s):")
        for e in errors:
            print(f"  x {e}")
        print("\nValidation FAILED. Nothing should be published from this state.")
        sys.exit(1)

    live = sum(1 for m in models if m.get("status", "live") == "live")
    print(f"\nAll validations passed: {live} live models, {len(models) - live} legacy.")


if __name__ == "__main__":
    main()
