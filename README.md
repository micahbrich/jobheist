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

# Advanced analysis options
jobheist resume.pdf https://example.com/job --model=gpt-5 --verbosity=high --reasoning=detailed

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

## Programmatic Usage

```typescript
import { ats, atsStream } from 'jobheist'

// Simple analysis
const score = await ats('resume.pdf', 'https://example.com/job')

// With progress tracking
await atsStream('resume.pdf', 'https://example.com/job', {
  onProgress: (update) => {
    console.log(`Phase: ${update.phase}`)
  }
})
```

See the [API Reference](./docs/api-reference.mdx) for complete documentation and [Progress Phases](./docs/progress-phases.mdx) for detailed callback documentation.

## The Crew

- **PDF Parser**: Extracts text from your resume using Mozilla's pdfjs-dist
- **Job Scraper**: [Firecrawl](https://www.firecrawl.dev) grabs structured job data in seconds
- **AI Analyzer**: [Vercel AI SDK](https://ai-sdk.dev/) + GPT-5-mini provides intelligent matching and recommendations
- **Score System**: 0-100 rating of your match probability

## Example Output

See [example outputs](./docs/examples.mdx) for real sample analysis reports and what to expect.

## Documentation

- [Complete API Documentation](./docs/) - Full reference and guides
- [Example Outputs](./docs/examples.mdx) - Real sample analysis reports
- [Usage Patterns](./docs/usage-patterns.mdx) - Code examples and integrations
- [Progress Phases](./docs/progress-phases.mdx) - Detailed onProgress callback documentation

## Development

```bash
git clone https://github.com/micahbrich/jobheist.git
cd jobheist
pnpm install
pnpm build
pnpm jobheist resume.pdf https://example.com/job
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
