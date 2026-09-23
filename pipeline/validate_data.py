import sys
from storage import load_json, DATA_DIR
from schemas import AIModel, NewsDigest
from pydantic import ValidationError

def validate_models():
    models_data = load_json("models.json", default=[])
    success = True
    print(f"Validating {len(models_data)} models...")
    for idx, item in enumerate(models_data):
        try:
            AIModel(**item)
        except ValidationError as e:
            print(f"Validation failed for model at index {idx} (id: {item.get('id')}):\n{e}")
            success = False
    return success

def validate_news():
    news_data = load_json("news.json", default=None)
    if not news_data:
        print("No news.json found, skipping.")
        return True
    try:
        NewsDigest(**news_data)
        print("news.json is valid.")
        return True
    except ValidationError as e:
        print(f"Validation failed for news.json:\n{e}")
        return False

def main():
    models_ok = validate_models()
    news_ok = validate_news()
    if not models_ok or not news_ok:
        sys.exit(1)
    print("All validations passed.")

if __name__ == "__main__":
    main()
