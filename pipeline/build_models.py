"""
Rebuild app/data/models.json from curated editorial content + live OpenRouter specs.

This is the single place models.json is generated. The split of responsibility is
deliberate and worth keeping:

  curated.py / curated_more.py   human judgement only (prose, tags, Wizard scores)
  OpenRouter API                 every number (context, max output, prices, dates)

Because no spec is ever typed by hand, prices and context windows cannot silently
drift out of date, and nobody can "remember" a number wrong. Re-running this
script is always safe: it regenerates from the live API.

It also writes the two files the weekly pipeline depends on:

  model-sources.json   maps our ids to OpenRouter ids. update_models.py is a no-op
                       without this file, which is exactly the bug it used to have.
  wizard-scores.json   capability scores for every model, so the Wizard is not
                       ranking 60 models that all scored a default 5.

Usage:
    python pipeline/build_models.py              # fetch live, then write
    python pipeline/build_models.py --dry-run    # report, write nothing
    python pipeline/build_models.py --offline FILE
"""

import argparse
import datetime
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from config import USE_CASE_TAGS
from curated import CURATED
from curated_more import CURATED_MORE, LEGACY
from storage import load_json, save_json
from sources.openrouter import fetch_openrouter_models

LIVE = {**CURATED, **CURATED_MORE}

OUT_DIR = Path(__file__).parent / "out"

# If more than this share of curated models is missing from the API response,
# the response is broken (an outage or a truncated page), not a mass delisting.
# Writing it would retire half the directory overnight.
MAX_MISSING_SHARE = 0.25

# The changelog feeds the "What changed" page. Keep it bounded.
CHANGELOG_LIMIT = 1000

# Fields whose changes are recorded in changelog.json, and the entry type for each.
WATCHED_FIELDS = [
    ("specs.pricing.input", "price-change"),
    ("specs.pricing.output", "price-change"),
    ("specs.contextWindow", "context-change"),
    ("specs.maxOutputTokens", "max-output-change"),
]

VENDOR_CAVEAT = (
    "These scores are self-reported by the vendor and measured under their own "
    "conditions. Treat them as a ceiling rather than a promise, and test the model "
    "on your own work before trusting the number."
)
NO_BENCH_CAVEAT = (
    "No independently verified benchmark scores have been published for this model. "
    "We would rather show you nothing than repeat a figure we cannot point at a "
    "source for. Judge it on its price, its context window and your own testing."
)


def to_per_million(per_token) -> float:
    """OpenRouter quotes per-token prices as strings. Convert to $ per 1M tokens."""
    try:
        value = float(per_token)
    except (TypeError, ValueError):
        return 0.0
    # OpenRouter uses -1 to mean "variable / routed pricing".
    if value < 0:
        return 0.0
    return round(value * 1_000_000, 6)


def release_date(or_model: dict) -> str:
    created = or_model.get("created")
    if not created:
        return ""
    return datetime.datetime.fromtimestamp(
        created, datetime.timezone.utc
    ).strftime("%Y-%m-%d")


def build_aliases(name: str, or_id: str) -> list:
    """
    Search terms for the news pipeline. build_news.py matches candidate headlines
    against these, so they need to include the forms a journalist would actually
    write, not just our internal id.
    """
    aliases = {name}
    # "Claude Opus 5.5" -> "Opus 5.5"; "OpenAI: GPT-6 Sol" -> "GPT-6 Sol"
    if ":" in name:
        aliases.add(name.split(":", 1)[1].strip())
    parts = name.split()
    if len(parts) > 1:
        aliases.add(" ".join(parts[1:]))
    aliases.add(or_id.split("/")[-1])
    # Strip anything too short to be a useful search term — "5.5" would match
    # every headline containing a version number.
    return sorted(a for a in aliases if len(a) >= 4)


def modality_from_or(or_model: dict, fallback: list) -> list:
    """Prefer OpenRouter's declared input modalities over our curated guess."""
    arch = or_model.get("architecture") or {}
    declared = arch.get("input_modalities")
    if declared:
        ordered = [m for m in ("text", "image", "audio", "video", "file") if m in declared]
        if ordered:
            return ordered
    return fallback


def make_entry(entry: dict, or_model: dict, today: str) -> dict:
    arch_type, arch_why = entry["arch"]
    benchmarks = entry.get("benchmarks", [])
    pricing = or_model.get("pricing") or {}
    top = or_model.get("top_provider") or {}

    return {
        "id": entry["id"],
        "name": entry["name"],
        "provider": entry["provider"],
        "status": "live",
        "releaseDate": release_date(or_model),
        "openSource": entry["open_weights"],
        "modality": modality_from_or(or_model, entry["modality"]),
        "summary": entry["summary"],
        "inPractice": {
            "strengths": entry["strengths"],
            "weaknesses": entry["weaknesses"],
        },
        "architecture": {"type": arch_type, "explanation": arch_why},
        "specs": {
            "contextWindow": or_model.get("context_length") or 0,
            "maxOutputTokens": top.get("max_completion_tokens"),
            "pricing": {
                "input": to_per_million(pricing.get("prompt", 0)),
                "output": to_per_million(pricing.get("completion", 0)),
                "unit": "per 1M tokens",
            },
        },
        "benchmarks": benchmarks,
        "benchmarkCaveat": VENDOR_CAVEAT if benchmarks else NO_BENCH_CAVEAT,
        "useCaseTags": entry["tags"],
        "howToUse": {
            "docsUrl": entry["docs"],
            "openRouterUrl": f"https://openrouter.ai/{or_model['id']}",
        },
        "lastUpdated": today,
        "updateSource": "curated+openrouter",
    }


