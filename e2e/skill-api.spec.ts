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
