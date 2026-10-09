"""
Curated editorial content for Modelfolio, keyed by OpenRouter model id.

This file holds ONLY human-written judgement: the plain-English summary, what the
model is good and bad at, its use-case tags and its Wizard capability scores.

It deliberately holds NO specs. Context window, max output tokens and prices are
always read live from the OpenRouter API by build_models.py, so they cannot drift
out of date or be guessed at.

Rules for editing this file:
  - `summary` is for someone who has never used an API. No jargon without a gloss.
  - `strengths` / `weaknesses` describe observable behaviour, not marketing.
  - `benchmarks` may ONLY contain scores that are publicly reported, and each one
    must name its source. If there is no public score, leave the list empty. Never
    invent a number to fill the field.
  - `scores` (0-10) drive the Wizard. They are relative rankings within this
    directory, not absolute measurements. Keep them honest: a cheap 3B model must
    not score 8 on coding just because it is cheap.
  - `open_weights` is True only when the weights are genuinely downloadable.
    Being from Qwen, Mistral or Meta does not by itself make a model open.

TAGS must come from config.USE_CASE_TAGS.
"""

# Tag shorthand to keep the table readable
CODE, WRITE, RESEARCH = "coding", "writing", "research"
AGENT, REASON = "agentic", "complex reasoning"
CHEAP, CHAT, LONG = "cheap volume", "chat", "long context"
MULTI, OPEN, VISION = "multimodal", "open weights", "vision"
MATH, LANG = "math", "multilingual"


def s(coding, writing, research, agentic, long_context, cheap_volume):
    """Wizard capability scores, 0-10, relative to the rest of this directory."""
    return {
        "coding": coding,
        "writing": writing,
        "research": research,
        "agentic": agentic,
        "longContext": long_context,
        "cheapVolume": cheap_volume,
    }


DENSE = "dense"
MOE = "mixture-of-experts"
UNKNOWN = "unknown"

MOE_WHY = (
    "Only a fraction of the model switches on for any given word, so it answers "
    "faster and costs less to run than its total size suggests."
)
DENSE_WHY = (
    "The whole model runs on every word. That makes it predictable and even in "
    "quality, but it costs more to run than a sparse model of the same size."
)
UNKNOWN_WHY = (
    "The provider has not published how this model is built, so we do not claim "
    "to know. Treat its speed and cost as the facts you can actually rely on."
)

# ---------------------------------------------------------------------------
# LIVE MODELS
# ---------------------------------------------------------------------------

