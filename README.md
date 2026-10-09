# 🔮 Modelfolio

**Modelfolio** is a beautiful, BS-free directory and recommendation engine designed to help anyone—from casual users to indie hackers—find the exact AI model they need without getting lost in technical jargon.

Stop blindly paying $20/month for ChatGPT Plus when a 5-cent API call to Llama might do the exact same thing. Stop using Claude for math when Google's Gemini might be better for your specific use case. 

Modelfolio cuts through the hype to tell you exactly what each model rules at, and where it fails.

---

## ✨ Features

- **The Directory**: A stunning, visual breakdown of the top frontier and open-source models (OpenAI, Anthropic, Google, Meta, Mistral, and more).
- **The Wizard Engine**: Don't know what you need? Answer 4 simple questions (like "What's your budget?" and "What are you doing?"), and our dual-engine (AI-powered + Math Heuristics) Wizard will recommend the exact Top 3 models for your specific use case.
- **The BS Translator**: A toggle switch that instantly translates dense, nerdy AI jargon (like *Mixture-of-Experts* and *Context Windows*) into plain, everyday English. 
- **Automated AI News**: An automated Python data pipeline that scrapes the web, summarizes the week's model news with Gemini 2.5 Flash, and pushes a weekly news digest straight to the site.

---

## 🚀 How it Works (Under the Hood)

Modelfolio is built with two distinct parts: a beautiful frontend, and a ruthless automated backend.

### 1. The Frontend (Next.js)
The frontend is a fully responsive, dark-mode Next.js web application heavily inspired by premium data-journalism sites like *The Pudding*. 
- Built with **React 19** & **Next.js 16 (App Router)**
- Styled completely with **Vanilla CSS** (No Tailwind) to allow for complete, hyper-custom visual control.

### 2. The Data Pipeline (Python)
The data lives in `app/data/` and is produced by the Python pipeline in `pipeline/`. It splits the work in two, so that nothing on the site is guessed:
- **Humans write the judgement.** `pipeline/curated.py` and `pipeline/curated_more.py` hold each model's plain-English summary, strengths, weaknesses, use-case tags and Wizard scores. A benchmark score appears only when it names a public source.
- **The OpenRouter API supplies every number.** `pipeline/build_models.py` joins the curated entries with live OpenRouter data (context window, max output, prices, release date). It is the only thing that writes `models.json`, along with `model-sources.json` and `wizard-scores.json`.

Every Monday a **GitHub Action** (`.github/workflows/weekly-update.yml`) runs:
1. `build_models.py`: rebuilds the directory with live specs.
2. `update_models.py`: detects new models on OpenRouter and adds them to `pending-models.json`.
3. `build_news.py`: gathers the week's stories and has **Gemini 2.5 Flash** write the digest.
4. `generate_content.py`: drafts copy for the pending models. Drafts are **never published automatically**. Each one shows up as a ready-to-paste `curated_more.py` snippet in the run summary, for a human to review.
5. `validate_data.py` and `npm run build`: the gate. Only if both pass does the Action push the data to `main`.

---

## 💻 Running it Locally

Want to spin up Modelfolio on your own machine? It's super easy.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/MODEFOLIO.git
   cd MODEFOLIO/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your environment variables**
   Create a file called `.env.local` inside the `app/` folder. If you want the Wizard's AI recommendation engine to work, add a Gemini API key:
   ```bash
   GEMINI_API_KEY="your_api_key_here"
   WIZARD_LLM=1
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser and you're good to go!

---

## 🛠 Running the Python Pipeline (For Data Updates)

If you want to manually trigger the pipeline to hunt for new AI models and news:

1. From the repo root, install the Python requirements:
   ```bash
   pip install -r pipeline/requirements.txt
   ```
2. Run the steps you need, from the repo root (on Windows, set `PYTHONIOENCODING=utf-8` first):
   ```bash
   python pipeline/build_models.py [--dry-run]   # rebuild models.json from curated content + live OpenRouter specs
   python pipeline/update_models.py --dry-run    # report spec drift and new models without writing anything
   python pipeline/build_news.py                 # weekly digest (needs GEMINI_API_KEY in the environment)
   python pipeline/validate_data.py              # check every data file before committing
   python -m pytest pipeline/tests -q
   ```
   The pipeline updates the `.json` files inside the Next.js `app/data/` folder.

### Adding a model
Add an entry to `pipeline/curated_more.py`, keyed by its OpenRouter id (the run summary's draft snippets are a starting point), then run `python pipeline/build_models.py` and `python pipeline/validate_data.py`. Never type specs or prices in by hand. They come from OpenRouter.

---

## 🤝 Contributing
Found a new model that just dropped? Notice a pricing change? Feel free to open a Pull Request! The AI space moves at lightspeed, and keeping the directory accurate is a community effort.

*Made with ❤️ for the AI community.*
