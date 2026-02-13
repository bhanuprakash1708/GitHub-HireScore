# GitHub Portfolio Analyzer & Enhancer

Turn your GitHub profile into recruiter‑ready, data‑backed proof.

Built for the **UnsaidTalks Hackathon**.

---

### What this app does

- **Accepts a GitHub profile URL or username**
- **Fetches public GitHub data** (profile, repositories, basic activity)
- **Scores the portfolio (0–100)** using a transparent, weighted model
- **Highlights strengths and red flags** from a recruiter’s lens
- **Generates AI‑powered, actionable improvement suggestions**
- **Visualizes everything in a clean analytics dashboard**

The result is a **recruiter‑style report** on how ready your GitHub portfolio is for real hiring pipelines.

---

### Architecture overview

- **Frontend**
  - `Next.js 14` (App Router, TypeScript)
  - `Tailwind CSS` + lightweight, shadcn‑inspired UI primitives
  - `Recharts` for visual analytics (Radar + Bar charts)
- **Backend**
  - Next.js **Route Handler**: `app/api/analyze/route.ts`
  - `GitHub REST API` + small GraphQL call for pinned repos
  - `OpenAI API` for recruiter‑style narrative & action plan
- **Scoring & Analysis**
  - `lib/github.ts`: GitHub data fetching + 10‑minute in‑memory caching
  - `lib/scoring.ts`: deterministic scoring engine (0–100)
  - `lib/ai.ts`: prompt‑engineered AI feedback generator
- **Types**
  - `types/github.ts`: strict typing for all GitHub and scoring structures

High‑level flow:

1. User enters a **GitHub profile URL or username** on `/`.
2. App routes to `/analyze?username=…`.
3. Client calls `POST /api/analyze` with the username.
4. Server:
   - Fetches profile + repos + pinned repos from GitHub.
   - Analyses documentation, structure heuristics, and recent commits.
   - Computes a **weighted portfolio score** (0–100).
   - Calls OpenAI to turn metrics into **recruiter‑style feedback**.
5. Client renders a **dashboard**:
   - Overall score (circular gauge)
   - Radar + bar charts
   - Strengths, red flags, and 90‑day action plan
   - Repo table with documentation & activity signals

---

### Scoring methodology

All scores normalize to a **total of 100 points**:

- **Documentation Quality (20 pts)**
  - README present per repo (+10 baseline per repo)
  - README length (> 300 chars) (+5)
  - Sections heuristics:
    - Installation / Usage / Features / Screenshots
  - Badges detection (CI, coverage, npm, etc.)
  - Normalized across analyzed repos to 0–20.

- **Code Structure & Best Practices (20 pts)**
  - Meaningful repo names (non‑toy, non‑throwaway)
  - Longer, descriptive repo descriptions
  - Stack‑related keywords (Next.js, React, Node, Django, FastAPI, Kubernetes, etc.)
  - Focuses on **signal that this is a real project**, not just a playground.

- **Activity Consistency (20 pts)**
  - Total commits in the **last 90 days** (from GitHub commits API)
  - Buckets: 0, \<20, \<60, \<150, 150+ with increasing points
  - Bonus for having recent commits across **multiple repos**.

- **Technical Depth (15 pts)**
  - Diversity of languages across repos
  - Larger projects by repo size (approx. LOC proxy)
  - Advanced stack keywords:
    - machine learning / deep learning / AI / LLM
    - GraphQL / Docker / Kubernetes / Cloud / microservices

- **Impact & Relevance (15 pts)**
  - Aggregate **stars** and **forks** across repos
  - Light penalty for large numbers of open issues (unmaintained feel)
  - Rewards repos that have actual external adoption and interest.

- **Repository Organization (10 pts)**
  - Existence and count of **pinned repositories**
  - Count of “complete” repos (non‑archived + README)
  - Reward for archiving/cleaning small junk repos.

Score bands:

- **85+** → **Recruiter Ready**
- **70–84** → **Strong but Improvable**
- **50–69** → **Needs Optimization**
- **\<50** → **Major Improvements Needed**

The full scoring logic lives in `lib/scoring.ts`.

---

### Tech stack

- **Core**
  - Next.js 14 (App Router, TypeScript)
  - React 18
  - Tailwind CSS
  - Recharts
- **APIs**
  - GitHub REST API
  - GitHub GraphQL API (for pinned repos)
  - Google Gemini API (`gemini-2.5-flash` via `@google/genai`)
- **Tooling**
  - TypeScript strict mode
  - ESLint + `eslint-config-next`

