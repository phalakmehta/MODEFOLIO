import json
import os
from pathlib import Path

# Data directory path relative to this script
DATA_DIR = Path(__file__).parent.parent / "app" / "data"

def ensure_data_dir():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    # create news-archive inside data dir
    (DATA_DIR / "news-archive").mkdir(parents=True, exist_ok=True)

def load_json(filename: str, default=None):
    filepath = DATA_DIR / filename
    if not filepath.exists():
        if default is not None:
            return default
        return {}
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filename: str, data):
    ensure_data_dir()
    filepath = DATA_DIR / filename
    # stable formatting: indent=2, ensure_ascii=False
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, sort_keys=False)
        f.write('\n') # trailing newline
