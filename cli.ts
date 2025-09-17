#!/usr/bin/env node

/**
 * jobheist CLI
 * Plan the perfect job heist
 */

import { atsStream } from './ats.js'
import 'dotenv/config'
import { config } from 'dotenv'
import { homedir } from 'os'
import { join } from 'path'
import args from 'args'

// Load global config if it exists (~/.jobheistrc)
config({ path: join(homedir(), '.jobheistrc') })

// Phase constants
const PHASES = {
  parsing: '⏳ Parsing resume...',
  scraping: '⏳ Fetching job posting...',
  analyzing: '⏳ Analyzing compatibility...',
  generating: '\n📝 Generating report...',
  complete: '\n✅ Analysis complete!\n'
} as const

// Configure args
args
  .option('format', 'Output format', 'markdown')
  .option('fresh', 'Skip cache and fetch fresh data', false)
  .option('model', 'OpenAI model string', 'gpt-5-mini')
  .option('verbosity', 'Response verbosity', 'low')
  .option('reasoning', 'Reasoning output', 'auto')
  .option('firecrawl-key', 'Firecrawl API key')
  .option('openai-key', 'OpenAI API key')
  .example('jobheist resume.pdf https://jobs.example.com/posting', 'Basic usage')
  .example('jobheist resume.pdf job-url --model=gpt-5 --verbosity=high', 'High verbosity with GPT-5')
  .example('jobheist resume.pdf job-url --reasoning=detailed --fresh', 'Detailed reasoning with fresh data')
  .example('jobheist resume.pdf job-url --firecrawl-key=fc_xxx --openai-key=sk-xxx', 'With API keys')

// Parse arguments
const parsed = args.parse(process.argv)

// Main execution
async function main() {
  // Get positional arguments from args.sub
  const [resume, job] = args.sub || []

  if (!resume || !job) {
    console.error('Error: Both resume and job URL are required')
    args.showHelp()
    process.exit(1)
  }

  // Set API keys from CLI flags if provided (override env)
  if (parsed['firecrawl-key']) {
    process.env.FIRECRAWL_API_KEY = parsed['firecrawl-key']
  }
  if (parsed['openai-key']) {
    process.env.OPENAI_API_KEY = parsed['openai-key']
  }

  // Check for required API keys
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('Error: FIRECRAWL_API_KEY is required')
    console.error('Provide it via:')
    console.error('  1. Command line: --firecrawl-key=fc_xxx')
    console.error('  2. Environment: export FIRECRAWL_API_KEY=fc_xxx')
    console.error('  3. Local .env file')
    console.error('  4. Global config: echo "FIRECRAWL_API_KEY=fc_xxx" >> ~/.jobheistrc')
    process.exit(1)
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is required')
    console.error('Provide it via:')
    console.error('  1. Command line: --openai-key=sk-xxx')
    console.error('  2. Environment: export OPENAI_API_KEY=sk-xxx')
    console.error('  3. Local .env file')
    console.error('  4. Global config: echo "OPENAI_API_KEY=sk-xxx" >> ~/.jobheistrc')
    process.exit(1)
  }

  try {
    // Pure utility functions
    const emoji = (n: number) => {
      if (n >= 80) return '🏆'
      if (n >= 60) return '🥇'
      if (n >= 40) return '⚠️'
      return '🚨'
    }

    // Track state
    let lastPhase = ''
    let scoreShown = false

    const result = await atsStream(resume, job, {
      format: parsed.format as any,
      fresh: parsed.fresh,
      config: {
        ...(parsed.model && { model: parsed.model }),
        ...(parsed.verbosity && { verbosity: parsed.verbosity }),
        ...(parsed.reasoning && { reasoning: parsed.reasoning })
      },
      onProgress: (progress) => {
        // Simple phase messages
        if (PHASES[progress.phase as keyof typeof PHASES] && lastPhase !== progress.phase) {
          lastPhase = progress.phase
          console.error(PHASES[progress.phase as keyof typeof PHASES])
        }

        // Stream reasoning directly with italic gray formatting
        if (progress.phase === 'reasoning' && progress.data && 'text' in progress.data) {
          process.stderr.write(`\x1b[3m\x1b[90m${progress.data.text}\x1b[0m`)
        }

        // Show score for JSON/XML
        if (progress.phase === 'scoring' && progress.data && 'score' in progress.data && parsed.format !== 'markdown' && !scoreShown) {
          scoreShown = true
          const { score } = progress.data
          if (typeof score === 'number') {
            console.error(`${emoji(score)} Score: ${score}/100`)
          }
        }
      }
    })

    // Output the result directly
    console.log(result)

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run if executed directly
main().catch(console.error)
