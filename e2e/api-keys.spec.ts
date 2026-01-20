import { test, expect } from '@playwright/test'

const TEST_EMAIL = 'admin@example.com'
const TEST_PASSWORD = 'changeme'

test.describe('API Keys', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/', { timeout: 10000 })
  })

  test('should display API keys page', async ({ page }) => {
    await page.goto('/keys')

    // Wait for loading to finish
    await page.waitForLoadState('networkidle')

    // Should show API keys heading (h1 element)
    await expect(page.locator('h1:has-text("API Keys")')).toBeVisible({ timeout: 10000 })

    // Should show generate button
    await expect(page.getByRole('button', { name: /generate key/i })).toBeVisible()
  })

  test('should generate a new API key', async ({ page }) => {
    await page.goto('/keys')

    // Fill in key name
    await page.getByPlaceholder(/key name/i).fill('Test Key')

    // Click generate button
    await page.getByRole('button', { name: /generate key/i }).click()

    // Should show the new API key (starts with sk_live_)
    await expect(page.getByText(/sk_live_[a-f0-9]+/).first()).toBeVisible({ timeout: 5000 })
  })

  test('should show existing API keys after refresh', async ({ page }) => {
    // Generate a unique key name
    const keyName = `ExistKey-${Date.now()}`

    await page.goto('/keys')
    await page.getByPlaceholder(/key name/i).fill(keyName)
    await page.getByRole('button', { name: /generate key/i }).click()

    // Wait for key to be created
    await expect(page.getByText(/sk_live_[a-f0-9]+/).first()).toBeVisible({ timeout: 5000 })

    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should still show the key by name
    await expect(page.getByText(keyName)).toBeVisible({ timeout: 5000 })
  })

  test('should revoke an API key', async ({ page }) => {
    // First generate a key with unique name
    const keyName = `RevokeKey-${Date.now()}`
    await page.goto('/keys')
    await page.getByPlaceholder(/key name/i).fill(keyName)
    await page.getByRole('button', { name: /generate key/i }).click()

    await expect(page.getByText(/sk_live_[a-f0-9]+/).first()).toBeVisible({ timeout: 5000 })

    // Dismiss the created key alert
    await page.getByRole('button', { name: /dismiss/i }).click()

    // Verify the key exists in the list - use the more specific key item selector
    const keyItem = page.locator('div.flex.items-center.justify-between.p-4', { hasText: keyName })
    await expect(keyItem).toBeVisible({ timeout: 5000 })

    // Click the revoke button in this specific key's card
    await keyItem.getByRole('button', { name: /revoke/i }).click()

    // Confirm in dialog
    await page.getByRole('button', { name: /revoke key/i }).click()

    // Wait for the specific key to disappear
    await expect(page.getByText(keyName)).not.toBeVisible({ timeout: 5000 })
  })
})