def make_legacy_entry(model_id: str, entry: dict, today: str) -> dict:
    arch_type, arch_why = entry["arch"]
    benchmarks = entry.get("benchmarks", [])
    return {
        "id": model_id,
        "name": entry["name"],
        "provider": entry["provider"],
        "status": "legacy",
        "retiredNote": entry["retired"],
        "releaseDate": entry["release"],
        "openSource": entry["open_weights"],
        "modality": entry["modality"],
        "summary": entry["summary"],
        "inPractice": {
            "strengths": entry["strengths"],
            "weaknesses": entry["weaknesses"],
        },
        "architecture": {"type": arch_type, "explanation": arch_why},
        "specs": {
            "contextWindow": entry["context"],
            "maxOutputTokens": entry["max_output"],
            "pricing": {
                "input": entry["price_in"],
                "output": entry["price_out"],
                "unit": "per 1M tokens",
            },
        },
        "benchmarks": benchmarks,
        "benchmarkCaveat": VENDOR_CAVEAT if benchmarks else NO_BENCH_CAVEAT,
        "useCaseTags": entry["tags"],
        "howToUse": {"docsUrl": entry["docs"]},
        "lastUpdated": today,
        "updateSource": "curated-frozen",
    }


def retire_missing(entry: dict, previous_by_id: dict, today: str):
    """
    A curated model OpenRouter no longer lists. Rather than let its page 404,
    keep the last entry we published and mark it retired. If OpenRouter lists it
    again, the next build restores it as live automatically.
    """
    prev = previous_by_id.get(entry["id"])
    if not prev:
        return None
    if prev.get("status") == "legacy":
        # Retired on an earlier run; keep the original removal date.
        return prev
    retired = dict(prev)
    retired["status"] = "legacy"
    # The detail page appends its own full stop.
    retired["retiredNote"] = f"Removed from OpenRouter on {today}"
    retired["updateSource"] = "openrouter-removed"
    retired["howToUse"] = {
        k: v for k, v in (prev.get("howToUse") or {}).items() if k != "openRouterUrl"
    }
    return retired


def get_path(d: dict, path: str):
    for key in path.split("."):
        if not isinstance(d, dict):
            return None
        d = d.get(key)
    return d


def diff_models(previous: list, current: list, today: str) -> list:
    """Changelog entries describing how `current` differs from `previous`."""
    # With nothing to compare against (a fresh checkout), every model would read
    # as newly added. That is noise, not news.
    if not previous:
        return []

    prev = {m["id"]: m for m in previous}
    entries = []
    for m in current:
        base = {"date": today, "modelId": m["id"], "source": "openrouter", "status": "applied"}
        old = prev.get(m["id"])
        if old is None:
            entries.append({**base, "type": "model-added"})
            continue

        was_live, is_live = old.get("status", "live") == "live", m["status"] == "live"
        if was_live and not is_live:
            entries.append({**base, "type": "model-retired"})
            continue
        if is_live and not was_live:
            entries.append({**base, "type": "model-restored"})
            continue
        if not is_live:
            continue

        for path, kind in WATCHED_FIELDS:
            o, n = get_path(old, path), get_path(m, path)
            if o == n:
                continue
            if isinstance(o, (int, float)) and isinstance(n, (int, float)) and abs(o - n) < 1e-9:
                continue
            entries.append({**base, "type": kind, "field": path, "old": o, "new": n})
    return entries


def describe_change(e: dict) -> str:
    kind = e["type"]
    if kind == "model-added":
        return "added to the directory"
    if kind == "model-retired":
        return "no longer listed on OpenRouter, marked retired"
    if kind == "model-restored":
        return "listed on OpenRouter again, restored"
    label = {
        "specs.pricing.input": "input price",
        "specs.pricing.output": "output price",
        "specs.contextWindow": "context window",
        "specs.maxOutputTokens": "max output",
    }.get(e.get("field"), e.get("field"))
    return f"{label} {e.get('old')} → {e.get('new')}"


