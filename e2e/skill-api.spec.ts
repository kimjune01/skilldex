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

    const loginResponse = await apiContext.post('/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })
    const loginData = await loginResponse.json()
    authToken = loginData.data.token

    // Generate API key via API
    const keyResponse = await apiContext.post('/api/api-keys', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { name: 'E2E API Test Key' },
    })
    const keyData = await keyResponse.json()
    apiKey = keyData.data.key

    await apiContext.dispose()
  })

  test('should authenticate with API key and get user info', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const response = await apiContext.get('/api/v1/me', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(json.data.email).toBe(TEST_EMAIL)
  })

  test('should search ATS candidates with API key', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const response = await apiContext.get('/api/v1/ats/candidates', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(Array.isArray(json.data)).toBeTruthy()
    expect(json.pagination).toBeDefined()
  })

  test('should search ATS candidates with query parameter', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const response = await apiContext.get('/api/v1/ats/candidates?q=engineer', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(Array.isArray(json.data)).toBeTruthy()
  })

  test('should reject requests without API key', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const response = await apiContext.get('/api/v1/me')

    expect(response.status()).toBe(401)
  })

  test('should reject requests with invalid API key', async () => {
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    })

    const response = await apiContext.get('/api/v1/me', {
      headers: {
        Authorization: 'Bearer sk_live_invalid_key_12345',
      },
    })

    expect(response.status()).toBe(401)
  })
})
