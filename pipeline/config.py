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

# Vocabulary for use case tags
USE_CASE_TAGS = [
    "coding", "writing", "research", "agentic", 
    "complex reasoning", "cheap volume", "chat"
]

# Blended price cap for 'low budget' filter
LOW_BUDGET_PRICE_CAP = 1.0 # $1 per 1M tokens blended

# LLM configs
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_CONTENT_MODEL = os.environ.get("GEMINI_CONTENT_MODEL", "gemini-2.5-flash")
MAX_MODELS_PER_RUN = int(os.environ.get("MAX_MODELS_PER_RUN", "5"))
MIN_CONFIDENCE_TO_PUBLISH = os.environ.get("MIN_CONFIDENCE_TO_PUBLISH", "medium")

# Wizard configs
WIZARD_LLM_ENABLED = os.environ.get("WIZARD_LLM", "0") == "1"
