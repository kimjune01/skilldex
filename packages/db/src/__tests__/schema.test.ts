import { describe, it, expect } from 'vitest'
import {
  users,
  apiKeys,
  skills,
  integrations,
  roles,
  permissions,
  skillUsageLogs,
  skillProposals
} from '../schema.js'

describe('Schema Definitions', () => {
  describe('users table', () => {
    it('should have required columns', () => {
      const columns = Object.keys(users)
      expect(columns).toContain('id')
      expect(columns).toContain('email')
      expect(columns).toContain('passwordHash')
      expect(columns).toContain('name')
      expect(columns).toContain('isAdmin')
      expect(columns).toContain('createdAt')
    })
  })

  describe('apiKeys table', () => {
    it('should have required columns', () => {
      const columns = Object.keys(apiKeys)
      expect(columns).toContain('id')
      expect(columns).toContain('userId')
      expect(columns).toContain('key')
      expect(columns).toContain('name')
      expect(columns).toContain('lastUsedAt')
      expect(columns).toContain('revokedAt')
    })
  })

  describe('skills table', () => {
    it('should have required columns', () => {
      const columns = Object.keys(skills)
      expect(columns).toContain('id')
      expect(columns).toContain('slug')
      expect(columns).toContain('name')
      expect(columns).toContain('description')
      expect(columns).toContain('category')
      expect(columns).toContain('isEnabled')
    })
  })

  describe('integrations table', () => {
    it('should have required columns', () => {
      const columns = Object.keys(integrations)
      expect(columns).toContain('id')
      expect(columns).toContain('provider')
      expect(columns).toContain('userId')
      expect(columns).toContain('status')
    })
  })

  describe('roles table', () => {
    it('should have required columns', () => {
      const columns = Object.keys(roles)
      expect(columns).toContain('id')
      expect(columns).toContain('name')
      expect(columns).toContain('description')
    })
  })

  describe('permissions table', () => {
    it('should have required columns', () => {
      const columns = Object.keys(permissions)
      expect(columns).toContain('id')
      expect(columns).toContain('name')
      expect(columns).toContain('resource')
      expect(columns).toContain('action')
    })
  })

  describe('skillUsageLogs table', () => {
    it('should have required columns', () => {
      const columns = Object.keys(skillUsageLogs)
      expect(columns).toContain('id')
      expect(columns).toContain('skillId')
      expect(columns).toContain('userId')
      expect(columns).toContain('status')
    })
  })

  describe('skillProposals table', () => {
    it('should have required columns', () => {
      const columns = Object.keys(skillProposals)
      expect(columns).toContain('id')
      expect(columns).toContain('userId')
      expect(columns).toContain('title')
      expect(columns).toContain('description')
      expect(columns).toContain('status')
    })
  })
})
