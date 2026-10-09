"""
Second half of the curated editorial table. Split from curated.py purely to keep
each file a readable length. See curated.py for the editing rules.
"""

from curated import (
    s, DENSE, MOE, UNKNOWN, MOE_WHY, DENSE_WHY, UNKNOWN_WHY,
    CODE, WRITE, RESEARCH, AGENT, REASON, CHEAP, CHAT, LONG,
    MULTI, OPEN, VISION, MATH, LANG,
)

CURATED_MORE = {
    # ----------------------------- SpaceXAI ------------------------------
    "x-ai/grok-4.7": dict(
        id="grok-4-7", name="Grok 4.7", provider="SpaceXAI",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The current Grok. Its distinguishing feature is live access to posts on X, "
            "which makes it unusually good at questions about what is happening right "
            "now and unusually prone to repeating whatever is trending."
        ),
        strengths=[
            "Live awareness of breaking news and online discussion",
            "Willing to engage with topics other models decline",
        ],
        weaknesses=[
            "Inherits the biases of whatever is popular on X at the time",
            "Less consistent at careful instruction-following than Claude or GPT-6",
        ],
        tags=[CHAT, RESEARCH, REASON],
        scores=s(7, 7, 8, 7, 8, 4),
        docs="https://docs.x.ai/docs/models",
    ),
    "x-ai/grok-4.5": dict(
        id="grok-4-5", name="Grok 4.5", provider="SpaceXAI",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The previous Grok generation, kept for anyone who pinned to it. Grok 4.7 "
            "supersedes it on every axis."
        ),
        strengths=["Stable, pinned behaviour", "Same live-search access as 4.7"],
        weaknesses=["Superseded by Grok 4.7"],
        tags=[CHAT, RESEARCH],
        scores=s(6, 7, 7, 6, 8, 4),
        docs="https://docs.x.ai/docs/models",
    ),

    # ------------------------------- Meta --------------------------------
    "meta-llama/llama-4-maverick": dict(
        id="llama-4-maverick", name="Llama 4 Maverick", provider="Meta",
        open_weights=True, modality=["text", "image"], arch=(MOE, MOE_WHY),
        summary=(
            "Meta's largest open-weight model. The strongest thing you can download and "
            "run yourself, which matters if your data cannot leave your own machines "
            "for legal or privacy reasons."
        ),
        strengths=[
            "Best open-weight option for genuinely capable self-hosted work",
            "Sparse design keeps inference cost down for its size",
            "Licence permits commercial use",
        ],
        weaknesses=[
            "Needs serious GPU hardware to run locally",
            "Still behind the hosted frontier on reasoning",
        ],
        tags=[OPEN, CODE, REASON, VISION],
        scores=s(7, 7, 7, 6, 7, 8),
        docs="https://www.llama.com/docs/overview",
    ),
    "meta-llama/llama-4-scout": dict(
        id="llama-4-scout", name="Llama 4 Scout", provider="Meta",
        open_weights=True, modality=["text", "image"], arch=(MOE, MOE_WHY),
        summary=(
            "The smaller Llama 4, designed to fit on a single high-end GPU. That makes "
            "it the practical choice for most people who actually want to self-host "
            "rather than just talk about it."
        ),
        strengths=[
            "Runs on a single high-end GPU",
            "Open weights with a commercial-friendly licence",
        ],
        weaknesses=["Noticeably weaker than Maverick on hard tasks"],
        tags=[OPEN, CHEAP, CHAT, VISION],
        scores=s(6, 6, 6, 5, 7, 9),
        docs="https://www.llama.com/docs/overview",
    ),
    "meta-llama/llama-3.3-70b-instruct": dict(
        id="llama-3-3-70b", name="Llama 3.3 70B", provider="Meta",
        open_weights=True, modality=["text"], arch=(DENSE, DENSE_WHY),
        summary=(
            "The most widely deployed open-weight model of the last two years. Every "
            "local-inference tool supports it and there are fine-tunes for almost any "
            "niche, which is why it is still in use."
        ),
        strengths=[
            "Unmatched ecosystem support and availability of fine-tunes",
            "Predictable, well-characterised behaviour",
        ],
        weaknesses=[
            "Superseded by Llama 4 on capability",
            "128K context, and text-only",
        ],
        tags=[OPEN, CHEAP, CHAT],
        scores=s(5, 6, 6, 4, 5, 8),
        docs="https://www.llama.com/docs/overview",
    ),
    "meta-llama/llama-3.2-3b-instruct": dict(
        id="llama-3-2-3b", name="Llama 3.2 3B", provider="Meta",
        open_weights=True, modality=["text"], arch=(DENSE, DENSE_WHY),
        summary=(
            "A deliberately tiny model, small enough to run on a laptop or a phone. "
            "Judge it as an on-device option, not as a competitor to anything hosted — "
            "it is for simple, well-defined jobs."
        ),
        strengths=[
            "Runs on consumer hardware, including phones",
            "Near-free to host",
        ],
        weaknesses=[
            "Do not use it for coding or reasoning — it is far too small",
            "Needs simple, narrow tasks to be reliable",
        ],
        tags=[OPEN, CHEAP],
        scores=s(2, 3, 2, 1, 4, 10),
        docs="https://www.llama.com/docs/overview",
    ),
    "meta/muse-spark-1.3": dict(
        id="meta-muse-spark-1-3", name="Muse Spark 1.3", provider="Meta",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "Meta's hosted model line, separate from the open-weight Llama family. "
            "Public documentation on how it is built is thin, so lean on its price and "
            "measured latency rather than on claims about it."
        ),
        strengths=["Meta's current hosted offering, distinct from Llama"],
        weaknesses=[
            "Little public documentation or independent evaluation",
            "Closed weights, unlike the Llama line",
        ],
        tags=[CHAT, WRITE],
        scores=s(6, 7, 6, 5, 7, 6),
        docs="https://www.llama.com/docs/overview",
    ),
    "meta/muse-glimmer-30b": dict(
        id="meta-muse-glimmer-30b", name="Muse Glimmer 30B", provider="Meta",
        open_weights=False, modality=["text"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "A smaller model in Meta's hosted Muse line. Despite the parameter count in "
            "the name, the weights are not published."
        ),
        strengths=["Cheap entry point into Meta's hosted line"],
        weaknesses=[
            "Little public evaluation to go on",
            "The '30B' in the name does not mean you can download it",
        ],
        tags=[CHEAP, CHAT],
        scores=s(4, 5, 4, 3, 5, 8),
        docs="https://www.llama.com/docs/overview",
    ),

    # ----------------------------- DeepSeek ------------------------------
    "deepseek/deepseek-v4-pro": dict(
        id="deepseek-v4-pro", name="DeepSeek V4 Pro", provider="DeepSeek",
        open_weights=True, modality=["text"], arch=(MOE, MOE_WHY),
        summary=(
            "DeepSeek's flagship, and arguably the best capability-per-dollar in this "
            "directory. It performs close to the Western frontier on coding and maths "
            "at a fraction of the price, and the weights are published."
        ),
        strengths=[
            "Frontier-adjacent coding and maths for a mid-tier price",
            "Open weights, so you can self-host or audit it",
            "Shows its reasoning steps",
        ],
        weaknesses=[
            "Hosted in China — check this against your data-residency rules",
            "Declines or deflects on politically sensitive topics",
            "English prose is less polished than Claude's",
        ],
        tags=[OPEN, CODE, REASON, MATH],
        scores=s(9, 6, 8, 8, 7, 8),
        docs="https://api-docs.deepseek.com/",
    ),
    "deepseek/deepseek-v4.1-flash": dict(
        id="deepseek-v4-1-flash", name="DeepSeek V4.1 Flash", provider="DeepSeek",
        open_weights=True, modality=["text"], arch=(MOE, MOE_WHY),
        summary=(
            "DeepSeek's fast, cheap tier and their newest release. A strong default for "
            "high-volume coding work where you want better than a small model but will "
            "not pay frontier prices."
        ),
        strengths=["Very cheap for its coding ability", "Open weights"],
        weaknesses=[
            "Weaker than V4 Pro on hard multi-step problems",
            "Same China-hosting consideration as the rest of the line",
        ],
        tags=[OPEN, CHEAP, CODE],
        scores=s(7, 5, 6, 6, 6, 9),
        docs="https://api-docs.deepseek.com/",
    ),
    "deepseek/deepseek-v3.2": dict(
        id="deepseek-v3-2", name="DeepSeek V3.2", provider="DeepSeek",
        open_weights=True, modality=["text"], arch=(MOE, MOE_WHY),
        summary=(
            "The previous DeepSeek generation. Still a capable open-weight model with a "
            "large community behind it, and a common choice for self-hosting."
        ),
        strengths=["Mature open-weight model with good tooling support", "Cheap"],
        weaknesses=["Superseded by the V4 line"],
        tags=[OPEN, CHEAP, CODE],
        scores=s(7, 5, 6, 5, 6, 9),
        docs="https://api-docs.deepseek.com/",
    ),
    "deepseek/deepseek-r1": dict(
        id="deepseek-r1", name="DeepSeek R1", provider="DeepSeek",
        open_weights=True, modality=["text"], arch=(MOE, MOE_WHY),
        summary=(
            "The model that proved open weights could do visible step-by-step "
            "reasoning. Historically important and still instructive to read, but its "
            "64K context and age make it a poor choice for new work."
        ),
        strengths=[
            "Shows its full reasoning, which is genuinely useful for learning",
            "Open weights",
        ],
        weaknesses=[
            "Only 64K context",
            "Superseded by the V4 line",
            "Burns a lot of output tokens thinking",
        ],
        tags=[OPEN, REASON, MATH],
        scores=s(6, 4, 6, 4, 3, 7),
        docs="https://api-docs.deepseek.com/",
    ),

    # ------------------------------- Qwen --------------------------------
    "qwen/qwen3.8-max-prime": dict(
        id="qwen3-8-max-prime", name="Qwen3.8 Max Prime", provider="Alibaba",
        open_weights=False, modality=["text", "image"], arch=(MOE, MOE_WHY),
        summary=(
            "Alibaba's flagship. API-only despite Qwen's open-weight reputation — the "
            "Max tier has never had published weights. Strong at Chinese and at "
            "multilingual work generally."
        ),
        strengths=[
            "Best-in-directory Chinese and broad multilingual ability",
            "Million-token context",
        ],
        weaknesses=[
            "Closed weights, unlike the numbered Qwen models",
            "Hosted in China — check your data-residency requirements",
        ],
        tags=[LANG, REASON, LONG, CODE],
        scores=s(8, 7, 8, 7, 9, 5),
        docs="https://www.alibabacloud.com/help/en/model-studio/",
    ),
    "qwen/qwen3.8-flash": dict(
        id="qwen3-8-flash", name="Qwen3.8 Flash", provider="Alibaba",
        open_weights=False, modality=["text"], arch=(MOE, MOE_WHY),
        summary=(
            "Qwen's cheap, fast tier: fifteen cents per million input tokens with a "
            "million-token context. Hard to beat for bulk multilingual processing."
        ),
        strengths=[
            "Very cheap for a million-token context",
            "Good multilingual coverage at this price",
        ],
        weaknesses=["Closed weights", "Shallow on hard reasoning"],
        tags=[CHEAP, LANG, LONG],
        scores=s(5, 6, 6, 4, 9, 10),
        docs="https://www.alibabacloud.com/help/en/model-studio/",
    ),
    "qwen/qwen3.8-omni-flash": dict(
        id="qwen3-8-omni-flash", name="Qwen3.8 Omni Flash", provider="Alibaba",
        open_weights=False, modality=["text", "image", "audio", "video"], arch=(MOE, MOE_WHY),
        summary=(
            "The multimodal version of Qwen3.8 Flash, at the same price. It takes audio "
            "and video as input, which makes it one of the cheapest ways to process "
            "media at scale."
        ),
        strengths=[
            "Audio and video input at the same price as the text-only Flash",
            "Million-token context",
        ],
        weaknesses=["Closed weights", "Not a reasoning model"],
        tags=[MULTI, VISION, CHEAP, LONG],
        scores=s(5, 6, 6, 4, 9, 10),
        docs="https://www.alibabacloud.com/help/en/model-studio/",
    ),
    "qwen/qwen3.8-27b": dict(
        id="qwen3-8-27b", name="Qwen3.8 27B", provider="Alibaba",
        open_weights=True, modality=["text"], arch=(DENSE, DENSE_WHY),
        summary=(
            "The open-weight Qwen3.8. These numbered-size models are the ones Alibaba "
            "actually publishes weights for, and they are a popular self-hosting choice "
            "outside China as well as inside it."
        ),
        strengths=[
            "Downloadable weights with a million-token context",
            "Strong multilingual ability for a 27B model",
        ],
        weaknesses=[
            "Needs substantial hardware to self-host at full context",
            "Behind the Max tier on hard tasks",
        ],
        tags=[OPEN, LANG, LONG, CHEAP],
        scores=s(6, 6, 6, 5, 8, 8),
        docs="https://qwen.readthedocs.io/",
    ),
    "qwen/qwen3.7-flash": dict(
        id="qwen3-7-flash", name="Qwen3.7 Flash", provider="Alibaba",
        open_weights=False, modality=["text"], arch=(MOE, MOE_WHY),
        summary=(
            "The cheapest model in this entire directory at three cents per million "
            "input tokens, and it still reads a million tokens. For first-pass filtering "
            "at scale, nothing here is cheaper."
        ),
        strengths=[
            "Cheapest model in the directory",
            "Million-token context even at this price",
        ],
        weaknesses=[
            "You get what you pay for — expect shallow answers",
            "Closed weights",
        ],
        tags=[CHEAP, LONG],
        scores=s(4, 5, 5, 3, 8, 10),
        docs="https://www.alibabacloud.com/help/en/model-studio/",
    ),

    # ------------------------------ Mistral ------------------------------
    "mistralai/mistral-large-4-0": dict(
        id="mistral-large-4", name="Mistral Large 4", provider="Mistral",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "Mistral's flagship, and the strongest European-hosted option here. For "
            "teams that need EU data residency, that constraint usually matters more "
            "than the last few points of capability."
        ),
        strengths=[
            "EU-hosted, which simplifies GDPR and data-residency questions",
            "Excellent French, German and Spanish",
        ],
        weaknesses=[
            "Behind the US frontier on coding and reasoning",
            "Closed weights, unlike Mistral's smaller models",
        ],
        tags=[LANG, REASON, CODE],
        scores=s(7, 8, 7, 7, 7, 5),
        docs="https://docs.mistral.ai/getting-started/models/",
    ),
    "mistralai/mistral-medium-3-5": dict(
        id="mistral-medium-3-5", name="Mistral Medium 3.5", provider="Mistral",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "Mistral's mid tier. Note that despite Mistral's open-source reputation, "
            "Medium is API-only — only the Small, Ministral and Devstral lines have "
            "published weights."
        ),
        strengths=["Good European-hosted all-rounder", "Solid multilingual output"],
        weaknesses=[
            "Closed weights — a common misconception about this model",
            "Mid-tier price without mid-tier-leading quality",
        ],
        tags=[LANG, WRITE, CHAT],
        scores=s(6, 7, 6, 6, 6, 6),
        docs="https://docs.mistral.ai/getting-started/models/",
    ),
    "mistralai/mistral-small-2603": dict(
        id="mistral-small-4", name="Mistral Small 4", provider="Mistral",
        open_weights=True, modality=["text", "image"], arch=(DENSE, DENSE_WHY),
        summary=(
            "Mistral's open-weight small model, and a genuine favourite for self-hosting "
            "in Europe. Small enough to run on modest hardware, Apache-licensed, and "
            "surprisingly capable for its size."
        ),
        strengths=[
            "Apache-licensed open weights with no usage restrictions",
            "Runs comfortably on a single GPU",
        ],
        weaknesses=["Small, so keep tasks well-defined"],
        tags=[OPEN, CHEAP, LANG, CHAT],
        scores=s(5, 6, 5, 4, 5, 9),
        docs="https://docs.mistral.ai/getting-started/models/",
    ),
    "mistralai/devstral-2512": dict(
        id="devstral-2", name="Devstral 2", provider="Mistral",
        open_weights=True, modality=["text"], arch=(DENSE, DENSE_WHY),
        summary=(
            "An open-weight model tuned specifically for software engineering. The "
            "interesting option if you want a coding assistant running entirely on your "
            "own infrastructure, with no code leaving the building."
        ),
        strengths=[
            "Open weights, tuned for real repository work rather than snippets",
            "Lets you keep a coding assistant fully on-premises",
        ],
        weaknesses=[
            "Clearly behind hosted specialists like GPT-5.3-Codex",
            "Narrow — poor at anything other than code",
        ],
        tags=[OPEN, CODE, AGENT],
        scores=s(7, 3, 4, 6, 5, 8),
        docs="https://docs.mistral.ai/getting-started/models/",
    ),

    # ------------------------------ Cohere -------------------------------
    "cohere/command-a-plus": dict(
        id="command-a-plus", name="Command A+", provider="Cohere",
        open_weights=False, modality=["text"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "Cohere builds for enterprise retrieval rather than chat. Command A+ is "
            "tuned to answer strictly from documents you supply and to cite them, which "
            "makes it a strong fit for internal knowledge bases."
        ),
        strengths=[
            "Tuned to stick to supplied documents and cite its sources",
            "Reliable structured output for data-extraction work",
            "Enterprise deployment options including private cloud",
        ],
        weaknesses=[
            "Weaker at open-ended coding than general frontier models",
            "Less creative in free-form writing",
        ],
        tags=[RESEARCH, WRITE, LONG],
        scores=s(5, 8, 9, 6, 8, 7),
        docs="https://docs.cohere.com/docs/models",
    ),
    "cohere/command-a": dict(
        id="command-a", name="Command A", provider="Cohere",
        open_weights=False, modality=["text"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The cheaper Cohere tier, with the same document-grounded focus as "
            "Command A+. A sensible pick for high-volume retrieval over your own data."
        ),
        strengths=["Cheap for grounded document question-answering", "Cites sources"],
        weaknesses=["Less capable than Command A+ on long or complex documents"],
        tags=[RESEARCH, CHEAP],
        scores=s(4, 7, 8, 5, 7, 8),
        docs="https://docs.cohere.com/docs/models",
    ),

    # ------------------------------- Z-AI --------------------------------
    "z-ai/glm-5.3-prime": dict(
        id="glm-5-3-prime", name="GLM-5.3 Prime", provider="Z-AI",
        open_weights=True, modality=["text", "image"], arch=(MOE, MOE_WHY),
        summary=(
            "Z-AI's flagship and a serious open-weight contender, particularly for "
            "agent-style work where the model has to plan and call tools over many "
            "steps."
        ),
        strengths=[
            "Strong agentic tool use for an open-weight model",
            "Million-token context with published weights",
        ],
        weaknesses=[
            "Hosted in China — check your data-residency rules",
            "Less polished English prose than Western models",
        ],
        tags=[OPEN, AGENT, CODE, LONG],
        scores=s(8, 6, 7, 8, 9, 6),
        docs="https://docs.z.ai/",
    ),
    "z-ai/glm-5.3-flash": dict(
        id="glm-5-3-flash", name="GLM-5.3 Flash", provider="Z-AI",
        open_weights=True, modality=["text"], arch=(MOE, MOE_WHY),
        summary=(
            "The cheap GLM, with an unusually large maximum output — useful if you need "
            "the model to produce very long documents in a single response rather than "
            "stitching chunks together."
        ),
        strengths=[
            "Can emit extremely long single responses",
            "Cheap, with open weights",
        ],
        weaknesses=["Weaker reasoning than GLM-5.3 Prime", "China-hosted"],
        tags=[OPEN, CHEAP, LONG, WRITE],
        scores=s(6, 6, 6, 5, 9, 9),
        docs="https://docs.z.ai/",
    ),

    # ----------------------------- Moonshot ------------------------------
    "moonshotai/kimi-k3": dict(
        id="kimi-k3", name="Kimi K3", provider="Moonshot AI",
        open_weights=True, modality=["text"], arch=(MOE, MOE_WHY),
        summary=(
            "Moonshot's flagship, built around very long documents. Cheap on input and "
            "expensive on output, which tells you its intended use: feed it a great deal "
            "of text and ask for a short answer."
        ),
        strengths=[
            "Excellent at digesting very large document sets",
            "Cheap input pricing suits read-heavy work",
            "Open weights",
        ],
        weaknesses=[
            "Expensive output pricing punishes long answers",
            "China-hosted",
        ],
        tags=[OPEN, LONG, RESEARCH],
        scores=s(7, 7, 8, 6, 10, 6),
        docs="https://platform.moonshot.ai/docs",
    ),
    "moonshotai/kimi-k2.7-code": dict(
        id="kimi-k2-7-code", name="Kimi K2.7 Code", provider="Moonshot AI",
        open_weights=True, modality=["text"], arch=(MOE, MOE_WHY),
        summary=(
            "A coding-focused Kimi with open weights. Worth benchmarking against "
            "Devstral 2 if you are choosing a self-hosted coding assistant."
        ),
        strengths=["Coding-tuned with open weights", "Reasonable price for its ability"],
        weaknesses=["Narrow focus", "China-hosted"],
        tags=[OPEN, CODE, AGENT],
        scores=s(8, 4, 5, 7, 8, 7),
        docs="https://platform.moonshot.ai/docs",
    ),

    # ------------------------------ MiniMax ------------------------------
    "minimax/minimax-m3": dict(
        id="minimax-m3", name="MiniMax M3", provider="MiniMax",
        open_weights=True, modality=["text"], arch=(MOE, MOE_WHY),
        summary=(
            "A cheap long-context model with an unusually large maximum output. Good "
            "for generating long structured documents where most models would force you "
            "to paginate."
        ),
        strengths=[
            "Very large max output, so long single generations are possible",
            "Cheap, with open weights",
        ],
        weaknesses=["Not a frontier model on reasoning", "China-hosted"],
        tags=[OPEN, CHEAP, LONG, WRITE],
        scores=s(6, 6, 6, 5, 9, 9),
        docs="https://www.minimax.io/platform",
    ),

    # ------------------------------ Amazon -------------------------------
    "amazon/nova-2-lite-v1": dict(
        id="nova-2-lite", name="Nova 2 Lite", provider="Amazon",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "Amazon's cheap tier. Its real appeal is Bedrock: if your infrastructure "
            "already lives in AWS, this is the model that needs no new vendor, no new "
            "contract and no new security review."
        ),
        strengths=[
            "Native AWS Bedrock integration with existing IAM and billing",
            "Million-token context at a low price",
        ],
        weaknesses=[
            "Middling capability compared with similarly priced rivals",
            "Little appeal outside the AWS ecosystem",
        ],
        tags=[CHEAP, LONG, CHAT],
        scores=s(5, 5, 5, 4, 8, 8),
        docs="https://docs.aws.amazon.com/nova/",
    ),
    "amazon/nova-premier-v1": dict(
        id="nova-premier", name="Nova Premier", provider="Amazon",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "Amazon's top Nova tier. Chosen almost entirely for AWS integration rather "
            "than for beating the frontier, which it does not."
        ),
        strengths=["Full AWS Bedrock integration", "Million-token context"],
        weaknesses=[
            "Priced like a frontier model without frontier capability",
            "Low max output for the price",
        ],
        tags=[LONG, RESEARCH],
        scores=s(6, 6, 7, 5, 8, 3),
        docs="https://docs.aws.amazon.com/nova/",
    ),

    # ------------------------------ NVIDIA -------------------------------
    "nvidia/nemotron-3.5-lightning": dict(
        id="nemotron-3-5-lightning", name="Nemotron 3.5 Lightning", provider="NVIDIA",
        open_weights=True, modality=["text"], arch=(MOE, MOE_WHY),
        summary=(
            "NVIDIA's open-weight model, tuned to run efficiently on NVIDIA hardware. "
            "Very cheap, and the natural choice if you are already building on their "
            "inference stack."
        ),
        strengths=[
            "Extremely cheap, with open weights",
            "Optimised for NVIDIA inference tooling",
        ],
        weaknesses=["Not a frontier model", "262K context"],
        tags=[OPEN, CHEAP],
        scores=s(5, 5, 5, 4, 6, 10),
        docs="https://docs.nvidia.com/nemo/",
    ),

    # ---------------------------- Perplexity -----------------------------
    "perplexity/sonar-pro-search": dict(
        id="sonar-pro-search", name="Sonar Pro Search", provider="Perplexity",
        open_weights=False, modality=["text"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "Not a general-purpose model: it searches the live web and answers with "
            "citations. Use it when the answer depends on current facts, and use "
            "something else for everything else."
        ),
        strengths=[
            "Searches the live web, so it is not limited by a training cutoff",
            "Returns citations you can actually check",
        ],
        weaknesses=[
            "Small max output — it is built for answers, not documents",
            "Poor at coding, creative writing or anything not search-shaped",
        ],
        tags=[RESEARCH],
        scores=s(2, 4, 9, 3, 6, 3),
        docs="https://docs.perplexity.ai/",
    ),

    # ------------------------- Upstage and others -------------------------
    "upstage/solar-pro4": dict(
        id="solar-pro-4", name="Solar Pro 4", provider="Upstage",
        open_weights=False, modality=["text"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "A Korean model with excellent Korean-language support and a large context, "
            "at a very low price. The obvious pick if Korean is central to your work."
        ),
        strengths=[
            "Best Korean-language performance in this directory",
            "Cheap, with a large context window",
        ],
        weaknesses=["Less competitive outside Korean and English"],
        tags=[CHEAP, LANG, LONG],
        scores=s(5, 6, 6, 4, 8, 9),
        docs="https://developers.upstage.ai/",
    ),
    "bytedance-seed/seed-2-1-turbo": dict(
        id="seed-2-1-turbo", name="Seed 2.1 Turbo", provider="ByteDance",
        open_weights=False, modality=["text", "image"], arch=(MOE, MOE_WHY),
        summary=(
            "ByteDance's hosted model. Capable and reasonably priced, with a large "
            "maximum output, though independent evaluation outside China is limited."
        ),
        strengths=["Large max output", "Strong Chinese-language performance"],
        weaknesses=[
            "Limited independent evaluation outside China",
            "Closed weights, China-hosted",
        ],
        tags=[LANG, WRITE, CHEAP],
        scores=s(6, 6, 6, 5, 7, 7),
        docs="https://www.volcengine.com/docs",
    ),
    "ibm-granite/granite-4.2-8b": dict(
        id="granite-4-2-8b", name="Granite 4.2 8B", provider="IBM",
        open_weights=True, modality=["text"], arch=(DENSE, DENSE_WHY),
        summary=(
            "IBM's small open-weight model, aimed squarely at regulated enterprises. "
            "Its selling point is governance: IBM documents the training data and "
            "indemnifies commercial use, which matters to compliance teams."
        ),
        strengths=[
            "Documented training data and commercial indemnification from IBM",
            "Small and cheap enough to self-host easily",
        ],
        weaknesses=[
            "An 8B model — keep tasks narrow and well-specified",
            "Not competitive on general capability",
        ],
        tags=[OPEN, CHEAP],
        scores=s(4, 4, 4, 3, 5, 10),
        docs="https://www.ibm.com/granite/docs/",
    ),
}

