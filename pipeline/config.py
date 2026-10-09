import os

PROVIDER_ALLOWLIST = [
    "anthropic", "openai", "google", "meta-llama", 
    "mistralai", "deepseek", "qwen", "x-ai", "cohere"
]

RSS_FEEDS = [
    "https://huggingface.co/blog/feed.xml",
    # Add other provider blogs as needed
]

# Map provider lowercase name to a logo URL or identifier used in the frontend
PROVIDER_LOGO_MAP = {
    "anthropic": "/logos/anthropic.png",
    "openai": "/logos/openai.png",
    "google": "/logos/google.png",
    "meta-llama": "/logos/meta.png",
    "mistralai": "/logos/mistral.png",
    "deepseek": "/logos/deepseek.png",
    "qwen": "/logos/qwen.png",
    "x-ai": "/logos/xai.png",
    "cohere": "/logos/cohere.png",
}

# Vocabulary for use case tags.
#
# This is the single source of truth. build_models.py hard-fails if curated.py
# uses a tag that is not listed here, and the frontend reads this same list via
# app/data/tags.json, so the directory filters can never drift from the data.
USE_CASE_TAGS = [
    "coding",
    "writing",
    "research",
    "agentic",
    "complex reasoning",
    "cheap volume",
    "chat",
    "long context",
    "multimodal",
    "open weights",
    "vision",
    "math",
    "multilingual",
]

# Plain-English gloss for each tag, shown as a tooltip in the directory filters.
TAG_DESCRIPTIONS = {
    "coding": "Writing, reviewing and debugging code",
    "writing": "Articles, emails, copy and long-form prose",
    "research": "Reading documents and answering questions from them",
    "agentic": "Running multi-step tasks and calling tools on its own",
    "complex reasoning": "Hard problems that need careful step-by-step thinking",
    "cheap volume": "Cheap enough to run over thousands of items",
    "chat": "Fast enough to sit behind a live conversation",
    "long context": "Reads very large documents or whole codebases at once",
    "multimodal": "Takes more than just text as input",
    "open weights": "You can download it and run it on your own hardware",
    "vision": "Can look at images",
    "math": "Arithmetic, proofs and quantitative work",
    "multilingual": "Strong in languages other than English",
}

# Blended price cap for 'low budget' filter
LOW_BUDGET_PRICE_CAP = 1.0 # $1 per 1M tokens blended

# LLM configs
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_CONTENT_MODEL = os.environ.get("GEMINI_CONTENT_MODEL", "gemini-2.5-flash")
MAX_MODELS_PER_RUN = int(os.environ.get("MAX_MODELS_PER_RUN", "5"))
MIN_CONFIDENCE_TO_PUBLISH = os.environ.get("MIN_CONFIDENCE_TO_PUBLISH", "medium")

# Wizard configs
WIZARD_LLM_ENABLED = os.environ.get("WIZARD_LLM", "0") == "1"
