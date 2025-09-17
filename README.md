# jobheist 💼

[![npm version](https://img.shields.io/npm/v/jobheist.svg)](https://www.npmjs.com/package/jobheist)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/jobheist.svg)](https://www.npmjs.com/package/jobheist)

> **They're using AI to screen you out. Use AI to get in.**

## The Game Has Changed

Remember when getting a job was about being qualified? Now it's about gaming an algorithm.

Whether it's a startup or Fortune 500, companies use ATS to search and rank resumes. These systems don't reject you — they make you invisible. Wrong keywords = buried in their database while less qualified but better-optimized resumes rise to the top.

**jobheist** is your inside edge. It analyzes your resume against any job posting, shows you exactly what the ATS is looking for, and tells you what's missing. Consider it reconnaissance—knowing exactly what they're looking for before you make your move.

**Time to even the odds.**

## How It Works

```bash
jobheist resume.pdf https://dream-company.com/perfect-role

# In seconds, you'll know:
# ✓ Your ATS compatibility score (0-100)
# ✓ Keywords you're missing
# ✓ Skills they want that you haven't mentioned
# ✓ Specific suggestions to improve your match
```

Powered by [Firecrawl](https://firecrawl.com)'s intelligent scraping and OpenAI's latest models. Just 2 files, ~850 lines—because the best tools don't need to be complicated.

## Quick Start

```bash
# One-time play
npx jobheist resume.pdf https://jobs.example.com/posting

# Or keep it in your arsenal
npm install -g jobheist
jobheist resume.pdf https://dream-company.com/perfect-role
```

## The Intel

You wouldn't rob a bank without casing it first. **jobheist** gives you:

- **Match Score** — Your probability of passing the ATS filter (0-100)
- **Missing Keywords** — The exact terms they're scanning for that you don't have
- **Skill Gaps** — Technologies and competencies to add (if you have them)
- **Strategic Recommendations** — Specific changes to improve your odds
- **Confidence Indicators** — How certain we are about each finding

## Command Reference

```bash
# Standard analysis
jobheist resume.pdf https://example.com/job

# Export the intelligence (for tracking multiple applications)
jobheist resume.pdf https://example.com/job --format=json
jobheist resume.pdf https://example.com/job --format=xml

# Fresh analysis (bypass cache)
jobheist resume.pdf https://example.com/job --max-age=0

# Advanced operations
jobheist resume.pdf https://example.com/job --model=gpt-5 --verbosity=high

# See the AI's reasoning (understand the analysis)
jobheist resume.pdf https://example.com/job --reasoning=auto

# BYO credentials
jobheist resume.pdf https://example.com/job \
  --firecrawl-key=fc_xxx \
  --openai-key=sk-xxx
```

## Setup

### API Keys

You'll need two keys for this operation:
- **OpenAI** — For the analysis engine ([Get one here](https://platform.openai.com/api-keys))
- **Firecrawl** — For job scraping ([Get one here](https://firecrawl.com))

Configure them however suits your style:

**The Mastermind** (Global Config)
```bash
# Set once, use everywhere
echo "OPENAI_API_KEY=sk-xxx" >> ~/.jobheistrc
echo "FIRECRAWL_API_KEY=fc_xxx" >> ~/.jobheistrc
chmod 600 ~/.jobheistrc  # Keep it secure
```

**The Ghost** (Environment Variables)
```bash
export OPENAI_API_KEY=sk-xxx
export FIRECRAWL_API_KEY=fc_xxx
```

**The Planner** (Local .env)
```bash
# In your project directory
echo "OPENAI_API_KEY=sk-xxx" >> .env
echo "FIRECRAWL_API_KEY=fc_xxx" >> .env
```

**The Freelancer** (CLI Flags)
```bash
jobheist resume.pdf https://job-url \
  --openai-key=sk-xxx \
  --firecrawl-key=fc_xxx
```

> **Note**: Priority order is CLI flags → env vars → .env → ~/.jobheistrc

## For Developers

Building your own crew? Here's how to integrate:

```typescript
import { ats, atsStream } from 'jobheist'

// Quick analysis
const score = await ats('resume.pdf', 'https://example.com/job')

// Real-time progress tracking
await atsStream('resume.pdf', 'https://example.com/job', {
  onProgress: (update) => {
    console.log(`Phase: ${update.phase}`)
  }
})
```

See the [API Reference](./docs/api-reference.mdx) for complete documentation and [Progress Phases](./docs/progress-phases.mdx) for detailed callback documentation.

## Under the Hood

**jobheist** assembles a precision team:

- **PDF Parser** — Mozilla's pdfjs-dist extracts your resume text perfectly
- **Job Intel** — [Firecrawl](https://www.firecrawl.dev) scrapes and structures job postings in seconds
- **Analysis Engine** — [Vercel AI SDK](https://ai-sdk.dev/) + OpenAI for intelligent pattern matching
- **Scoring Algorithm** — Transparent 0-100 scoring based on keyword matches, skill alignment, and requirement coverage

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

- **Simple is better**: 2 files, ~850 lines, no magic
- **Fast by default**: Streaming output, smart caching
- **Honest scoring**: Real feedback to improve your chances
- **Unix-style**: Does one thing well - analyzes job fit

## License

MIT - Use it, fork it, improve it. Help others pull off the perfect job heist.

---

*The perfect heist? Everyone wins. You land the job. They find their person. The algorithm never saw it coming.*

*Built by [@micahbrich](https://x.com/micahbrich) • Open to new opportunities*
