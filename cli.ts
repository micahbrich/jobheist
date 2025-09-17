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
const write = (text: string) => process.stdout.write(text as string)
const status = (text: string) => process.stderr.write(`\r\x1b[K${text}`)
const done = () => process.stderr.write('\n')

// Configure args
args
  .option('format', 'Output format', 'markdown')
  .option('fresh', 'Skip cache and fetch fresh data', false)
  .option('model', 'OpenAI model string', 'gpt-5-mini')
  .option('verbosity', 'Response verbosity', 'low')
  .option('reasoning', 'Reasoning output', 'none')
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
    analyzed: '✓',
    reasoning: '💭',
    generating: '✍️',
    scoring: '📊',
    complete: '✅'
  }

  // Phase tracking
  const phases = ['parsed', 'scraped', 'analyzed']
  const completed = new Set<string>()
  let score = 0
  let isStreaming = false

  // Build accumulated status string
  const buildStatus = (current: string) => {
    const parts: string[] = []

    // Add completed phases
    for (const p of phases) {
      if (completed.has(p)) {
        parts.push(`✓ ${p}`)
      }
    }

    // Add current phase
    if (!['complete', 'generating', 'reasoning'].includes(current)) {
      const icon = icons[current] || '⚡'
      parts.push(`${icon} ${current}...`)
    }

    // Add score if available
    if (score) {
      parts.push(`${score}/100`)
    }

    return parts.join(' | ')
  }

  try {
    const result = await atsStream(resume, job, {
      format: parsed.format as 'markdown' | 'json' | 'xml',
      fresh: parsed.fresh,
      config: {
        model: parsed.model,
        verbosity: parsed.verbosity as 'low' | 'medium' | 'high',
        reasoning: parsed.reasoning as 'none' | 'auto' | 'detailed'
      },
      onProgress: ({ phase, data }) => {
        // Update score if available
        if (data && 'score' in data && typeof data.score === 'number') {
          score = data.score
        }

        // Mark phases as complete
        if (phase === 'parsed') completed.add('parsed')
        if (phase === 'scraped') completed.add('scraped')
        if (phase === 'analyzing') completed.delete('analyzed') // Remove if re-analyzing
        if (phase === 'reasoning' || phase === 'generating' || phase === 'scoring') {
          completed.add('analyzed')
        }

        // Stream text content with formatting
        if (data && 'text' in data) {
          if (phase === 'reasoning') {
            if (!isStreaming) {
              done() // Clear status line before streaming
              isStreaming = true
            }
            write(data.text)
          } else if (phase === 'generating') {
            if (!isStreaming) {
              done() // Clear status line before streaming
              isStreaming = true
            }
            write(data.text)
          }
        } else if (phase !== 'complete') {
          // Show accumulated status updates
          status(buildStatus(phase))
          isStreaming = false
        }

        // Clear status when complete
        if (phase === 'complete') {
          done()
        }
      }
    })

    // Output result only for non-markdown formats (markdown was already streamed)
    if (parsed.format !== 'markdown') {
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