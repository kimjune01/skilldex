import { describe, it, expect } from 'vitest'

describe('Analytics', () => {
  describe('usage stats calculation', () => {
    it('should calculate success rate correctly', () => {
      const totalExecutions = 100
      const successCount = 85

      const successRate = totalExecutions > 0
        ? (successCount / totalExecutions * 100).toFixed(1)
        : '0'

      expect(successRate).toBe('85.0')
    })

    it('should handle zero executions', () => {
      const totalExecutions = 0
      const successCount = 0

      const successRate = totalExecutions > 0
        ? (successCount / totalExecutions * 100).toFixed(1)
        : '0'

      expect(successRate).toBe('0')
    })

    it('should calculate average duration', () => {
      const durations = [100, 200, 300, 400]
      const avgDurationMs = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0

      expect(avgDurationMs).toBe(250)
    })

    it('should handle empty durations', () => {
      const durations: number[] = []
      const avgDurationMs = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0

      expect(avgDurationMs).toBe(0)
    })
  })

  describe('usage aggregation', () => {
    it('should group usage by skill', () => {
      const logs = [
        { skillId: 'skill-1', status: 'success' },
        { skillId: 'skill-1', status: 'success' },
        { skillId: 'skill-2', status: 'success' },
        { skillId: 'skill-1', status: 'error' },
      ]

      const bySkillMap = new Map<string, number>()
      for (const log of logs) {
        bySkillMap.set(log.skillId, (bySkillMap.get(log.skillId) || 0) + 1)
      }

      expect(bySkillMap.get('skill-1')).toBe(3)
      expect(bySkillMap.get('skill-2')).toBe(1)
    })

    it('should group usage by date', () => {
      const logs = [
        { createdAt: new Date('2024-01-15') },
        { createdAt: new Date('2024-01-15') },
        { createdAt: new Date('2024-01-16') },
      ]

      const dailyMap = new Map<string, number>()
      for (const log of logs) {
        const date = log.createdAt.toISOString().split('T')[0]
        dailyMap.set(date, (dailyMap.get(date) || 0) + 1)
      }

      expect(dailyMap.get('2024-01-15')).toBe(2)
      expect(dailyMap.get('2024-01-16')).toBe(1)
    })

    it('should count unique users', () => {
      const logs = [
        { userId: 'user-1' },
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
        { userId: 'user-2' },
      ]

      const uniqueUsers = new Set(logs.map(l => l.userId)).size
      expect(uniqueUsers).toBe(3)
    })
  })

  describe('admin vs user analytics', () => {
    it('should filter logs by user for non-admin', () => {
      const allLogs = [
        { userId: 'user-1', skillId: 's1' },
        { userId: 'user-2', skillId: 's1' },
        { userId: 'user-1', skillId: 's2' },
      ]

      const currentUserId = 'user-1'
      const userLogs = allLogs.filter(l => l.userId === currentUserId)

      expect(userLogs).toHaveLength(2)
    })

    it('should return all logs for admin', () => {
      const allLogs = [
        { userId: 'user-1', skillId: 's1' },
        { userId: 'user-2', skillId: 's1' },
        { userId: 'user-1', skillId: 's2' },
      ]

      const isAdmin = true
      const logs = isAdmin ? allLogs : allLogs.filter(() => false)

      expect(logs).toHaveLength(3)
    })
  })

  describe('date filtering', () => {
    it('should filter logs by date range', () => {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      const logs = [
        { createdAt: now },
        { createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
        { createdAt: sixtyDaysAgo },
      ]

      const filteredLogs = logs.filter(l => l.createdAt >= thirtyDaysAgo)
      expect(filteredLogs).toHaveLength(2)
    })
  })
})
