# jobheist Documentation

Complete documentation for the jobheist ATS analysis library.

## Documentation

- [API Reference](./api-reference.mdx) - Complete function and type reference
- [Progress Phases](./progress-phases.mdx) - Detailed onProgress callback documentation
- [Example Outputs](./examples.mdx) - Real sample outputs and analysis reports
- [Usage Patterns](./usage-patterns.mdx) - Code examples and integration patterns
- [Troubleshooting](./troubleshooting.mdx) - Common issues and solutions

## Quick Links

- [GitHub Repository](https://github.com/micahbrich/jobheist)
- [NPM Package](https://www.npmjs.com/package/jobheist)
- [Main README](../README.md)

## Getting Started

```bash
# Install
npm install jobheist

# Basic usage
import { ats, atsStream } from 'jobheist'

const result = await ats('resume.pdf', 'https://job-url')
```

## Examples

### Simple Analysis
```typescript
import { ats } from 'jobheist'

const score = await ats('resume.pdf', 'https://example.com/job')
console.log(score)
```

### Progress Tracking
```typescript
import { atsStream } from 'jobheist'

await atsStream('resume.pdf', 'https://job-url', {
  onProgress: (progress) => {
    console.log(`Phase: ${progress.phase}`)
  }
})
```

## Output Formats

- **Markdown** (default): Human-readable analysis
- **JSON**: Structured data for automation
- **XML**: For systems that prefer XML

## Configuration

Set your API keys via environment variables or CLI flags:

```bash
export OPENAI_API_KEY=sk-xxx
export FIRECRAWL_API_KEY=fc_xxx
```

See the [main README](../README.md) for complete setup instructions.
