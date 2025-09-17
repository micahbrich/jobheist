# jobheist 🎯

[![npm version](https://img.shields.io/npm/v/jobheist.svg)](https://www.npmjs.com/package/jobheist)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/jobheist.svg)](https://www.npmjs.com/package/jobheist)

> Plan the perfect job heist. Outsmart ATS filters. Land the interview.

## The Score

Every job application is a heist. The ATS (Applicant Tracking System) is the vault, your resume is your crew, and that dream job? That's the prize.

**jobheist** cases the joint for you - analyzing how well your resume matches the job posting, identifying what keywords you're missing, and scoring your chances of making it past the automated guards.

Built with [Firecrawl](https://firecrawl.com) for lightning-fast job scraping and OpenAI's latest reasoning models for intelligent analysis. The entire codebase is just 2 files (~500 lines) because the best heists are simple.

## Quick Start

```bash
# The easy way (once published)
npx jobheist resume.pdf https://jobs.example.com/posting

# Or install globally
npm install -g jobheist
jobheist resume.pdf https://dream-company.com/perfect-role
```

## The Plan

```bash
# Case the joint - analyze compatibility
jobheist resume.pdf https://example.com/job

# Get the intel in different formats
jobheist resume.pdf https://example.com/job --format=json
jobheist resume.pdf https://example.com/job --format=xml

# Fresh reconnaissance (skip cache)
jobheist resume.pdf https://example.com/job --fresh

# Bring your own tools (API keys)
jobheist resume.pdf https://example.com/job \
  --firecrawl-key=fc_xxx \
  --openai-key=sk-xxx
```

## Your Toolkit

### Setting Up API Keys

jobheist needs two API keys to work. You can set them up in multiple ways:

**Option 1: Global config (recommended for global install)**
```bash
# One-time setup — keys available everywhere
echo "OPENAI_API_KEY=sk-xxx" >> ~/.jobheistrc
echo "FIRECRAWL_API_KEY=fc_xxx" >> ~/.jobheistrc
chmod 600 ~/.jobheistrc
```
> `~/.jobheistrc` is an `.env`-style file, so comments and simple `KEY=VALUE` lines work great.

**Option 2: Environment variables**
```bash
export OPENAI_API_KEY=sk-xxx
export FIRECRAWL_API_KEY=fc_xxx
```

**Option 3: Local .env file**
```bash
# In your project directory
OPENAI_API_KEY=sk-xxx
FIRECRAWL_API_KEY=fc_xxx
```

**Option 4: Command line flags**
```bash
jobheist resume.pdf https://job-url \
  --openai-key=sk-xxx \
  --firecrawl-key=fc_xxx
```

Priority order: CLI flags > env vars > .env > ~/.jobheistrc

## Inside the Job

```typescript
import { ats, atsStream } from 'jobheist'

// Simple heist
const score = await ats('resume.pdf', 'https://example.com/job')

// Live updates during the heist
await atsStream('resume.pdf', 'https://example.com/job', {
  onProgress: (update) => {
    if (update.phase === 'scoring') {
      console.log(`Score: ${update.data?.score}/100`)
    }
  }
})
```

## Output Formats

- **Markdown** (default): Human-readable analysis with scores and suggestions
- **JSON**: Structured data for automation and pipelines
- **XML**: For systems that prefer angle brackets

## The Crew

- **PDF Parser**: Extracts text from your resume using Mozilla's pdfjs-dist
- **Job Scraper**: [Firecrawl](https://www.firecrawl.dev) grabs structured job data in seconds
- **AI Analyzer**: [Vercel AI SDK](https://ai-sdk.dev/) + GPT-5-mini provides intelligent matching and recommendations
- **Score System**: 0-100 rating of your match probability

## Example
```bash
❯ pnpm jobheist ./micahrich-resume-1.8.1.pdf https://vercel.com/careers/dx-engineer-education-us-5594622004

> jobheist@1.0.0 jobheist /Users/micahbrich/ats
> tsx cli.ts ./micahrich-resume-1.8.1.pdf https://vercel.com/careers/dx-engineer-education-us-5594622004

⏳ Parsing resume...
⏳ Fetching job posting...
⏳ Analyzing compatibility...
**Analyzing ATS compatibility**

I need to perform an ATS compatibility analysis, considering how ATS behaves. I’ll highlight necessary skills such as over eight years of experience building production web applications, especially with React and Next.js, alongside a strong background in educational infrastructure and technical writing. 

The resume shows extensive experience in developing educational content and teaching, like roles at General Assembly, which grew subscribers significantly. The keywords related to skills like Next.js and Vercel seem well covered.**Evaluating keyword matches**

I need to analyze exact keyword matches versus variations. The job specifically asks for "React" and "Next.js," which I see in the resume. It mentions "Next.js" explicitly and has "React" in the technical skills. 

However, to align better with the requirement of "8+ years building production web applications with React/Next.js," I should clearly state that on the resume. ATS may not pick up narrative details easily, so adding "8+ years" near the top or in the summary would be a good idea. I'll suggest phrases like "8+ years building production web applications with React and Next.js."**Assessing educational experience**

I need to focus on education at scale, as the job requires courses, content platforms, or learning programs that reach thousands. The resume mentions achievements like "35,000+ subscribers" and "curriculum reaching millions globally," which is fantastic. 

However, ATS might look for specific phrases like "developer education," "training," or "learning platform." While these terms are in the resume, they might not be exact matches. I should add a line saying, “Proven track record creating developer education at scale (courses, platforms, programs) reaching thousands.” 

For engineering skills, I need keywords like "CLI," "APIs," and "CMS." The resume mentions technical modernization and content development but lacks the exact terms.**Enhancing keyword specificity**

I need to add explicit phrases like "built CLIs," "built APIs," "built/maintained CMS," and "git-like CMS" for better keyword alignment. 

Regarding "exceptional technical writing," the resume does have terms related to that, but maybe adding the exact phrase could be beneficial. I should also include "make complex concepts accessible." 

For self-direction, using "self-directed" or "extreme ownership" would fit the culture fit aspect, though ATS may not prioritize it. I should definitely add the phrase "self-directed."

Additionally, I need to emphasize "passion for empowering developers" and note ideas around the future of technical education. I’ll calculate a realistic pass probability, considering the resume is strong, but may lack the explicit "8+ years" phrase, and specific mentions of "CLI," "APIs," and "CMS."**Estimating ATS pass probability**

I’d estimate a high probability of about 75-85% for passing the ATS keyword filter, but I need to quantify it more accurately. While the resume includes many necessary keywords like React, Next.js, and technical writing, it lacks the explicit "8+ years," which could lower the score slightly. 

Overall, I think an **82%** compatibility score is fair. I should provide a breakdown of matched versus missing keywords, suggesting exact phrases to add (like `8+ years`) and where to place them. 

It’s also useful to present a table showing exact matches versus near-misses for terms like "React" and "developer education at scale." This way, I can ensure the resume meets ATS expectations effectively.
📝 Generating report...
```

```markdown
✅ Analysis complete!

# ATS Compatibility Analysis — DX Engineer, Education at Vercel

**Compatibility score: 82% (Strong match, with a few targeted fixes to push to 95%+)**

Quick summary: Micah's resume already hits the highest-value ATS signals for this role — long, relevant experience, explicit mention of **Next.js**, **React**, **Vercel**, curriculum design, large-scale education platforms, and technical writing. The main gaps are a few exact-phrase matches employers/ATS often look for (explicit `8+ years` phrasing, `CLI` / `APIs` / `CMS` keywords, and common token variations like `React.js`). Add 6–10 exact phrases lower in the resume (summary, skills, and experience bullets) and the resume will satisfy near-all real-world ATS filters for required skills.

---

## 1) What ATS actually filters on (realistic priority)

- High priority (likeliest to be ATS filters)
  - **Exact named technologies and tools**: `React`, `Next.js`, `Vercel`, `TypeScript`, `SWR`, `Supabase`, etc.
  - **Certs / degree keywords** when required (not relevant here).
  - **Quantified experience tokens** such as `8+ years`, `10 years`, `15+ years` (some ATS search for numeric patterns).
  - **Specific role phrases** like `developer education`, `curriculum development`, `technical writing`.
  - **Infrastructure keywords** when asked: `CLI`, `API`, `content management system`, `CMS`, `git-like CMS`, `platform engineering`.

- Medium priority
  - Years-of-experience lines like `15+ years` (useful but may not satisfy a search for `8+ years` depending on ATS logic).
  - Phrases like `built production web applications` (strong when present, medium when unquantified).

- Low priority / fluff (rarely filtered)
  - Soft adjectives: `innovative`, `polished`, `extreme ownership` (cultural but not used reliably by ATS).
  - High-level mission statements unless they contain target keywords.

> Key insight: ATSs are literal. They match tokens and common numeric patterns. Use the exact strings the job posts use (or common variants) in clear fields (summary, skills, experience bullets).

---

## 2) Exact matches vs near-misses (critical terms from the job)

| Job required term | Resume has exact match? | Notes / improvement |
|---|---:|---|
| `React` | **Yes** | Present in bullets and Skills. Good. Add `React.js` variant for safety. |
| `Next.js` | **Yes (exact)** | Appears multiple times (strong). |
| `8+ years` (building production web applications) | **Near-miss** | Resume states `15+ years` in summary — strong, but ATS sometimes looks for the literal `8+ years`. Add an explicit `8+ years building production web applications with React and Next.js`. |
| `Proven track record creating developer education at scale` | **Yes (strong)** | Resume shows `35,000+ subscribers` and `reaching millions`. Add an explicit phrase with `courses`, `content platforms`, or `learning programs` wording used in job. |
| `Engineering skills to build and maintain educational infrastructure (CLIs, APIs, CMS)` | **Near-miss** | Resume mentions platforms, CI/CD, infrastructure, and "content development", but **does not** explicitly list `CLI`, `CLI tools`, `APIs`, or `CMS` keywords. Add exact tokens. |
| `Exceptional technical writing` | **Yes** | `Technical writing`, `documentation systems`, curriculum details present. Consider adding “exceptional” or a concrete example (link to docs or sample). |
| `git-like CMS` | **No / Near-miss** | Job mentions custom `git-like CMS`. Resume does not. Add `git-like CMS` or `git-backed CMS` if accurate. |
| `Self-directed / extreme ownership` | **No (soft)** | Soft but job-listed; add `self-directed` or `extreme ownership` in summary or tagline. |
| `Passion for empowering developers` | **Near-match** | Has “developer education” and community growth. Add explicit `passion for empowering developers` phrase. |

> Warning: A resume that *implies* the skills may still be passed over by a literal ATS filter. Add exact tokens in short phrases to ensure the automated scan passes.

---

## 3) Realistic pass probability (based on real ATS behavior)

- Likelihood to pass an ATS that requires all listed “Must-Have” keywords as tokens: **~82%**
  - Reason: core technical tokens (`React`, `Next.js`, `Vercel`, `TypeScript`, curriculum experience, scale metrics) are present and numerically persuasive. Missing precise tokens like `CLIs`, `APIs`, `CMS`, `git-like CMS`, and the literal `8+ years` phrasing reduce certainty.
- Likelihood to pass a stricter boolean ATS that requires exact phrase matches (e.g., `8+ years` AND `CLI` AND `git-like CMS`): **~55–65%**
  - Reason: near-misses create failure points in strict boolean AND searches.
- After implementing the specific edits below, estimated pass probability rises to **~95%+** for typical ATS boolean searches used by tech companies.

---

## 4) Specific, actionable edits — exact phrases to add (copy-paste)

Add these exact phrases (use backticks as shown). Place them exactly where suggested.

### Add to the top Summary / Professional Title (first 1–2 lines)
- Add a one-line tag under your name or at the start of summary:
  - `8+ years building production web applications with React and Next.js`
  - `Developer education leader — created courses and learning platforms reaching 35,000+ and millions globally`

Example (single-line summary):
- `8+ years building production web applications with React and Next.js · Developer education leader creating courses & platforms reaching 35,000+ and millions globally`

### Add to Technical Skills & Architecture (skills list)
- Append these tokens to that section (comma-separated or each on its own line):
  - `React.js`
  - `React` (already present; keep)
  - `Next.js` (already present; keep)
  - `CLIs / CLI tools`
  - `APIs`
  - `Content Management System (CMS)` or `git-like CMS` (if you built one)
  - `Git-backed CMS` or `git-like CMS` (use whichever is accurate)

Example snippet:
- `Next.js • React • React.js • React Server Components • TypeScript • Vercel • CLIs / CLI tools • APIs • Content Management System (CMS) • git-like CMS • Supabase/Postgres • AI SDKs • WebSockets/Realtime • Tailwind`

### Add to Teaching & Education or a separate “Education Platform Experience” bullet
- Insert an explicit line:
  - `Proven track record creating developer education at scale: courses, content platforms, and learning programs reaching 35,000+ subscribers and millions of learners`
- Or the shorter token (ATS-friendly):
  - `developer education at scale` (as a phrase)

### Add to Wildebeest or Citizen bullets (concrete engineering + education infra)
- For Wildebeest (existing bullet):
  - Add: `Built and maintained CLIs, REST and GraphQL APIs, and a git-like CMS for educational content and developer tooling`
  - `Led development of learning platform infrastructure (CI/CD, API backends, content management system) hosted on Vercel`
- For Citizen (where Next.js is mentioned):
  - Add: `Implemented production Next.js apps, including API endpoints, deployable CLIs, and content management workflows`

Exact lines to paste:
- `Built and maintained CLIs, REST and GraphQL APIs, and a git-like CMS for educational content and developer tooling`
- `Led development of learning platform infrastructure (CI/CD, API backends, content management system) hosted on Vercel`

### Add to General Assembly / Curriculum bullets (technical writing & scale)
- Insert an explicit education-scale phrasing:
  - `Created comprehensive curriculum (110K+ words; 365K+ lines of code) and produced course materials that scaled across 14 markets, reaching thousands of learners`
- Add a technical writing assertion:
  - `Exceptional technical writing: authored instructor guides, reference docs, and hands-on labs used by hundreds of instructors`

Exact lines:
- `Created comprehensive curriculum (110K+ words; 365K+ lines of code) and produced course materials that scaled across 14 markets, reaching thousands of learners`
- `Exceptional technical writing: authored instructor guides, API tutorials, and hands-on labs used across global programs`

### Add a micro-section or one-liner linking to sample docs (if you have them)
- Add under contact or summary:
  - `Examples: curriculum samples and technical docs at https://micah.sh/docs` (only if accurate)
- ATS may not parse URLs semantically, but recruiters will appreciate it.

### Add soft/behavioral token (optional to match job language)
- Add in summary or concluding bullet:
  - `Self-directed with extreme ownership — ships independently and iterates with developer-first feedback`

Exact phrase:
- `Self-directed with extreme ownership`

---

## 5) Minimal edits that produce the biggest ATS lift (prioritize these)

- Insert `8+ years building production web applications with React and Next.js` in summary.
- Add `CLIs`, `APIs`, `Content Management System (CMS)`, and `git-like CMS` to Technical Skills & Architecture.
- Add `developer education at scale` + numbers (e.g., `35,000+ subscribers` / `reaching millions`) in Teaching & Education lines.
- Add `React.js` variant to skills.

These 4 changes will address the typical token checks used in ATS boolean rules and dramatically increase pass chances.

---

## 6) Example small revised snippets to paste into the resume

- Summary line (top):
  - `8+ years building production web applications with React and Next.js · Developer education leader creating courses & platforms reaching 35,000+ subscribers and millions globally · Self-directed with extreme ownership`

- Skills line additions:
  - `CLIs / CLI tools • APIs • Content Management System (CMS) • git-like CMS • React.js`

- Wildebeest bullet augmentation:
  - `Modernized infrastructure with React, Next.js, AI/ML tools, and cloud hosting (Vercel). Built and maintained CLIs, REST/GraphQL APIs, and a git-like CMS for content platforms.`

- General Assembly bullet augmentation:
  - `Created comprehensive curriculum (110K+ words, 365K+ LOC) and instructor materials that scaled across 14 markets, reaching thousands of learners — exceptional technical writing for docs, labs, and tutorials.`

---

## Final notes / honest takeaways

> ATS systems are literal and prize exact tokens and numeric patterns. You already have most of the substantive experience Vercel wants — add a few exact phrases and tokens (not new claims, just explicit wording) and your resume will clear both ATS filters and recruiter screens.
```

## Development

```bash
git clone https://github.com/micahbrich/jobheist.git
cd jobheist
pnpm install
pnpm build

# Test run
pnpm jobheist resume.pdf https://example.com/job

# Development mode
pnpm dev
```

## Philosophy

- **Simple is better**: 2 files, ~500 lines, no magic
- **Fast by default**: Streaming output, smart caching
- **Honest scoring**: Real feedback to improve your chances
- **Unix-style**: Does one thing well - analyzes job fit

## License

MIT - Use it, fork it, improve it. Help others pull off the perfect job heist.

---

*Remember: The best heist is the one where everyone wins. You get the job, the company gets a great hire.*