---

### Getting started (local development)

#### 1. Clone and install

```bash
git clone <your-fork-url> github-portfolio-analyzer
cd github-portfolio-analyzer
npm install
```

#### 2. Configure environment variables

Create a `.env.local` at the project root, based on `.env.example`:

```bash
cp .env.example .env.local
```

Then fill:

- **`GITHUB_TOKEN`** – a **personal access token** with at least:
  - `read:user`
  - `repo:read` (public repos are enough; we only use public data)
- **`GEMINI_API_KEY`** – Gemini API key with access to the `gemini-2.5-flash` model.

These are **server-side only** and never exposed to the browser.

#### 3. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

### Usage walkthrough

1. Open the app at `/`.
2. Paste:
   - A full GitHub URL (**`https://github.com/torvalds`**) **or**
   - Just a username (**`torvalds`**).
3. Click **“Run Portfolio Analysis”**.
4. You’ll be taken to `/analyze?username=torvalds` and see:
   - Candidate snapshot (avatar, followers, repo counts, recent commits)
   - Overall score ring + band
   - Radar + bar chart breakdown
   - Recruiter-style **summary**, **strengths**, and **red flags** (AI)
   - 90‑day **action plan** checklist
   - Repo table with stars, last updated, README status, and 90‑day commits

Full analysis is designed to complete in under **2 minutes**, with GitHub fetches done in parallel and a 10‑minute in‑memory cache of GitHub responses on the server.

---

### Example test usernames

You can test a mix of profiles:

- Large OSS:
  - `torvalds`
  - `gaearon`
- Popular framework maintainers:
  - `vercel`
  - `facebook`
- Typical individual developers (use your own profile or peers).

Edge cases handled:

- Non‑existent user → user‑friendly error card on `/analyze`.
- No public repos → analysis runs with a low score and explanatory messaging.
- Private‑only account → appears similar to “no public repos”.
- GitHub rate limits → error surfaced from the API handler with clear text.
- OpenAI failures → numeric score and breakdown still work; AI summary falls back to a safe message.

For debugging during the hackathon, the `/api/analyze` route logs high‑level progress to the server console.

---

### Security considerations

- **GitHub token** and **Gemini API key** are:
  - Read from `process.env`.
  - Used only in **server-side route handlers** (`app/api/analyze/route.ts`).
  - Never sent to the browser or logged.
- Only **public GitHub data** is used.
- Errors are sanitized before being sent to the client.

---

### Deployment (Vercel‑ready)

This project is designed to deploy cleanly to **Vercel**:

1. Push this repository to GitHub.
2. In Vercel:
   - Import the project.
   - Set environment variables:
     - `GITHUB_TOKEN`
     - `GEMINI_API_KEY`
3. Use the default **Next.js** build settings:
   - Build command: `npm run build`
   - Output directory: `.next`

Vercel automatically picks up the Next.js 14 app router structure and `app/api/analyze/route.ts` as an **edge‑friendly function** (configured as `dynamic = "force-dynamic"` to always use fresh data + internal cache).

---

### Current limitations & future improvements

Planned / possible enhancements:

- **PDF export** of the report for attaching to resumes or portfolios.
- **Shareable score links** (persisted, hashed URLs for recruiter‑friendly sharing).
- **“Before vs After” simulation** – preview how changes (e.g. adding READMEs, archiving junk) would move your score.
- **Resume bullet suggestions** generated from top repositories.
- **AI‑generated README templates** customized per repository.
- Deeper tree‑level code analysis:
  - Detect `src/` structure, test coverage, and linting setups.
  - Recognize CI/CD pipelines and deployment configurations.
- More sophisticated activity modeling (true per‑month active streaks).

---

### Testing tips

There is no heavy automated test suite included (to keep the hackathon scope lean), but you can manually verify behavior by:

- Running `npm run dev` and:
  - Trying multiple usernames.
  - Temporarily revoking/altering GitHub or Gemini keys to confirm fallback paths.
- Checking the **browser console** and **server logs** for:
  - Clean error messages.
  - No unhandled promise rejections.

You can also run:

```bash
npm run build
```

to ensure the app builds cleanly in a CI/deployment context.

---

### Project status

This is a **fully working, deployable prototype** built to feel like a small SaaS:

- Clean, recruiter‑style UI.
- Deterministic scoring engine.
- Practical, AI‑augmented feedback.

You can fork it, deploy it to Vercel, and start using it today to make your own GitHub profile more recruiter‑ready.