# ---------------------------------------------------------------------------
# LEGACY MODELS
#
# These were real, widely used models that OpenRouter no longer lists. We keep
# them so that someone searching for a name they have heard of still lands
# somewhere useful, but they are marked status="legacy", shown with a warning,
# and excluded from Wizard recommendations.
#
# Their specs CANNOT be refreshed from the live API, so the values below are
# frozen at the last published figures and each one records where it came from.
# ---------------------------------------------------------------------------

LEGACY = {
    "claude-3-5-sonnet": dict(
        name="Claude 3.5 Sonnet", provider="Anthropic",
        context=200_000, max_output=8192, price_in=3.0, price_out=15.0,
        release="2024-06-20", retired="Delisted from OpenRouter during 2026",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The model that made Claude popular with developers, and the reference "
            "point most 2024-25 tutorials were written against. No longer available "
            "through OpenRouter — Claude Sonnet 5.5 is its direct descendant."
        ),
        strengths=[
            "Historically significant: the first Claude many developers trusted for code",
            "Behaviour is extremely well documented across the web",
        ],
        weaknesses=[
            "No longer available to call — kept here for reference only",
            "8K max output, tiny by current standards",
        ],
        tags=[CODE, WRITE],
        benchmarks=[
            {"name": "MMLU", "score": 88.7, "source": "Anthropic, reported at launch (2024-06)"},
        ],
        docs="https://docs.anthropic.com/en/docs/about-claude/models",
    ),
    "claude-3-opus": dict(
        name="Claude 3 Opus", provider="Anthropic",
        context=200_000, max_output=4096, price_in=15.0, price_out=75.0,
        release="2024-03-04", retired="Delisted from OpenRouter during 2026",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "Anthropic's 2024 flagship, famous at the time for its prose quality. Its "
            "$15 / $75 pricing set the high-water mark that later models undercut."
        ),
        strengths=["Prose quality that was unmatched in 2024"],
        weaknesses=[
            "No longer available to call — kept here for reference only",
            "Was extremely expensive even when current",
        ],
        tags=[WRITE, RESEARCH],
        benchmarks=[
            {"name": "MMLU", "score": 86.8, "source": "Anthropic, reported at launch (2024-03)"},
        ],
        docs="https://docs.anthropic.com/en/docs/about-claude/models",
    ),
    "gemini-1-5-pro": dict(
        name="Gemini 1.5 Pro", provider="Google",
        context=2_000_000, max_output=8192, price_in=1.25, price_out=5.0,
        release="2024-04-09", retired="Delisted from OpenRouter during 2026",
        open_weights=False, modality=["text", "image", "audio", "video"], arch=(MOE, MOE_WHY),
        summary=(
            "The model that started the long-context arms race, with a two-million-token "
            "window in 2024. It is also the model most often still quoted in articles "
            "about context length, long after it stopped being available."
        ),
        strengths=[
            "First widely available two-million-token context window",
            "Early full multimodal input including video",
        ],
        weaknesses=[
            "No longer available to call — kept here for reference only",
            "Showed the 'lost in the middle' problem badly at full context",
        ],
        tags=[LONG, MULTI, RESEARCH],
        benchmarks=[
            {"name": "MMLU", "score": 85.9, "source": "Google, reported at launch (2024-04)"},
        ],
        docs="https://ai.google.dev/gemini-api/docs/models",
    ),
    "o1-preview": dict(
        name="o1-preview", provider="OpenAI",
        context=128_000, max_output=32_768, price_in=15.0, price_out=60.0,
        release="2024-09-12", retired="Delisted from OpenRouter during 2026",
        open_weights=False, modality=["text"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The first model that spent extra tokens 'thinking' before answering, which "
            "is now standard across the industry. Historically the most important model "
            "on this list."
        ),
        strengths=["Introduced test-time reasoning to the mainstream"],
        weaknesses=[
            "No longer available to call — kept here for reference only",
            "Very slow and expensive by current standards",
        ],
        tags=[REASON, MATH],
        benchmarks=[
            {"name": "MMLU", "score": 90.8, "source": "OpenAI, reported at launch (2024-09)"},
        ],
        docs="https://platform.openai.com/docs/models",
    ),
    "llama-3-1-405b": dict(
        name="Llama 3.1 405B", provider="Meta",
        context=128_000, max_output=4096, price_in=0.8, price_out=0.8,
        release="2024-07-23", retired="Delisted from OpenRouter during 2026",
        open_weights=True, modality=["text"], arch=(DENSE, DENSE_WHY),
        summary=(
            "The first open-weight model to credibly match the closed frontier of its "
            "day, and the reason 'open weights can compete' stopped being a fringe "
            "position."
        ),
        strengths=[
            "Proved open weights could reach frontier quality",
            "Weights remain downloadable even though hosting has gone",
        ],
        weaknesses=[
            "No longer hosted on OpenRouter — kept here for reference only",
            "405B parameters makes self-hosting impractical for most people",
        ],
        tags=[OPEN, REASON],
        benchmarks=[
            {"name": "MMLU", "score": 88.6, "source": "Meta, reported at launch (2024-07)"},
        ],
        docs="https://www.llama.com/docs/overview",
    ),
    "grok-3": dict(
        name="Grok 3", provider="SpaceXAI",
        context=131_072, max_output=16_384, price_in=3.0, price_out=15.0,
        release="2025-02-17", retired="Delisted from OpenRouter during 2026",
        open_weights=False, modality=["text", "image"], arch=(UNKNOWN, UNKNOWN_WHY),
        summary=(
            "The Grok generation that brought the model into serious comparison with "
            "GPT and Claude. Superseded by the Grok 4.x line."
        ),
        strengths=["First genuinely competitive Grok"],
        weaknesses=["No longer available to call — kept here for reference only"],
        tags=[CHAT, RESEARCH],
        docs="https://docs.x.ai/docs/models",
    ),
    "qwen-2-5-72b": dict(
        name="Qwen 2.5 72B", provider="Alibaba",
        context=131_072, max_output=16_384, price_in=0.35, price_out=0.4,
        release="2024-09-19", retired="Delisted from OpenRouter during 2026",
        open_weights=True, modality=["text"], arch=(DENSE, DENSE_WHY),
        summary=(
            "The Qwen generation that made Alibaba's open-weight models a default choice "
            "for self-hosting outside China as well as inside it."
        ),
        strengths=[
            "Established Qwen as a serious open-weight family",
            "Weights remain downloadable",
        ],
        weaknesses=["No longer hosted on OpenRouter — kept here for reference only"],
        tags=[OPEN, LANG],
        docs="https://qwen.readthedocs.io/",
    ),
    "qwen-2-5-coder": dict(
        name="Qwen 2.5 Coder 32B", provider="Alibaba",
        context=131_072, max_output=16_384, price_in=0.15, price_out=0.15,
        release="2024-11-11", retired="Delisted from OpenRouter during 2026",
        open_weights=True, modality=["text"], arch=(DENSE, DENSE_WHY),
        summary=(
            "For a while the best open-weight coding model you could run on your own "
            "hardware, and a common choice for local coding assistants."
        ),
        strengths=[
            "Strong coding for a 32B open-weight model",
            "Weights remain downloadable",
        ],
        weaknesses=[
            "No longer hosted on OpenRouter — kept here for reference only",
            "Superseded by Devstral 2 and Kimi K2.7 Code",
        ],
        tags=[OPEN, CODE],
        docs="https://qwen.readthedocs.io/",
    ),
    "deepseek-coder-v2": dict(
        name="DeepSeek Coder V2", provider="DeepSeek",
        context=128_000, max_output=4096, price_in=0.14, price_out=0.28,
        release="2024-06-17", retired="Delisted from OpenRouter during 2026",
        open_weights=True, modality=["text"], arch=(MOE, MOE_WHY),
        summary=(
            "An early sign that DeepSeek would become a serious player: a cheap, "
            "open-weight coding model that held its own against far pricier rivals."
        ),
        strengths=["Very cheap coding model for its time", "Open weights"],
        weaknesses=[
            "No longer hosted on OpenRouter — kept here for reference only",
            "Superseded by the DeepSeek V4 line",
        ],
        tags=[OPEN, CODE],
        docs="https://api-docs.deepseek.com/",
    ),
}