def write_report(models: list, changes: list, retired: list, dropped: list, dry_run: bool):
    """The run summary and weekly commit message are assembled from pipeline/out/*.md."""
    live = sum(1 for m in models if m["status"] == "live")
    lines = ["## 0. Model Rebuild", ""]
    lines.append(f"{len(models)} models ({live} live, {len(models) - live} retired)."
                 + (" Dry run, nothing written." if dry_run else ""))
    lines.append("")
    if retired:
        lines.append("⚠️ **No longer on OpenRouter, now shown as retired:** "
                     + ", ".join(f"`{i}`" for i in retired)
                     + ". Move them to `LEGACY` in curated_more.py, or delete them, if this is permanent.")
    if dropped:
        lines.append("⚠️ **Curated but never published, and not on OpenRouter:** "
                     + ", ".join(f"`{i}`" for i in dropped) + ". Check their OpenRouter ids.")
    if changes:
        lines.append("**Changes since last build:**")
        lines += [f"- `{e['modelId']}`: {describe_change(e)}" for e in changes]
    elif not (retired or dropped):
        lines.append("No spec or price changes since the last build.")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "0-build.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--offline", help="Read the OpenRouter payload from a file")
    args = parser.parse_args()

    if args.offline:
        or_models = json.loads(Path(args.offline).read_text(encoding="utf-8"))
        if isinstance(or_models, dict):
            or_models = or_models["data"]
        print(f"Loaded {len(or_models)} models from {args.offline}")
    else:
        or_models = fetch_openrouter_models()
        print(f"Fetched {len(or_models)} models from OpenRouter")

    or_map = {m["id"]: m for m in or_models}
    today = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

    previous = load_json("models.json", default=[])
    previous_by_id = {m["id"]: m for m in previous}

    models, sources, wizard_scores = [], {}, {}
    missing, bad_tags = [], []

    for or_id, entry in LIVE.items():
        or_model = or_map.get(or_id)
        if not or_model:
            missing.append(or_id)
            continue

        unknown = [t for t in entry["tags"] if t not in USE_CASE_TAGS]
        if unknown:
            bad_tags.append((entry["id"], unknown))

        models.append(make_entry(entry, or_model, today))
        sources[entry["id"]] = {
            "openrouterId": or_id,
            "aliases": build_aliases(entry["name"], or_id),
        }
        wizard_scores[entry["id"]] = {"scores": entry["scores"], "curated": True}

    if len(missing) > MAX_MISSING_SHARE * len(LIVE):
        print(
            f"FATAL: {len(missing)} of {len(LIVE)} curated models are missing from the "
            f"OpenRouter response. That looks like a broken API response, not real "
            f"delistings, so nothing was written."
        )
        sys.exit(1)

    # Missing models keep their page as retired (no Wizard score, no source entry).
    retired, dropped = [], []
    for or_id in missing:
        kept = retire_missing(LIVE[or_id], previous_by_id, today)
        if kept:
            models.append(kept)
            retired.append(kept["id"])
        else:
            dropped.append(LIVE[or_id]["id"])

    for model_id, entry in LEGACY.items():
        models.append(make_legacy_entry(model_id, entry, today))
        unknown = [t for t in entry["tags"] if t not in USE_CASE_TAGS]
        if unknown:
            bad_tags.append((model_id, unknown))
        # Deliberately no wizard score and no source entry: legacy models must not
        # be recommended, and there is nothing live to sync them against.

    # Sort newest-first so the directory leads with what people actually want.
    models.sort(key=lambda m: (m["status"] != "live", m["releaseDate"]), reverse=False)
    models.sort(key=lambda m: m["releaseDate"], reverse=True)
    models.sort(key=lambda m: m["status"] == "legacy")

    if bad_tags:
        for model_id, tags in bad_tags:
            print(f"ERROR: {model_id} uses tags not in USE_CASE_TAGS: {tags}")
        sys.exit(1)

    if missing:
        print(f"\nWARNING: {len(missing)} curated models are no longer on OpenRouter.")
        for or_id in missing:
            print(f"  - {or_id}")
        print("They are shown as retired. Move them to LEGACY in curated_more.py, or drop them.")

    ids = [m["id"] for m in models]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        print(f"ERROR: duplicate model ids: {sorted(dupes)}")
        sys.exit(1)

    live_count = sum(1 for m in models if m["status"] == "live")
    print(f"\nBuilt {len(models)} models ({live_count} live, {len(models) - live_count} legacy)")

    changes = diff_models(previous, models, today)
    for e in changes:
        print(f"  change: {e['modelId']}: {describe_change(e)}")
    write_report(models, changes, retired, dropped, args.dry_run)

    if args.dry_run:
        print("Dry run — nothing written.")
        return

    save_json("models.json", models)
    save_json("model-sources.json", sources)
    save_json("wizard-scores.json", wizard_scores)
    if changes:
        changelog = load_json("changelog.json", default=[])
        save_json("changelog.json", (changelog + changes)[-CHANGELOG_LIMIT:])
    print(f"Wrote models.json, model-sources.json, wizard-scores.json ({len(changes)} changes logged)")


if __name__ == "__main__":
    main()