CURATED = {
    # ----------------------------- Anthropic -----------------------------
    "anthropic/claude-opus-5.5": dict(
        id="claude-opus-5-5", name="Claude Opus 5.5", provider="Anthropic",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "Anthropic's flagship. The model to reach for when a task is genuinely "
            "hard and you would rather pay more than babysit the output. It holds a "
            "plan together over long multi-step work better than anything else here."
        ),
        strengths=[
            "Stays coherent across very long, multi-step coding and research tasks",
            "Follows fiddly instructions and output formats closely",
            "Pushes back and says it is unsure instead of bluffing",
        ],
        weaknesses=[
            "Twice the price of Sonnet 5.5 for work that often does not need it",
            "Slower to first word than the Luna or Flash tiers",
            "Can over-explain when you wanted a one-line answer",
        ],
        tags=[CODE, AGENT, REASON, RESEARCH, LONG],
        scores=s(10, 9, 10, 10, 9, 2),
        docs="https://docs.anthropic.com/en/docs/about-claude/models",
    ),
    "anthropic/claude-sonnet-5.5": dict(
        id="claude-sonnet-5-5", name="Claude Sonnet 5.5", provider="Anthropic",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The default pick for most people, most of the time. Close enough to Opus "
            "on everyday coding and writing that the gap rarely shows, at half the "
            "price. If you are unsure where to start, start here."
        ),
        strengths=[
            "Best quality-per-dollar in the directory for general work",
            "Fast enough to sit behind a user-facing chat box",
            "Strong at code review and refactoring, not just writing new code",
        ],
        weaknesses=[
            "Gives up earlier than Opus on the genuinely hard reasoning problems",
            "Still far too expensive for bulk classification or tagging jobs",
        ],
        tags=[CODE, WRITE, AGENT, CHAT, LONG],
        scores=s(9, 9, 8, 9, 9, 4),
        docs="https://docs.anthropic.com/en/docs/about-claude/models",
    ),
    "anthropic/claude-haiku-5.5": dict(
        id="claude-haiku-5-5", name="Claude Haiku 5.5", provider="Anthropic",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "Anthropic's cheap, fast tier, and the newest model in this directory. "
            "It gives you the full million-token context and Claude's instruction-"
            "following at roughly a twentieth of Sonnet's price."
        ),
        strengths=[
            "Very cheap for a model that still reads a million tokens at once",
            "Quick responses, suitable for live chat and autocomplete",
            "Keeps Claude's habit of respecting your output format",
        ],
        weaknesses=[
            "Noticeably weaker on multi-step reasoning than Sonnet 5.5",
            "Released 2026-10-07, so real-world reports are still thin",
        ],
        tags=[CHEAP, CHAT, LONG, WRITE],
        scores=s(6, 7, 6, 5, 8, 9),
        docs="https://docs.anthropic.com/en/docs/about-claude/models",
    ),
    "anthropic/claude-fable-5.1": dict(
        id="claude-fable-5-1", name="Claude Fable 5.1", provider="Anthropic",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "Anthropic's most expensive model, aimed at long-form prose rather than "
            "code. At $10 in and $50 out it is a specialist tool: worth it when the "
            "writing itself is the product, hard to justify otherwise."
        ),
        strengths=[
            "Holds voice, tone and narrative consistency over very long pieces",
            "Strong editorial judgement when rewriting rather than drafting",
        ],
        weaknesses=[
            "Tied with GPT-6 Astra as the priciest model in this directory",
            "Overkill for short copy, emails or summaries",
            "Not the one to pick for code",
        ],
        tags=[WRITE, LONG, REASON],
        scores=s(6, 10, 8, 5, 9, 1),
        docs="https://docs.anthropic.com/en/docs/about-claude/models",
    ),
    "anthropic/claude-opus-5": dict(
        id="claude-opus-5", name="Claude Opus 5", provider="Anthropic",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The previous Opus generation. Still a very capable frontier model, but "
            "Opus 5.5 is both better and cheaper, so there is little reason to start "
            "a new project on this one."
        ),
        strengths=[
            "Frontier-level reasoning and long-context handling",
            "Well documented, with plenty of community experience behind it",
        ],
        weaknesses=[
            "Costs more than Opus 5.5 while performing worse — superseded",
            "No reason to choose it for new work",
        ],
        tags=[CODE, AGENT, REASON, LONG],
        scores=s(9, 8, 9, 9, 9, 2),
        docs="https://docs.anthropic.com/en/docs/about-claude/models",
    ),
    "anthropic/claude-sonnet-5": dict(
        id="claude-sonnet-5", name="Claude Sonnet 5", provider="Anthropic",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The previous Sonnet. Priced identically to Sonnet 5.5, which replaced it, "
            "so treat this as a pinned version for people who need reproducible output "
            "rather than a live recommendation."
        ),
        strengths=[
            "Same price as Sonnet 5.5 with a stable, frozen set of behaviours",
            "Good general-purpose coding and writing",
        ],
        weaknesses=[
            "Strictly superseded by Sonnet 5.5 at the same price",
        ],
        tags=[CODE, WRITE, CHAT, LONG],
        scores=s(8, 8, 8, 8, 9, 4),
        docs="https://docs.anthropic.com/en/docs/about-claude/models",
    ),

    # ------------------------------ OpenAI -------------------------------
    "openai/gpt-6.1-sol": dict(
        id="gpt-6-1-sol", name="GPT-6.1 Sol", provider="OpenAI",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "OpenAI's newest mid-flagship, and the best-value entry in the GPT-6 line. "
            "Same price as GPT-6 Sol but a generation newer, with a 1.05M context "
            "window — enough to hold a large codebase in a single request."
        ),
        strengths=[
            "A very large 1.05M-token context window",
            "Mid-tier price for near-flagship quality",
            "Strong tool use and structured JSON output",
        ],
        weaknesses=[
            "Released 2026-09-29, so independent testing is still limited",
            "Astra is still ahead on the hardest reasoning problems",
        ],
        tags=[CODE, AGENT, REASON, LONG],
        scores=s(9, 8, 9, 9, 10, 4),
        docs="https://platform.openai.com/docs/models",
    ),
    "openai/gpt-6-astra": dict(
        id="gpt-6-astra", name="GPT-6 Astra", provider="OpenAI",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "OpenAI's top-end reasoning model and one of the two most expensive here. "
            "Built for problems where you would otherwise hand the work to a specialist, "
            "and priced so that you will think twice before using it by default."
        ),
        strengths=[
            "Top-tier performance on hard maths, proofs and research-grade analysis",
            "Reads 1.05M tokens, so whole repositories fit in one request",
        ],
        weaknesses=[
            "$10 in / $50 out makes casual use genuinely expensive",
            "Slow — not an interactive-chat model",
            "Wasted on anything a mid-tier model can already do",
        ],
        tags=[REASON, RESEARCH, MATH, LONG, AGENT],
        scores=s(10, 9, 10, 9, 10, 1),
        docs="https://platform.openai.com/docs/models",
    ),
    "openai/gpt-6-sol": dict(
        id="gpt-6-sol", name="GPT-6 Sol", provider="OpenAI",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The workhorse of the GPT-6 family: most of Astra's capability at a fifth "
            "of the price. A sensible OpenAI default, though GPT-6.1 Sol now costs the "
            "same and is a generation newer."
        ),
        strengths=[
            "Strong all-rounder at a mid-tier price",
            "1.05M context window",
            "Reliable function calling and JSON mode",
        ],
        weaknesses=[
            "GPT-6.1 Sol is newer at the same price — prefer that",
            "Clearly behind Astra on the hardest problems",
        ],
        tags=[CODE, WRITE, AGENT, LONG],
        scores=s(9, 8, 8, 8, 10, 4),
        docs="https://platform.openai.com/docs/models",
    ),
    "openai/gpt-6-luna": dict(
        id="gpt-6-luna", name="GPT-6 Luna", provider="OpenAI",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The cheap end of GPT-6, and remarkable value: ten cents per million input "
            "tokens while still reading 1.05M tokens at once. The obvious choice for "
            "high-volume pipelines that still need a long context."
        ),
        strengths=[
            "Extremely cheap for its context window",
            "Fast, so it works behind live chat",
            "Good enough at summarising, extraction and classification at scale",
        ],
        weaknesses=[
            "Not a reasoning model — it will confidently flub multi-step logic",
            "Weak on hard coding tasks; use Sol or Astra for those",
        ],
        tags=[CHEAP, CHAT, LONG, WRITE],
        scores=s(5, 7, 6, 5, 10, 10),
        docs="https://platform.openai.com/docs/models",
    ),
    "openai/gpt-5.4": dict(
        id="gpt-5-4", name="GPT-5.4", provider="OpenAI",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The last strong model of the GPT-5 line. Still perfectly good, and cheaper "
            "than it was at launch, but GPT-6 Sol beats it on both price and capability."
        ),
        strengths=[
            "Mature and heavily documented, with predictable behaviour",
            "1.05M context window",
        ],
        weaknesses=[
            "Superseded by GPT-6 Sol on price and quality",
        ],
        tags=[CODE, WRITE, RESEARCH, LONG],
        scores=s(8, 8, 8, 7, 9, 3),
        docs="https://platform.openai.com/docs/models",
    ),
    "openai/gpt-5.3-codex": dict(
        id="gpt-5-3-codex", name="GPT-5.3-Codex", provider="OpenAI",
        open_weights=False, modality=["text"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "A coding specialist, tuned for working inside real repositories rather "
            "than answering code questions in the abstract. Worth testing against a "
            "general model on your own codebase before committing to it."
        ),
        strengths=[
            "Tuned specifically for multi-file edits and repository-scale work",
            "Good at running a plan across many tool calls without losing the thread",
        ],
        weaknesses=[
            "Output price of $14 per million is steep for a mid-tier model",
            "Narrow: noticeably worse than general models outside code",
        ],
        tags=[CODE, AGENT],
        scores=s(9, 4, 5, 9, 7, 3),
        docs="https://platform.openai.com/docs/models",
    ),
    "openai/gpt-5": dict(
        id="gpt-5", name="GPT-5", provider="OpenAI",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The 2025 flagship that set the current price expectations. Two generations "
            "old now, but cheap, stable and extremely well understood — a reasonable "
            "pick if you value predictability over peak capability."
        ),
        strengths=[
            "Very well documented, with a huge body of community knowledge",
            "Good value at $1.25 in / $10 out",
        ],
        weaknesses=[
            "Two generations behind the current frontier",
            "400K context looks small next to the GPT-6 line's 1.05M",
        ],
        tags=[CODE, WRITE, RESEARCH, CHAT],
        scores=s(8, 8, 8, 7, 7, 5),
        docs="https://platform.openai.com/docs/models",
    ),
    "openai/gpt-5-mini": dict(
        id="gpt-5-mini", name="GPT-5 Mini", provider="OpenAI",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The small, cheap GPT-5. A solid, boring choice for high-volume text jobs "
            "where you need something more capable than a tiny open model but do not "
            "want frontier prices."
        ),
        strengths=[
            "Cheap and fast, with a generous 400K context",
            "Handles summarising, extraction and routing well",
        ],
        weaknesses=[
            "GPT-6 Luna is cheaper, newer and has a larger context",
            "Not suitable for hard reasoning or serious coding",
        ],
        tags=[CHEAP, CHAT, WRITE],
        scores=s(5, 6, 6, 4, 7, 9),
        docs="https://platform.openai.com/docs/models",
    ),
    "openai/gpt-oss-120b": dict(
        id="gpt-oss-120b", name="gpt-oss-120b", provider="OpenAI",
        open_weights=True, modality=["text"], arch=(MOE, MOE_WHY),
        summary=(
            "OpenAI's open-weight release: you can download it and run it on your own "
            "hardware. Hosted here it is also one of the cheapest capable models "
            "available, at under four cents per million input tokens."
        ),
        strengths=[
            "Weights are downloadable — no vendor lock-in, and it can run offline",
            "Astonishingly cheap when hosted",
            "Genuinely useful at reasoning for an open model",
        ],
        weaknesses=[
            "131K context is small by current standards",
            "Behind OpenAI's hosted models on every axis except price",
        ],
        tags=[OPEN, CHEAP, CODE, REASON],
        scores=s(7, 6, 7, 6, 4, 10),
        docs="https://platform.openai.com/docs/models",
    ),
    "openai/o3": dict(
        id="o3", name="o3", provider="OpenAI",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The 2025 reasoning model that made step-by-step 'thinking' mainstream. It "
            "spends extra tokens working a problem out before answering, which is why "
            "it is slower and why its output bill runs higher than you expect."
        ),
        strengths=[
            "Strong on maths and logic puzzles for its price",
            "Shows its reasoning, which makes mistakes easier to spot",
        ],
        weaknesses=[
            "Slow, and bills you for reasoning tokens you never see",
            "Superseded by the GPT-6 line for most work",
        ],
        tags=[REASON, MATH, RESEARCH],
        scores=s(8, 6, 8, 6, 6, 5),
        docs="https://platform.openai.com/docs/models",
    ),
    "openai/gpt-4o": dict(
        id="gpt-4o", name="GPT-4o", provider="OpenAI",
        open_weights=False, modality=["text", "image", "audio"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The 2024 model that most people still picture when they think 'ChatGPT'. "
            "Kept here because so much tutorial and library code assumes it, not "
            "because you should start a new project with it."
        ),
        strengths=[
            "Handles text, images and audio in one model",
            "The most widely supported model in third-party tooling",
        ],
        weaknesses=[
            "Comprehensively beaten by newer models at the same price",
            "128K context is small now",
        ],
        tags=[MULTI, CHAT, VISION],
        scores=s(6, 7, 6, 5, 4, 5),
        docs="https://platform.openai.com/docs/models",
        benchmarks=[
            {"name": "MMLU", "score": 88.7, "source": "OpenAI, reported at launch (2024-05)"},
        ],
    ),
    "openai/gpt-4o-mini": dict(
        id="gpt-4o-mini", name="GPT-4o mini", provider="OpenAI",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The cheap 2024 workhorse that a great deal of production code still runs "
            "on. Newer small models beat it on both price and quality, so treat it as "
            "a compatibility option."
        ),
        strengths=[
            "Cheap, fast and supported essentially everywhere",
        ],
        weaknesses=[
            "GPT-6 Luna and gpt-oss-120b are cheaper and better",
            "128K context, and weak at reasoning",
        ],
        tags=[CHEAP, CHAT],
        scores=s(4, 5, 4, 3, 4, 9),
        docs="https://platform.openai.com/docs/models",
        benchmarks=[
            {"name": "MMLU", "score": 82.0, "source": "OpenAI, reported at launch (2024-07)"},
        ],
    ),

    # ------------------------------ Google -------------------------------
    "google/gemini-3.8-flash": dict(
        id="gemini-3-8-flash", name="Gemini 3.8 Flash", provider="Google",
        open_weights=False, modality=["text", "image", "audio", "video"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "Google's current Flash model and the best multimodal all-rounder here. "
            "It takes video and audio as input, not just text and images, which no "
            "other model in this directory does at this price."
        ),
        strengths=[
            "Accepts video and audio directly, as well as text and images",
            "1.05M context at a mid-tier price",
            "Fast enough for interactive use",
        ],
        weaknesses=[
            "65K max output caps very long single generations",
            "Behind Claude and GPT-6 on hard multi-step reasoning",
        ],
        tags=[MULTI, VISION, LONG, CHEAP, CHAT],
        scores=s(7, 7, 8, 7, 10, 7),
        docs="https://ai.google.dev/gemini-api/docs/models",
    ),
    "google/gemini-3.1-pro-preview": dict(
        id="gemini-3-1-pro-preview", name="Gemini 3.1 Pro (Preview)", provider="Google",
        open_weights=False, modality=["text", "image", "audio", "video"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "Google's high-end Pro tier, still labelled preview. It is the strongest "
            "Gemini for reasoning, but 'preview' means Google can change or withdraw "
            "it, so do not build anything load-bearing on it yet."
        ),
        strengths=[
            "Best Gemini for complex reasoning and research",
            "Full multimodal input with a 1.05M context window",
        ],
        weaknesses=[
            "Preview status — behaviour and availability can change without notice",
            "$12 per million output tokens is firmly premium",
        ],
        tags=[REASON, RESEARCH, MULTI, LONG],
        scores=s(8, 8, 9, 8, 10, 3),
        docs="https://ai.google.dev/gemini-api/docs/models",
    ),
    "google/gemini-3.5-flash-lite": dict(
        id="gemini-3-5-flash-lite", name="Gemini 3.5 Flash Lite", provider="Google",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The budget Gemini. Cheap, fast, and still reads a million tokens — a good "
            "fit for processing large document piles where you need breadth rather than "
            "deep reasoning."
        ),
        strengths=[
            "A million-token context for thirty cents per million input tokens",
            "Very fast",
        ],
        weaknesses=[
            "Shallow on anything requiring real reasoning",
            "Quality drops off on long, intricate instructions",
        ],
        tags=[CHEAP, LONG, CHAT],
        scores=s(5, 6, 6, 4, 9, 9),
        docs="https://ai.google.dev/gemini-api/docs/models",
    ),
    "google/gemini-2.5-pro": dict(
        id="gemini-2-5-pro", name="Gemini 2.5 Pro", provider="Google",
        open_weights=False, modality=["text", "image", "audio", "video"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The 2025 Gemini flagship. Genuinely good and now reasonably priced, but "
            "two Gemini generations behind. Plenty of existing code targets it."
        ),
        strengths=[
            "Solid reasoning with full multimodal input",
            "Well understood, with stable behaviour",
        ],
        weaknesses=[
            "Two generations old",
        ],
        tags=[RESEARCH, REASON, MULTI, LONG],
        scores=s(7, 7, 8, 6, 9, 5),
        docs="https://ai.google.dev/gemini-api/docs/models",
    ),
    "google/gemini-2.5-flash": dict(
        id="gemini-2-5-flash", name="Gemini 2.5 Flash", provider="Google",
        open_weights=False, modality=["text", "image", "audio", "video"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The 2025 Flash workhorse, still one of the cheapest ways to get a "
            "million-token context with multimodal input. A lot of production "
            "pipelines are still happily running on it."
        ),
        strengths=[
            "Cheap, fast, million-token context, multimodal input",
        ],
        weaknesses=[
            "Superseded by the 3.x Flash line",
            "Weak at reasoning and hard code",
        ],
        tags=[CHEAP, MULTI, LONG, CHAT],
        scores=s(5, 6, 6, 4, 9, 9),
        docs="https://ai.google.dev/gemini-api/docs/models",
    ),
    "google/gemini-2.5-flash-lite": dict(
        id="gemini-2-5-flash-lite", name="Gemini 2.5 Flash Lite", provider="Google",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "One of the cheapest million-token models anywhere, at ten cents per "
            "million input tokens. Use it for bulk work — tagging, routing, first-pass "
            "filtering — and hand anything hard to a bigger model."
        ),
        strengths=[
            "Among the cheapest long-context models available",
            "Very fast",
        ],
        weaknesses=[
            "Clearly limited: expect shallow answers on anything non-trivial",
        ],
        tags=[CHEAP, LONG],
        scores=s(4, 5, 5, 3, 9, 10),
        docs="https://ai.google.dev/gemini-api/docs/models",
    ),
    "google/gemma-4-31b-it": dict(
        id="gemma-4-31b", name="Gemma 4 31B", provider="Google",
        open_weights=True, modality=["text", "image"], arch=(DENSE, DENSE_WHY),
        summary=(
            "Google's current open-weight model. You can download it and run it "
            "yourself, and at nine cents per million input tokens it is also very "
            "cheap to rent — a good starting point for self-hosting."
        ),
        strengths=[
            "Downloadable weights, so it can run on your own hardware or offline",
            "Very cheap hosted, with a 262K context",
        ],
        weaknesses=[
            "A 31B model cannot match the hosted frontier on hard tasks",
            "16K max output is restrictive for long generations",
        ],
        tags=[OPEN, CHEAP, CHAT],
        scores=s(5, 6, 5, 4, 6, 9),
        docs="https://ai.google.dev/gemma/docs",
    ),
    "google/gemma-4-26b-a4b-it": dict(
        id="gemma-4-26b-a4b", name="Gemma 4 26B A4B", provider="Google",
        open_weights=True, modality=["text", "image"], arch=(MOE, MOE_WHY),
        summary=(
            "A sparse version of Gemma 4: 26B parameters in total but only about 4B "
            "active per token, so it runs far faster than its size implies. The best "
            "Gemma pick if you are hosting it yourself."
        ),
        strengths=[
            "Sparse design makes self-hosting much cheaper than a dense 26B",
            "Generous 235K max output",
            "Downloadable weights",
        ],
        weaknesses=[
            "Sparse models can be uneven across subject areas",
            "Not competitive with the hosted frontier",
        ],
        tags=[OPEN, CHEAP, CHAT],
        scores=s(5, 6, 5, 4, 6, 10),
        docs="https://ai.google.dev/gemma/docs",
    ),
    "google/gemma-3-27b-it": dict(
        id="gemma-3-27b", name="Gemma 3 27B", provider="Google",
        open_weights=True, modality=["text", "image"], arch=(DENSE, DENSE_WHY),
        summary=(
            "The previous open-weight Gemma. Widely deployed and well supported by "
            "local-inference tools, which is the main reason to still pick it over "
            "Gemma 4."
        ),
        strengths=[
            "Excellent support across local tooling like Ollama and llama.cpp",
            "Cheap, with downloadable weights",
        ],
        weaknesses=[
            "Superseded by Gemma 4",
            "131K context",
        ],
        tags=[OPEN, CHEAP],
        scores=s(4, 5, 4, 3, 5, 9),
        docs="https://ai.google.dev/gemma/docs",
    ),
}
