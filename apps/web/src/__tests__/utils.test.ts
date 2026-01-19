import { describe, it, expect } from 'vitest'
import { cn, getCategoryBadgeVariant } from '../lib/utils'

describe('cn', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'included', false && 'excluded')
    expect(result).toBe('base included')
  })

  it('should merge tailwind classes correctly', () => {
    const result = cn('p-4', 'p-2')
    expect(result).toBe('p-2')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })
})

describe('getCategoryBadgeVariant', () => {
  it('should return valid category as-is', () => {
    expect(getCategoryBadgeVariant('sourcing')).toBe('sourcing')
    expect(getCategoryBadgeVariant('ats')).toBe('ats')
    expect(getCategoryBadgeVariant('communication')).toBe('communication')
    expect(getCategoryBadgeVariant('scheduling')).toBe('scheduling')
    expect(getCategoryBadgeVariant('productivity')).toBe('productivity')
    expect(getCategoryBadgeVariant('system')).toBe('system')
  })

  it('should return secondary for invalid category', () => {
    expect(getCategoryBadgeVariant('invalid')).toBe('secondary')
    expect(getCategoryBadgeVariant('')).toBe('secondary')
    expect(getCategoryBadgeVariant('unknown')).toBe('secondary')
  })
})
