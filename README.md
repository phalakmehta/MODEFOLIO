# 🔮 Modelfolio

**Modelfolio** is a beautiful, BS-free directory and recommendation engine designed to help anyone—from casual users to indie hackers—find the exact AI model they need without getting lost in technical jargon.

Stop blindly paying $20/month for ChatGPT Plus when a 5-cent API call to Llama might do the exact same thing. Stop using Claude for math when Google's Gemini might be better for your specific use case. 

Modelfolio cuts through the hype to tell you exactly what each model rules at, and where it fails.

---

## ✨ Features

- **The Directory**: A stunning, visual breakdown of the top frontier and open-source models (OpenAI, Anthropic, Google, Meta, Mistral, and more).
- **The Wizard Engine**: Don't know what you need? Answer 4 simple questions (like "What's your budget?" and "What are you doing?"), and our dual-engine (AI-powered + Math Heuristics) Wizard will recommend the exact Top 3 models for your specific use case.
- **The BS Translator**: A toggle switch that instantly translates dense, nerdy AI jargon (like *Mixture-of-Experts* and *Context Windows*) into plain, everyday English. 
- **Automated AI News**: An automated Python data pipeline that scrapes the web, summarizes the latest model drops using Gemini 1.5 Pro, and pushes a weekly news digest straight to the site.

---

## 🚀 How it Works (Under the Hood)

Modelfolio is built with two distinct parts: a beautiful frontend, and a ruthless automated backend.

### 1. The Frontend (Next.js)
The frontend is a fully responsive, dark-mode Next.js web application heavily inspired by premium data-journalism sites like *The Pudding*. 
- Built with **React** & **Next.js 14 (App Router)**
- Styled completely with **Vanilla CSS** (No Tailwind) to allow for complete, hyper-custom visual control.

### 2. The Data Pipeline (Python)
The models aren't hardcoded. Modelfolio is powered by an automated Python scraping engine located in the `pipeline/` directory. 
- Every week, a **GitHub Action** wakes up the pipeline.
- It crawls developer documentation and AI news feeds.
- It passes the raw data to **Gemini 1.5 Pro**, which structure-formats it into strict JSON schemas.
- It updates the database in `app/data/` and automatically commits the new data directly to the repository!

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

1. Navigate to the `pipeline/` folder:
   ```bash
   cd MODEFOLIO/pipeline
   ```
2. Install the Python requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the pipeline (make sure your `.env` has a valid `GEMINI_API_KEY`):
   ```bash
   python build_news.py
   python backfill_models.py
   ```
   The pipeline will automatically update the `.json` files inside the Next.js `app/data/` folder.

---

## 🤝 Contributing
Found a new model that just dropped? Notice a pricing change? Feel free to open a Pull Request! The AI space moves at lightspeed, and keeping the directory accurate is a community effort.

*Made with ❤️ for the AI community.*
