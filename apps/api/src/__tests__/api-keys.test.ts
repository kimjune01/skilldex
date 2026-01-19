import { describe, it, expect } from 'vitest'
import { generateApiKey, extractApiKey } from '../lib/api-keys.js'

describe('generateApiKey', () => {
  it('should generate a key with correct prefix', () => {
    const key = generateApiKey()
    expect(key.startsWith('sk_live_')).toBe(true)
  })

  it('should generate a key with correct length', () => {
    const key = generateApiKey()
    // sk_live_ (8 chars) + 64 hex chars = 72 total
    expect(key.length).toBe(72)
  })

  it('should generate unique keys', () => {
    const key1 = generateApiKey()
    const key2 = generateApiKey()
    expect(key1).not.toBe(key2)
  })
})

describe('extractApiKey', () => {
  it('should extract key from Bearer token', () => {
    const key = 'sk_live_abc123'
    const result = extractApiKey(`Bearer ${key}`)
    expect(result).toBe(key)
  })

  it('should extract raw API key', () => {
    const key = 'sk_live_abc123'
    const result = extractApiKey(key)
    expect(result).toBe(key)
  })

  it('should return null for undefined header', () => {
    const result = extractApiKey(undefined)
    expect(result).toBeNull()
  })

  it('should return null for invalid header', () => {
    const result = extractApiKey('invalid_key_format')
    expect(result).toBeNull()
  })

  it('should return null for empty string', () => {
    const result = extractApiKey('')
    expect(result).toBeNull()
  })
})
