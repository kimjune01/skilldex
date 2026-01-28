import { describe, it, expect } from 'vitest'
import { createToken, verifyToken } from '../lib/jwt.js'

describe('JWT', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    isAdmin: false,
    onboardingStep: 0,
    accountTypeSelected: true,
    tier: 'free' as const,
    createdAt: Date.now(),
  }

  describe('createToken', () => {
    it('should create a valid JWT token', async () => {
      const token = await createToken(mockUser)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT has 3 parts
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const token = await createToken(mockUser)
      const payload = await verifyToken(token)

      expect(payload).not.toBeNull()
      expect(payload?.sub).toBe(mockUser.id)
      expect(payload?.email).toBe(mockUser.email)
      expect(payload?.name).toBe(mockUser.name)
      expect(payload?.isAdmin).toBe(mockUser.isAdmin)
    })

    it('should return null for invalid token', async () => {
      const payload = await verifyToken('invalid.token.here')
      expect(payload).toBeNull()
    })

    it('should return null for empty token', async () => {
      const payload = await verifyToken('')
      expect(payload).toBeNull()
    })

    it('should include admin flag for admin users', async () => {
      const adminUser = { ...mockUser, isAdmin: true }
      const token = await createToken(adminUser)
      const payload = await verifyToken(token)

      expect(payload?.isAdmin).toBe(true)
    })
  })
})
