#!/usr/bin/env node

/**
 * jobheist CLI
 * Plan the perfect job heist
 */

import { atsStream } from './ats'
import 'dotenv/config'
import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { parse } from 'dotenv'

// Load global config if it exists (~/.jobheistrc)
function loadGlobalConfig() {
  const configPath = join(homedir(), '.jobheistrc')
  if (existsSync(configPath)) {
    try {
      const parsed = parse(readFileSync(configPath))
      for (const [key, value] of Object.entries(parsed)) {
        if (value && !process.env[key]) {
          process.env[key] = value
        }
      }
    } catch (err) {
      // Silently ignore errors reading global config
    }
  }
}

// Load global config before parsing args
loadGlobalConfig()

// Simple arg parsing - no Commander.js needed
function parseArgs(): {
  resume: string
  job: string
  format: string
  fresh: boolean
  firecrawlKey?: string
  openaiKey?: string
  help: boolean
} {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    return { resume: '', job: '', format: 'markdown', fresh: false, help: true }
  }

  // Parse format (only json, xml, markdown now)
  const formatIndex = args.findIndex(a => a.startsWith('--format'))
  let format = formatIndex !== -1
    ? args[formatIndex].includes('=')
      ? args[formatIndex].split('=')[1]
      : args[formatIndex + 1]
    : 'markdown'

  // Validate format
  if (format && !['json', 'xml', 'markdown'].includes(format)) {
    console.error(`Invalid format: ${format}. Use json, xml, or markdown.`)
    format = 'markdown'
  }

  // Parse fresh flag
  const fresh = args.includes('--fresh')

  // Parse API keys
  const firecrawlIndex = args.findIndex(a => a.startsWith('--firecrawl-key'))
  const firecrawlKey = firecrawlIndex !== -1
    ? args[firecrawlIndex].includes('=')
      ? args[firecrawlIndex].split('=')[1]
      : args[firecrawlIndex + 1]
    : undefined

  const openaiIndex = args.findIndex(a => a.startsWith('--openai-key'))
  const openaiKey = openaiIndex !== -1
    ? args[openaiIndex].includes('=')
      ? args[openaiIndex].split('=')[1]
      : args[openaiIndex + 1]
    : undefined

  // Filter out flags to get positional args
  const cleanArgs = args.filter(a =>
    !a.startsWith('--format') && a !== format &&
    !a.startsWith('--fresh') &&
    !a.startsWith('--firecrawl-key') && a !== firecrawlKey &&
    !a.startsWith('--openai-key') && a !== openaiKey
  )

  return {
    resume: cleanArgs[0] || '',
    job: cleanArgs[1] || '',
    format: format || 'markdown',
    fresh,
    firecrawlKey,
    openaiKey,
    help: false
  }
}

// Show help message
function showHelp() {
  console.log(`
jobheist - Plan the perfect job heist

Usage:
  jobheist <resume.pdf> <job-url> [options]

Options:
  --format <type>         Output format: json, xml, markdown (default: markdown)
  --fresh                 Skip cache and fetch fresh data
  --firecrawl-key <key>   Firecrawl API key (overrides env variable)
  --openai-key <key>      OpenAI API key (overrides env variable)
  --help, -h              Show this help message

Examples:
  jobheist resume.pdf https://jobs.example.com/posting
  jobheist resume.pdf https://jobs.example.com/posting --format=json
  jobheist cv.pdf https://careers.site.com/role --format=markdown
  jobheist resume.pdf job-url --firecrawl-key=fc_xxx --openai-key=sk-xxx

Environment:
  FIRECRAWL_API_KEY  API key for job scraping (or use --firecrawl-key)
  OPENAI_API_KEY     API key for AI scoring (or use --openai-key)

Configuration priority (highest to lowest):
  1. Command line flags (--openai-key, --firecrawl-key)
  2. Environment variables
  3. .env file in current directory
  4. ~/.jobheist global config file

Setting up global config:
  echo "OPENAI_API_KEY=sk-xxx" >> ~/.jobheist
  echo "FIRECRAWL_API_KEY=fc_xxx" >> ~/.jobheist
`)
}

// Main execution
async function main() {
  const { resume, job, format, fresh, firecrawlKey, openaiKey, help } = parseArgs()

  if (help) {
    showHelp()
    process.exit(0)
  }

  if (!resume || !job) {
    console.error('Error: Both resume and job URL are required')
    showHelp()
    process.exit(1)
  }

  // Set API keys from CLI flags if provided (override env)
  if (firecrawlKey) {
    process.env.FIRECRAWL_API_KEY = firecrawlKey
  }
  if (openaiKey) {
    process.env.OPENAI_API_KEY = openaiKey
  }

  // Check for required API keys
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('Error: FIRECRAWL_API_KEY is required')
    console.error('Provide it via:')
    console.error('  1. Command line: --firecrawl-key=fc_xxx')
    console.error('  2. Environment: export FIRECRAWL_API_KEY=fc_xxx')
    console.error('  3. Local .env file')
    console.error('  4. Global config: echo "FIRECRAWL_API_KEY=fc_xxx" >> ~/.jobheist')
    process.exit(1)
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is required')
    console.error('Provide it via:')
    console.error('  1. Command line: --openai-key=sk-xxx')
    console.error('  2. Environment: export OPENAI_API_KEY=sk-xxx')
    console.error('  3. Local .env file')
    console.error('  4. Global config: echo "OPENAI_API_KEY=sk-xxx" >> ~/.jobheist')
    process.exit(1)
  }

  try {
    // Pure utility functions
    const scoreEmoji = (n: number) =>
      n >= 90 ? '🏆' : n >= 80 ? '🥇' : n >= 70 ? '🥈' :
        n >= 60 ? '🥉' : n >= 50 ? '🏅' : n >= 40 ? '⚠️' :
          n >= 30 ? '🔴' : n >= 20 ? '🟠' : '🚨'

    // Simple progress messages
    const phases: Record<string, string> = {
      parsing: '⏳ Parsing resume...',
      scraping: '⏳ Fetching job posting...',
      analyzing: '⏳ Analyzing compatibility...',
      generating: '\n📝 Generating report...',
      complete: '\n✅ Analysis complete!\n'
    }

    // Track state
    let lastPhase = ''
    let scoreShown = false

    const result = await atsStream(resume, job, {
      format: format as any,
      fresh,
      onProgress: (progress) => {
        // Simple phase messages
        if (phases[progress.phase] && lastPhase !== progress.phase) {
          lastPhase = progress.phase
          console.error(phases[progress.phase])
        }

        // Stream reasoning directly with italic gray formatting
        if (progress.phase === 'reasoning' && progress.data?.text) {
          process.stderr.write(`\x1b[3m\x1b[90m${progress.data.text}\x1b[0m`)
        }

        // Show score for JSON/XML
        if (progress.phase === 'scoring' && progress.data?.score && format !== 'markdown' && !scoreShown) {
          scoreShown = true
          const { score } = progress.data
          console.error(`${scoreEmoji(score)} Score: ${score}/100`)
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
