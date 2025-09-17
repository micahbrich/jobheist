/**
 * ATS Scanner - Minimal, beautiful, functional
 * One file, one purpose: analyze resume-job compatibility
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { streamObject, generateObject, streamText, smoothStream } from 'ai'
import { openai } from '@ai-sdk/openai'
import FirecrawlApp from '@mendable/firecrawl-js'
import { z } from 'zod'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { toXML } from 'jstoxml'


// Simple interfaces - no over-engineering
interface Resume {
  text: string
  name?: string
  email?: string
  phone?: string
}

// Job data structured for ATS analysis
const JobSchema = z.object({
  title: z.string(),
  company: z.string(),
  requiredSkills: z.array(z.string()),
  mustHaveRequirements: z.array(z.string()),
  niceToHave: z.array(z.string()),
  experienceYears: z.number().optional(),
  keyResponsibilities: z.array(z.string()),
  technologies: z.array(z.string()),
  keywords: z.array(z.string()).describe('ATS keywords to match')
})

type Job = z.infer<typeof JobSchema> & {
  text: string  // Full markdown for AI context
  url: string
}

// Configuration options with smart defaults
interface Config {
  model?: string
  verbosity?: 'low' | 'medium' | 'high'
  reasoning?: 'none' | 'auto' | 'detailed'
}

const defaults: Required<Config> = {
  model: 'gpt-5-mini',
  verbosity: 'low',
  reasoning: 'none'
}

interface Score {
  score: number
  keywordAnalysis: {
    strongMatches: Array<{
      keyword: string
      jobFrequency: number
      resumeFrequency: number
    }>
    underRepresented: Array<{
      keyword: string
      jobFrequency: number
      resumeFrequency: number
      suggestion: string
    }>
    notFound: Array<{
      keyword: string
      jobFrequency: number
      impact: number
      suggestion: string
    }>
  }
  suggestions: Array<{
    type: 'add' | 'enhance' | 'rewrite'
    location: string
    current?: string
    suggested: string
    impact: number
    rationale: string
  }>
  analysis: {
    topPriorities: string[]
    currentStrengths: string[]
    opportunities: string[]
    compatibility: { current: number; potential: number }
  }
  optimizations: string[]
}

// Zod schema for AI scoring
const ScoreSchema = z.object({
  score: z.number().min(0).max(100),
  keywordAnalysis: z.object({
    strongMatches: z.array(z.object({
      keyword: z.string(),
      jobFrequency: z.number(),
      resumeFrequency: z.number()
    })),
    underRepresented: z.array(z.object({
      keyword: z.string(),
      jobFrequency: z.number(),
      resumeFrequency: z.number(),
      suggestion: z.string()
    })),
    notFound: z.array(z.object({
      keyword: z.string(),
      jobFrequency: z.number(),
      impact: z.number(),
      suggestion: z.string()
    }))
  }),
  suggestions: z.array(z.object({
    type: z.enum(['add', 'enhance', 'rewrite']),
    location: z.string(),
    current: z.string().optional(),
    suggested: z.string(),
    impact: z.number(),
    rationale: z.string()
  })),
  analysis: z.object({
    topPriorities: z.array(z.string()),
    currentStrengths: z.array(z.string()),
    opportunities: z.array(z.string()),
    compatibility: z.object({
      current: z.number(),
      potential: z.number()
    })
  }),
  optimizations: z.array(z.string())
})

// Parse PDF resume into text
async function parse(path: string): Promise<Resume> {
  const buffer = readFileSync(resolve(path))
  const data = new Uint8Array(buffer)

  // Load the PDF document
  const pdf = await pdfjsLib.getDocument({ data }).promise

  // Extract text from all pages
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map((item: any) => item.str).join(' ')
    text += pageText + '\n'
  }

  // Simple extraction patterns
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const phoneMatch = text.match(/[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/)
  const nameMatch = text.split('\n').find((line: string) => line.trim().length > 0)?.trim()

  return {
    text,
    email: emailMatch?.[0],
    phone: phoneMatch?.[0],
    name: nameMatch
  }
}

// Scrape job posting and extract structured ATS data
async function scrape(url: string, apiKey: string, options?: { maxAge?: number }): Promise<Job> {
  const firecrawl = new FirecrawlApp({ apiKey })

  // Use Firecrawl's LLM extraction for structured job data
  const result = await firecrawl.scrape(url, {
    formats: [{
      type: 'json',
      schema: JobSchema
    }],
    maxAge: options?.maxAge ?? 3600000  // 1hr cache default
  })

  const res = result as any  // Firecrawl v2 types issue

  // Check if we got any data
  if (!res.json && !res.markdown) {
    throw new Error('Failed to scrape job posting')
  }

  // Map Firecrawl's actual response to our schema
  const json = res.json || {}

  // Extract technologies from qualifications
  const technologies: string[] = []
  if (json.qualifications) {
    const techKeywords = ['React', 'TypeScript', 'Tailwind', 'Figma']
    techKeywords.forEach(tech => {
      if (json.qualifications.some((q: string) => q.includes(tech))) {
        technologies.push(tech)
      }
    })
  }

  return {
    text: res.markdown || json.jobDescription || res.html || '',
    url,
    title: json.jobTitle || 'Unknown Position',
    company: json.companyName || 'Unknown Company',
    requiredSkills: json.qualifications || [],
    mustHaveRequirements: json.qualifications || [],
    niceToHave: [],
    keyResponsibilities: json.responsibilities || [],
    technologies,
    keywords: []
  }
}

// Build job context - single source of truth
const context = (job: Job) => `Position: ${job.title} at ${job.company}
Required Skills: ${job.requiredSkills.join(', ')}
Technologies: ${job.technologies.join(', ')}
Must-Have: ${job.mustHaveRequirements.join(', ')}

Full Job Posting:
${job.text}`

// Build deep ATS reasoning prompt for markdown output
function reason(resume: string, job: Job): string {
  return `You are an ATS (Applicant Tracking System) expert analyzing resume-job compatibility.

THINK DEEPLY about how real ATS systems work. Consider:

1. **Keyword Categories** - Which keywords are ACTUAL ATS filters vs descriptive fluff?
   - Hard skills/tools (React, Figma, AWS) = HIGH priority ATS filters
   - Certifications/degrees = HIGH priority
   - Years of experience (when quantified) = MEDIUM priority  
   - Soft skills/adjectives (innovative, polished) = RARELY filtered
   
2. **Exact Match vs Synonyms** - Will ATS recognize variations?
   - "React" ≠ "React.js" ≠ "ReactJS" in many ATS systems
   - "3 years" ≠ "three years" ≠ "3+ years"
   - Consider which exact form THIS job uses
   
3. **Context Importance** - Where do keywords appear?
   - In "Required Skills" = CRITICAL exact match needed
   - In "Nice to Have" = Less critical
   - In company description = Usually not filtered

JOB CONTEXT:
${context(job)}

RESUME:
${resume}

TASK:
Analyze this resume's ATS compatibility by:
1. First reasoning about which keywords are REAL ATS filters (tools, technologies, quantified experience) vs descriptive language
2. Checking for exact matches vs near-misses (e.g., "React" vs "React.js")
3. Calculating realistic pass probability based on ACTUAL ATS behavior
4. Providing specific, actionable improvements with EXACT phrases to add

Output natural, helpful markdown that:
- It's cleanly formatted, clear, and easy to read and understand
- Starts with a compatibility score and summary
- Explains which keywords ACTUALLY matter for ATS and why
- Shows exact matches vs near-misses
- Gives specific text to add/change with locations
- Focuses on what real ATS systems filter on, not generic advice
- Includes realistic assessment of chances

Be honest about what matters and what doesn't. For example, "polished" or "innovative" are unlikely ATS filters, while "Figma" or "Python" definitely are.

IMPORTANT: Do NOT include the full resume text in your response. Only reference specific parts when making suggestions or showing examples.

Your entire job is to give this advice. You don't need to offer to do anything else.

ABSOLUTE RULES ABOUT SCOPE:
- Do NOT include any offers, calls-to-action, or suggestions to perform additional tasks.
- Do NOT write phrases like "If you want, I can...", "I can also...", "Let me know if you want me to...", or any variant.
- Do NOT propose generating extra content (summaries, skills lines, cover letters, emails, bullet points) beyond the analysis itself.
- End the response immediately after the final assessment without inviting further work.

MARKDOWN FORMATTING REQUIREMENTS:
- Use proper heading hierarchy (# for main title, ## for sections, ### for subsections)
- Use **bold** for important keywords and scores
- Use bullet points (- or *) for lists, not numbered lists
- Use > blockquotes for key insights or warnings
- Use \`backticks\` for specific technical terms or exact phrases to add
- Use --- for section separators if needed
- Keep paragraphs concise - prefer short paragraphs over walls of text
- Use tables with | pipes | for | comparisons when appropriate

END OF RESPONSE CONSTRAINT:
- Conclude after the Compatibility Assessment section. Do not add closing lines, offers, next steps, or any further assistance.
`
}

// Build AI prompt for scoring with structured job data (for JSON/XML)
function prompt(resume: string, job: Job): string {
  return `You are an ATS (Applicant Tracking System) compatibility analyzer providing detailed keyword and content analysis.

Your goal: Help candidates understand how their resume aligns with job requirements and identify optimization opportunities.

JOB POSTING:
${context(job)}

RESUME:
${resume}

PROVIDE DETAILED ANALYSIS:

FIRST: Calculate an overall compatibility score from 0-100 based on keyword matches and alignment.

1. KEYWORD ANALYSIS - Compare keyword frequency between job and resume:
   - strongMatches: Keywords that appear adequately in both (within 50% frequency)
   - underRepresented: Keywords present but could be stronger (job frequency 2x+ higher)
     * MUST include suggestion for each underRepresented keyword
   - notFound: Important keywords missing from resume (appear 3+ times in job, 0 in resume)
     * MUST include impact and suggestion for each notFound keyword
   - Include exact counts and constructive suggestions

2. SUGGESTIONS - Specific improvements to consider:
   - Type: 'add' (new content), 'enhance' (strengthen existing), or 'rewrite' (revise section)
   - Location: Specific section in resume
   - Current text (if enhancing/rewriting)
   - Suggested text with exact wording
   - Impact: estimated point improvement
   - Rationale: why this change would help

3. ANALYSIS - Overall assessment:
   - topPriorities: What the role emphasizes most (based on repetition/placement)
   - currentStrengths: What the resume does well
   - opportunities: Areas for potential improvement
   - compatibility: realistic match percentage (current and potential with changes)

4. OPTIMIZATIONS - Quick improvements:
   - List 3-5 simple enhancements that could improve compatibility

GUIDELINES:
- Be specific with counts (e.g., "React: 8x in job, 2x in resume")
- Provide exact text suggestions, not general advice
- Focus on ATS keyword matching and alignment
- Keep suggestions practical and achievable
- Maintain neutral, professional tone
- Typical compatibility ranges from 40-85%
- IMPORTANT: All arrays must have at least 1 item - use placeholder if needed
- For empty arrays, include at least one item like "None identified" or "No changes needed"`
}

// Analyze resume against job using AI
async function analyze(resume: Resume, job: Job, config: Config = {}): Promise<Score> {
  const opts = { ...defaults, ...config }
  const promptText = prompt(resume.text, job)

  try {
    const { object } = await generateObject({
      model: openai(opts.model),
      schema: ScoreSchema,
      prompt: promptText,
      maxRetries: 2,
      providerOptions: {
        openai: {
          textVerbosity: opts.verbosity
        }
      }
    })

    return object
  } catch (error) {
    console.error('Generation failed:', error)
    // Provide a fallback minimal response
    throw new Error(`Failed to generate analysis: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Stream analysis with progress callbacks
async function analyzeStream(
  resume: Resume,
  job: Job,
  config: Config = {},
  onProgress?: (partial: any) => void,
  abortSignal?: AbortSignal
): Promise<Score> {
  const opts = { ...defaults, ...config }
  const promptText = prompt(resume.text, job)

  const { partialObjectStream, object } = streamObject({
    model: openai(opts.model),
    schema: ScoreSchema,
    prompt: promptText,
    maxRetries: 2,
    abortSignal,
    providerOptions: {
      openai: {
        textVerbosity: opts.verbosity
      }
    }
  })

  if (onProgress) {
    for await (const partial of partialObjectStream) {
      onProgress(partial)
    }
  }

  try {
    return await object
  } catch (error) {
    // If streaming fails, fall back to non-streaming
    console.error('\r📡 Streaming failed, falling back to standard generation')
    return await analyze(resume, job, config)
  }
}

// Render score as different output types
function render(score: Score, type: 'json' | 'xml' | 'markdown' = 'json'): string {
  switch (type) {
    case 'json': return JSON.stringify(score, null, 2)
    case 'xml': return toXML({ evaluation: score }, {
      header: true,
      indent: '  '
    })
    case 'markdown': {
      const { keywordAnalysis, suggestions, analysis, optimizations } = score

      return `# ATS Compatibility Report: ${score.score}/100

## Keyword Analysis

### ✅ Strong Matches
${keywordAnalysis.strongMatches.length > 0 ?
          keywordAnalysis.strongMatches.map(k =>
            `**${k.keyword}** - You: ${k.resumeFrequency}x | Job: ${k.jobFrequency}x`
          ).join('\n') : 'No strong keyword matches identified'}

### ⚠️ Under-represented Keywords
${keywordAnalysis.underRepresented.length > 0 ?
          keywordAnalysis.underRepresented.map(k =>
            `**${k.keyword}** - You: ${k.resumeFrequency}x | Job: ${k.jobFrequency}x\n→ Consider: ${k.suggestion}`
          ).join('\n\n') : 'All present keywords are well-represented'}

### ❌ Keywords Not Found
${keywordAnalysis.notFound.length > 0 ?
          keywordAnalysis.notFound.map(k =>
            `**${k.keyword}** - Job mentions: ${k.jobFrequency}x\n→ Consider: ${k.suggestion}`
          ).join('\n\n') : 'No critical keywords missing'}

## Optimization Opportunities

${suggestions.map((s, i) => {
            const header = `### Suggestion #${i + 1}: ${s.type.charAt(0).toUpperCase() + s.type.slice(1)} ${s.location}`
            const current = s.current ? `**Current:** "${s.current}"` : ''
            const suggested = `**Consider:** "${s.suggested}"`
            const impact = `**Potential Impact:** +${s.impact} points`
            const rationale = `**Rationale:** ${s.rationale}`
            return [header, current, suggested, impact, rationale].filter(Boolean).join('\n')
          }).join('\n\n')}

## Role Analysis

### Top Priorities
${analysis.topPriorities.map(p => `- ${p}`).join('\n')}

### Your Strengths
${analysis.currentStrengths.map(s => `- ${s}`).join('\n')}

### Opportunities
${analysis.opportunities.map(o => `- ${o}`).join('\n')}

## Quick Optimizations
${optimizations.map(o => `→ ${o}`).join('\n')}

## Compatibility Assessment
**Current Match:** ${analysis.compatibility.current}%
**Potential Match:** ${analysis.compatibility.potential}%
**Possible Improvement:** +${analysis.compatibility.potential - analysis.compatibility.current}%

${score.score >= 80 ? '✅ **Excellent match** - Your resume strongly aligns with requirements' :
          score.score >= 65 ? '👍 **Good match** - Solid foundation with room for optimization' :
            score.score >= 50 ? '📝 **Moderate match** - Consider the suggestions above to strengthen alignment' :
              '⚠️ **Limited match** - Significant improvements recommended before applying'}`
    }
    default: return JSON.stringify(score, null, 2)
  }
}

// Main API - simple one-shot analysis
export async function ats(
  resumePath: string,
  jobUrl: string,
  options: {
    firecrawlKey?: string
    format?: 'json' | 'xml' | 'markdown'
    maxAge?: number
    config?: Config
    abortSignal?: AbortSignal
  } = {}
): Promise<string> {
  const firecrawlKey = options.firecrawlKey || process.env.FIRECRAWL_API_KEY
  if (!firecrawlKey) throw new Error('FIRECRAWL_API_KEY required')

  const resume = await parse(resumePath)
  const job = await scrape(jobUrl, firecrawlKey, { maxAge: options.maxAge })

  const formatType = options.format || 'markdown'
  const config = { ...defaults, ...options.config }

  // For markdown, use streamText without streaming for simplicity
  if (formatType === 'markdown') {
    const result = streamText({
      model: openai(config.model),
      prompt: reason(resume.text, job),
      abortSignal: options.abortSignal,
      providerOptions: {
        openai: {
          reasoningSummary: config.reasoning === 'none' ? 'auto' : config.reasoning,
          textVerbosity: config.verbosity
        },
      },
    })

    // Accumulate text without streaming
    let text = ''
    for await (const chunk of result.textStream) {
      text += chunk
    }
    return text
  }

  // For JSON/XML, use streaming object generation
  const result = await analyzeStream(resume, job, config, undefined, options.abortSignal)
  return render(result, formatType)
}

// Streaming API - with progress callbacks
export async function atsStream(
  resumePath: string,
  jobUrl: string,
  options: {
    firecrawlKey?: string
    format?: 'json' | 'xml' | 'markdown'
    maxAge?: number
    config?: Config
    onProgress?: (progress: ProgressUpdate) => void
    abortSignal?: AbortSignal
  } = {}
): Promise<string> {
  const firecrawlKey = options.firecrawlKey || process.env.FIRECRAWL_API_KEY
  if (!firecrawlKey) throw new Error('FIRECRAWL_API_KEY required')

  // Parse resume
  options.onProgress?.({ phase: 'parsing' })
  const resume = await parse(resumePath)
  options.onProgress?.({ phase: 'parsed', data: { name: resume.name, email: resume.email } })

  // Scrape job
  options.onProgress?.({ phase: 'scraping' })
  const job = await scrape(jobUrl, firecrawlKey, { maxAge: options.maxAge })
  options.onProgress?.({ phase: 'scraped', data: { title: job.title, company: job.company } })

  const formatType = options.format || 'markdown'
  const config = { ...defaults, ...options.config }

  // For markdown, use streamText with reasoning
  if (formatType === 'markdown') {
    options.onProgress?.({ phase: 'analyzing' })

    const { fullStream, textStream } = streamText({
      model: openai(config.model),
      prompt: reason(resume.text, job),
      abortSignal: options.abortSignal,
      experimental_transform: smoothStream({ chunking: 'word' }),
      providerOptions: {
        openai: {
          reasoningSummary: config.reasoning === 'none' ? 'auto' : config.reasoning,
          textVerbosity: config.verbosity
        },
      },
    })

    // Accumulate the final text while showing progress
    let result = ''

    if (options.onProgress) {
      // Process both streams properly
      const processStream = async () => {
        for await (const part of fullStream) {
          if (part.type === 'reasoning-delta' && config.reasoning !== 'none') {
            options.onProgress!({ phase: 'reasoning', data: { text: part.text } })
          } else if (part.type === 'text-delta') {
            options.onProgress!({ phase: 'generating', data: { text: part.text } })
          }
        }
      }

      // Start processing stream
      processStream()
    }

    // Collect the actual text result
    for await (const chunk of textStream) {
      result += chunk
    }

    options.onProgress?.({ phase: 'complete' })
    return result
  }

  // For JSON/XML, use object generation
  options.onProgress?.({ phase: 'scoring' })
  const result = await analyzeStream(resume, job, config, (partial) => {
    options.onProgress?.({ phase: 'scoring', data: partial })
  }, options.abortSignal)
  options.onProgress?.({ phase: 'complete', data: result })

  return render(result, formatType)
}

// Progress callback types
export type Phase =
  | 'parsing'
  | 'parsed'
  | 'scraping'
  | 'scraped'
  | 'analyzing'
  | 'reasoning'
  | 'generating'
  | 'scoring'
  | 'complete'

export interface ParsedData {
  name?: string
  email?: string
}

export interface ScrapedData {
  title: string
  company: string
}

export interface TextData {
  text: string
}

export interface ScoringData {
  score?: number
  keywordAnalysis?: Partial<Score['keywordAnalysis']>
  suggestions?: Partial<Score['suggestions']>
  analysis?: Partial<Score['analysis']>
  optimizations?: string[]
}

export type ProgressData =
  | ParsedData
  | ScrapedData
  | TextData
  | ScoringData
  | Score
  | undefined

export interface ProgressUpdate {
  phase: Phase
  data?: ProgressData
}

// Export types for programmatic use
export type { Resume, Job, Score, Config }