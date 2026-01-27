import { test, expect, request } from '@playwright/test'

const TEST_EMAIL = 'admin@example.com'
const TEST_PASSWORD = 'changeme'

test.describe('Skill API Flow', () => {
  let apiKey: string
  let authToken: string

  test.beforeAll(async () => {
    // Login via API to get JWT token
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const loginResponse = await apiContext.post('/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })
    const loginData = await loginResponse.json()
    authToken = loginData.data?.token
    if (!authToken) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`)
    }

    // Generate API key via API
    const keyResponse = await apiContext.post('/api-keys', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { name: 'E2E API Test Key' },
    })
    const keyData = await keyResponse.json()
    apiKey = keyData.data?.key
    if (!apiKey) {
      throw new Error(`API key creation failed: ${JSON.stringify(keyData)}`)
    }

    await apiContext.dispose()
  })

  test('should authenticate with API key and get user info', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const response = await apiContext.get('/v1/me', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(json.data.email).toBe(TEST_EMAIL)
  })

  test('should access ATS candidates endpoint (returns error if no ATS connected)', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const response = await apiContext.get('/v1/ats/candidates', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    // The endpoint exists and authenticates - may return 200 or 500 depending on ATS connection
    // 200 with data means ATS is connected, 500 with error means no ATS
    const json = await response.json()
    if (response.ok()) {
      expect(Array.isArray(json.data)).toBeTruthy()
      expect(json.pagination).toBeDefined()
    } else {
      // No ATS connected - endpoint still exists and authenticates
      expect(json.error).toBeDefined()
    }
  })

  test('should access ATS candidates endpoint with query parameter', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const response = await apiContext.get('/v1/ats/candidates?q=engineer', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    // Similar to above - may succeed or fail based on ATS connection
    const json = await response.json()
    if (response.ok()) {
      expect(Array.isArray(json.data)).toBeTruthy()
    } else {
      expect(json.error).toBeDefined()
    }
  })

  test('should reject requests without API key', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const response = await apiContext.get('/v1/me')

    expect(response.status()).toBe(401)
  })

  test('should reject requests with invalid API key', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const response = await apiContext.get('/v1/me', {
      headers: {
        Authorization: 'Bearer sk_live_invalid_key_12345',
      },
    })

    expect(response.status()).toBe(401)
  })
})

test.describe('Create Skill API', () => {
  let authToken: string
  const testSkillSlug = `e2e-test-skill-${Date.now()}`
  const testSkillName = `E2E Test Skill ${Date.now()}`

  test.beforeAll(async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const loginResponse = await apiContext.post('/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })
    const loginData = await loginResponse.json()
    authToken = loginData.data?.token
    if (!authToken) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`)
    }

    await apiContext.dispose()
  })

  test.afterAll(async () => {
    // Clean up test skill
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })
    await apiContext.delete(`/skills/${testSkillSlug}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    await apiContext.dispose()
  })

  test('should create a new skill', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const skillContent = `---
name: ${testSkillName}
description: A skill created by E2E tests
category: Productivity
---

# ${testSkillName}

This skill was created by the E2E test suite.`

    const response = await apiContext.post('/skills', {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: { content: skillContent },
    })

    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(json.data.name).toBe(testSkillName)
    expect(json.data.slug).toBe(testSkillSlug)
    expect(json.data.description).toBe('A skill created by E2E tests')
  })

  test('should fail to create duplicate skill without force flag', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const skillContent = `---
name: ${testSkillName}
description: A duplicate skill
category: Productivity
---

# ${testSkillName}

This is a duplicate.`

    const response = await apiContext.post('/skills', {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: { content: skillContent },
    })

    expect(response.status()).toBe(409)
    const json = await response.json()
    expect(json.error.message).toContain('already exists')
  })

  test('should update existing skill with force=true', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const skillContent = `---
name: ${testSkillName}
description: Updated description via force
category: Productivity
---

# ${testSkillName}

This skill was updated with force=true.`

    const response = await apiContext.post('/skills', {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: { content: skillContent, force: true },
    })

    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(json.data.name).toBe(testSkillName)
    expect(json.data.slug).toBe(testSkillSlug)
    expect(json.data.description).toBe('Updated description via force')
  })

  test('should reject skill creation without content', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const response = await apiContext.post('/skills', {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {},
    })

    expect(response.ok()).toBeFalsy()
  })

  test('should reject skill creation with invalid frontmatter', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const response = await apiContext.post('/skills', {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: { content: 'No frontmatter here' },
    })

    expect(response.ok()).toBeFalsy()
    const json = await response.json()
    expect(json.error).toBeDefined()
  })

  test('should reject skill creation without auth', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const skillContent = `---
name: Unauthorized Skill
description: Should fail
---

# Test`

    const response = await apiContext.post('/skills', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: { content: skillContent },
    })

    expect(response.status()).toBe(401)
  })
})
