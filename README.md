# LearnNovaGrow Advanced Starter

This is a starter implementation for an existing LearnNovaGrow website upgrade. It includes a responsive dashboard, 100+ catalogue entries, AI quiz/mock-test generation, AI study assistant, study-plan generator, daily checklist, local progress stats, and basic policy-page templates.

## Important: merge with your existing site
You asked to preserve existing features. Because your current `index.html` was not attached with this request, this is a standalone starter rather than a verified merge. Back up your current site, then send its current files if you want an exact feature-preserving merge. Do not overwrite a live site until you compare features.

## Run locally
1. Install a current Node.js LTS release.
2. Open this project folder in a terminal.
3. Run `npm install`.
4. Set `OPENAI_API_KEY` in your local environment. Do not put the key in `public/index.html` or commit it.
5. Run `npm start`.
6. Open `http://localhost:10000`.

Example local `.env` is intentionally not included. If you use one, install `dotenv`, load it in `server.js`, and add `.env` to `.gitignore`. Never upload `.env` to GitHub.

## Deploy to Render
1. Upload this folder to a GitHub repository (without any API key or `.env`).
2. In Render choose **New + → Web Service** and connect the repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. In Render → Environment, add:
   - `OPENAI_API_KEY` = your secret API key
   - `OPENAI_MODEL` = `gpt-4.1-mini` (or a model available to your API project)
6. Deploy and check `https://YOUR-SERVICE.onrender.com/api/health`.
7. The response should show `ok: true` and `aiConfigured: true`. Never share the key in chat or screenshots.

## API endpoints
- `GET /api/health`
- `POST /api/assistant` body: `{ "subject": "Science", "question": "Explain photosynthesis" }`
- `POST /api/generate-quiz` body: `{ "exam": "SSC GD", "subject": "Reasoning", "topic": "Number series", "count": 10 }`
- `POST /api/study-plan` body: `{ "exam": "SSC GD", "hoursPerDay": 2, "days": 7, "subjects": "Maths, reasoning" }`

## Before a public launch
- Add authentication if you need user accounts; this starter has no login system.
- Add a database if progress must sync across devices; localStorage is device/browser-specific.
- Add stronger rate limiting (for multiple instances, use a shared store such as Redis), monitoring, and spending limits.
- Check generated content, accessibility, broken links, privacy, and mobile layouts.
- The catalogue lists 100+ tools and guided workflows; not every catalogue entry is a standalone automated calculator yet.
- Complete the policy pages with your real contact information and real data practices.
- AdSense approval is never guaranteed. Provide substantial original content and useful working pages, and comply with the current AdSense policies.
