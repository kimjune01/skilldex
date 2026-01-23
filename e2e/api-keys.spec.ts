import { test, expect } from '@playwright/test'

const TEST_EMAIL = 'admin@example.com'
const TEST_PASSWORD = 'changeme'

test.describe('Desktop Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page).toHaveURL(/\/(home|chat)/, { timeout: 10000 })
  })

  test('should display Desktop Chat page with auto-created key', async ({ page }) => {
    await page.goto('/desktop-chat')

    // Wait for loading to finish
    await page.waitForLoadState('networkidle')

    // Should show Desktop Chat heading (h1 element)
    await expect(page.locator('h1:has-text("Desktop Chat")')).toBeVisible({ timeout: 10000 })

    // Should show MCP Server Setup card (key is auto-created)
    await expect(page.getByText(/MCP Server Setup/i)).toBeVisible({ timeout: 10000 })
  })

  test('should show MCP configuration with API key', async ({ page }) => {
    await page.goto('/desktop-chat')

    // Wait for setup to complete
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/MCP Server Setup/i)).toBeVisible({ timeout: 10000 })

    // Should show the MCP config with API key (starts with sk_live_)
    await expect(page.getByText(/sk_live_[a-f0-9]+/).first()).toBeVisible({ timeout: 5000 })

    // Should show chat app options (use button role since these are collapsible triggers)
    await expect(page.getByRole('button', { name: /Claude Desktop/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /ChatGPT Desktop/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /ChatMCP/i })).toBeVisible()
  })

  test('should allow copying MCP configuration', async ({ page }) => {
    await page.goto('/desktop-chat')

    // Wait for setup to complete
    await expect(page.getByText(/MCP Server Setup/i)).toBeVisible({ timeout: 10000 })

    // Should have copy buttons
    const copyButtons = page.getByRole('button', { name: /copy/i })
    await expect(copyButtons.first()).toBeVisible()
  })

  test('should allow regenerating API key', async ({ page }) => {
    await page.goto('/desktop-chat')

    // Wait for setup to complete
    await expect(page.getByText(/MCP Server Setup/i)).toBeVisible({ timeout: 10000 })

    // Click regenerate key button
    await page.getByRole('button', { name: /regenerate key/i }).click()

    // Should show confirmation dialog
    await expect(page.getByText(/Regenerate API Key/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^Regenerate$/i })).toBeVisible()

    // Cancel the dialog
    await page.getByRole('button', { name: /cancel/i }).click()
  })
})
