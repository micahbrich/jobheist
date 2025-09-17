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

// Simple output utilities
const write = (text: string) => process.stdout.write(text)
const status = (text: string) => process.stderr.write(`\r\x1b[K${text}`)
const done = () => process.stderr.write('\n')

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

const parsed = args.parse(process.argv)

// Main execution
async function main() {
  const [resume, job] = args.sub || []

  if (!resume || !job) {
    console.error('Usage: jobheist resume.pdf https://job-url')
    args.showHelp()
    process.exit(1)
  }

  // Set API keys from CLI flags if provided
  if (parsed['firecrawl-key']) process.env.FIRECRAWL_API_KEY = parsed['firecrawl-key']
  if (parsed['openai-key']) process.env.OPENAI_API_KEY = parsed['openai-key']

  // Check for required API keys
  if (!process.env.FIRECRAWL_API_KEY || !process.env.OPENAI_API_KEY) {
    console.error('Missing API keys. Set via:')
    console.error('  --firecrawl-key=fc_xxx --openai-key=sk-xxx')
    console.error('  export FIRECRAWL_API_KEY=fc_xxx OPENAI_API_KEY=sk-xxx')
    console.error('  echo "FIRECRAWL_API_KEY=fc_xxx" >> ~/.jobheistrc')
    process.exit(1)
  }

  // Progress icons
  const icons: Record<string, string> = {
    parsing: '📄',
    parsed: '✓',
    scraping: '🔍',
    scraped: '✓',
    analyzing: '🤖',
    reasoning: '💭',
    generating: '✍️',
    scoring: '📊',
    complete: '✅'
  }

  let score = 0
  let isStreaming = false

  try {
    const result = await atsStream(resume, job, {
      format: parsed.format as 'markdown' | 'json' | 'xml',
      fresh: parsed.fresh,
      config: {
        model: parsed.model,
        verbosity: parsed.verbosity as 'low' | 'medium' | 'high',
        reasoning: parsed.reasoning as 'auto' | 'detailed'
      },
      onProgress: ({ phase, data }) => {
        // Update score if available
        if (data && 'score' in data && typeof data.score === 'number') {
          score = data.score
        }

        // Stream text content directly
        if ((phase === 'reasoning' || phase === 'generating') && data && 'text' in data) {
          if (!isStreaming) {
            done() // Clear status line before streaming
            isStreaming = true
          }
          write(data.text)
        } else {
          // Show status updates
          const icon = icons[phase] || '⚡'
          const scoreText = score ? ` | ${score}/100` : ''
          status(`${icon} ${phase}${scoreText}`)
          isStreaming = false
        }

        // Clear status when complete
        if (phase === 'complete') {
          done()
        }
      }
    })

    // Output result if not already streamed
    if (parsed.format !== 'markdown' || !result) {
      console.log(result)
    }
  } catch (error) {
    done()
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`\n❌ Error: ${message}`)
    process.exit(1)
  }
}

// Run
main().catch(error => {
  console.error(error)
  process.exit(1)
})