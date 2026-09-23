# Modelfolio

Understand AI Models, Don't Just Compare Specs. Modelfolio cuts through the noise of AI marketing and benchmark illusions to help you find the right model for your specific needs.

## Architecture

This project is split into two parts:

### 1. The Next.js Frontend (`app/`)
A React-based web application providing a beautiful, interactive directory of AI models, along with a "Wizard" that matches you to the perfect model based on your budget, context length, and task requirements.

### 2. The Automated Data Pipeline (`pipeline/`)
A Python-based CI/CD pipeline that runs weekly via GitHub Actions. It automatically:
- Syncs model context windows and pricing from OpenRouter.
- Detects newly released models.
- Builds a curated weekly digest of AI news.
- Uses AI (Gemini) to draft beginner-friendly summaries, extract benchmark scores, and rate models for the Wizard.

## Local Development

### Frontend
1. Navigate to the frontend directory: `cd app`
2. Install dependencies: `npm install`
3. Add your `GEMINI_API_KEY` to `.env.local` to enable the Wizard's AI layer.
4. Run the development server: `npm run dev`

### Backend Pipeline
1. Navigate to the pipeline directory: `cd pipeline`
2. Install dependencies: `pip install -r requirements.txt`
3. Run `python validate_data.py` to ensure the curated JSON files match the schemas.
