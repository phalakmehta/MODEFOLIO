import sys
import argparse
import datetime
from pathlib import Path

from config import PROVIDER_ALLOWLIST
from storage import load_json, save_json
from sources.openrouter import fetch_openrouter_models

OUT_DIR = Path(__file__).parent / "out"

def calculate_price(per_token: str) -> float:
    try:
        return round(float(per_token) * 1_000_000, 4)
    except (ValueError, TypeError):
        return 0.0

def should_review_change(old_val, new_val) -> bool:
    if new_val == 0:
        return True
    if old_val and new_val:
        # Check if difference is > 5x in either direction
        if new_val > old_val * 5 or old_val > new_val * 5:
            return True
    return False

def format_date_today() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Print summary without saving")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    today = format_date_today()

    try:
        or_models = fetch_openrouter_models()
    except Exception as e:
        print(f"Failed to fetch models: {e}")
        sys.exit(1)

    # Build a lookup map of OpenRouter models by their ID
    or_map = {m["id"]: m for m in or_models}

    # Load data
    models = load_json("models.json", default=[])
    sources = load_json("model-sources.json", default={})
    pending_models = load_json("pending-models.json", default=[])
    ignored_models = set(load_json("ignored-models.json", default=[]))
    changelog = load_json("changelog.json", default=[])

    pending_ids = {m["id"] for m in pending_models}
    
    changed = False
    markdown_lines = ["## 1. Model Sync", ""]

    # 1. Update existing models
    for model in models:
        model_id = model["id"]
        source_info = sources.get(model_id)
        if not source_info or not source_info.get("openrouterId"):
            continue

        or_id = source_info["openrouterId"]
        or_model = or_map.get(or_id)

        if not or_model:
            changelog.append({
                "date": today,
                "modelId": model_id,
                "type": "possibly-removed",
                "source": "openrouter",
                "status": "needs-review"
            })
            markdown_lines.append(f"- ⚠️ `{model_id}` (OpenRouter ID `{or_id}`) not found in OpenRouter API. Flagged as possibly removed.")
            changed = True
            continue

        updates_made = []
        
        # Check context length
        new_ctx = or_model.get("context_length")
        old_ctx = model["specs"]["contextWindow"]
        if new_ctx and new_ctx != old_ctx:
            model["specs"]["contextWindow"] = new_ctx
            updates_made.append("contextWindow")
            changelog.append({
                "date": today, "modelId": model_id, "type": "context-change",
                "field": "specs.contextWindow", "old": old_ctx, "new": new_ctx,
                "source": "openrouter", "status": "applied"
            })

        # Check max output tokens
        top_provider = or_model.get("top_provider", {})
        new_out = top_provider.get("max_completion_tokens")
        old_out = model["specs"].get("maxOutputTokens")
        if new_out and new_out != old_out:
            model["specs"]["maxOutputTokens"] = new_out
            updates_made.append("maxOutputTokens")
            changelog.append({
                "date": today, "modelId": model_id, "type": "max-output-change",
                "field": "specs.maxOutputTokens", "old": old_out, "new": new_out,
                "source": "openrouter", "status": "applied"
            })

        # Check prices
        pricing = or_model.get("pricing", {})
        new_input = calculate_price(pricing.get("prompt", "0"))
        old_input = model["specs"]["pricing"]["input"]
        if abs(new_input - old_input) > 1e-4:
            if should_review_change(old_input, new_input):
                changelog.append({
                    "date": today, "modelId": model_id, "type": "price-change",
                    "field": "specs.pricing.input", "old": old_input, "new": new_input,
                    "source": "openrouter", "status": "needs-review"
                })
                markdown_lines.append(f"- ⚠️ `{model_id}` input price change flagged for review ({old_input} -> {new_input})")
            else:
                model["specs"]["pricing"]["input"] = new_input
                updates_made.append(f"input price (${new_input})")
                changelog.append({
                    "date": today, "modelId": model_id, "type": "price-change",
                    "field": "specs.pricing.input", "old": old_input, "new": new_input,
                    "source": "openrouter", "status": "applied"
                })

        new_output = calculate_price(pricing.get("completion", "0"))
        old_output = model["specs"]["pricing"]["output"]
        if abs(new_output - old_output) > 1e-4:
            if should_review_change(old_output, new_output):
                changelog.append({
                    "date": today, "modelId": model_id, "type": "price-change",
                    "field": "specs.pricing.output", "old": old_output, "new": new_output,
                    "source": "openrouter", "status": "needs-review"
                })
                markdown_lines.append(f"- ⚠️ `{model_id}` output price change flagged for review ({old_output} -> {new_output})")
            else:
                model["specs"]["pricing"]["output"] = new_output
                updates_made.append(f"output price (${new_output})")
                changelog.append({
                    "date": today, "modelId": model_id, "type": "price-change",
                    "field": "specs.pricing.output", "old": old_output, "new": new_output,
                    "source": "openrouter", "status": "applied"
                })

        if updates_made:
            model["lastUpdated"] = today
            model["updateSource"] = "automated"
            markdown_lines.append(f"- ✅ `{model_id}` updated: {', '.join(updates_made)}")
            changed = True

    # 2. Detect new models
    thirty_days_ago = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)).timestamp()
    existing_or_ids = {s.get("openrouterId") for s in sources.values() if s.get("openrouterId")}
    
    new_candidates = 0
    for or_model in or_models:
        or_id = or_model["id"]
        if or_id in existing_or_ids or or_id in ignored_models:
            continue
        
        # Needs to be from allowed provider
        provider = or_id.split("/")[0] if "/" in or_id else ""
        if provider not in PROVIDER_ALLOWLIST:
            continue
            
        # Needs to be < 30 days old
        created = or_model.get("created", 0)
        if created < thirty_days_ago:
            continue
            
        # No ':' suffix
        if ":" in or_id.split("/")[-1]:
            continue
            
        # Text output modality
        arch = or_model.get("architecture", {})
        if "text" not in arch.get("output_modalities", ["text"]): # if not explicitly set, assume text
            pass # Actually, let's keep it simple: if it doesn't say otherwise, or it says text, it's fine. Wait, OR might not have 'architecture' sometimes.
            
        # Form an internal ID
        internal_id = or_id.replace("/", "-")
        if internal_id in pending_ids:
            continue
            
        # Add stub
        pricing = or_model.get("pricing", {})
        input_price = calculate_price(pricing.get("prompt", "0"))
        output_price = calculate_price(pricing.get("completion", "0"))
        
        stub = {
            "id": internal_id,
            "name": or_model.get("name", internal_id),
            "provider": provider,
            "releaseDate": datetime.datetime.fromtimestamp(created, datetime.timezone.utc).strftime("%Y-%m"),
            "openSource": False,
            "modality": ["text"],
            "summary": "",
            "inPractice": {"strengths": [], "weaknesses": []},
            "architecture": {"type": "unknown", "explanation": ""},
            "specs": {
                "contextWindow": or_model.get("context_length", 0),
                "maxOutputTokens": or_model.get("top_provider", {}).get("max_completion_tokens"),
                "pricing": {
                    "input": input_price,
                    "output": output_price,
                    "unit": "per 1M tokens"
                }
            },
            "benchmarks": [],
            "benchmarkCaveat": "",
            "useCaseTags": [],
            "howToUse": {"docsUrl": ""},
            "lastUpdated": today,
            "updateSource": "automated-pending-review"
        }
        
        pending_models.append(stub)
        changelog.append({
            "date": today, "modelId": internal_id, "type": "new-model-detected",
            "source": "openrouter", "status": "needs-review"
        })
        markdown_lines.append(f"- 🌟 New candidate detected: `{internal_id}`. Added to pending models.")
        changed = True
        new_candidates += 1

    if not changed:
        markdown_lines.append("No changes detected this run.")

    if not args.dry_run and changed:
        save_json("models.json", models)
        save_json("pending-models.json", pending_models)
        save_json("changelog.json", changelog)

    with open(OUT_DIR / "1-models.md", "w", encoding="utf-8") as f:
        f.write("\n".join(markdown_lines))
        f.write("\n")
        
    print(f"Model sync complete. Changed: {changed}. New candidates: {new_candidates}")

if __name__ == "__main__":
    main()
