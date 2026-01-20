import { describe, it, expect } from 'vitest'
import { parse as parseYaml } from 'yaml'

// Replicate the frontmatter parser logic for testing
function parseFrontmatter(content: string): { intent: string; capabilities: string[] } {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) {
    return { intent: '', capabilities: [] }
  }
  try {
    const yaml = parseYaml(match[1])
    return {
      intent: yaml.intent || '',
      capabilities: Array.isArray(yaml.capabilities) ? yaml.capabilities : [],
    }
  } catch {
    return { intent: '', capabilities: [] }
  }
}

describe('Frontmatter Parser', () => {
  describe('parseFrontmatter', () => {
    it('should parse intent from frontmatter', () => {
      const content = `---
name: test-skill
intent: I want to do something
capabilities:
  - Capability 1
  - Capability 2
---

# Test Skill

Content here...`

      const result = parseFrontmatter(content)
      expect(result.intent).toBe('I want to do something')
    })

    it('should parse capabilities array', () => {
      const content = `---
name: test-skill
intent: I want to do something
capabilities:
  - Search for items
  - Filter results
  - Export data
---

# Test`

      const result = parseFrontmatter(content)
      expect(result.capabilities).toHaveLength(3)
      expect(result.capabilities).toContain('Search for items')
      expect(result.capabilities).toContain('Filter results')
      expect(result.capabilities).toContain('Export data')
    })

    it('should return empty values for missing frontmatter', () => {
      const content = `# Test Skill

No frontmatter here.`

      const result = parseFrontmatter(content)
      expect(result.intent).toBe('')
      expect(result.capabilities).toEqual([])
    })

    it('should return empty values for missing intent/capabilities', () => {
      const content = `---
name: test-skill
description: Just a description
---

# Test`

      const result = parseFrontmatter(content)
      expect(result.intent).toBe('')
      expect(result.capabilities).toEqual([])
    })

    it('should handle malformed YAML gracefully', () => {
      const content = `---
name: test-skill
intent: [invalid yaml
---

# Test`

      const result = parseFrontmatter(content)
      expect(result.intent).toBe('')
      expect(result.capabilities).toEqual([])
    })

    it('should handle real SKILL.md format', () => {
      const content = `---
name: linkedin-lookup
description: Find candidate profiles on LinkedIn
intent: I want to find candidates on LinkedIn for this job
capabilities:
  - Search for candidate profiles
  - Extract profile information
allowed-tools:
  - Skill
  - Read
  - Bash
---

# LinkedIn Candidate Search

You are a recruiting assistant...`

      const result = parseFrontmatter(content)
      expect(result.intent).toBe('I want to find candidates on LinkedIn for this job')
      expect(result.capabilities).toHaveLength(2)
    })

    it('should handle single capability', () => {
      const content = `---
name: simple-skill
intent: I want to do one thing
capabilities:
  - Just one capability
---`

      const result = parseFrontmatter(content)
      expect(result.capabilities).toHaveLength(1)
      expect(result.capabilities[0]).toBe('Just one capability')
    })

    it('should handle capabilities as non-array gracefully', () => {
      const content = `---
name: test-skill
intent: Test intent
capabilities: "not an array"
---`

      const result = parseFrontmatter(content)
      expect(result.capabilities).toEqual([])
    })
  })
})
