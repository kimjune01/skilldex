import { test, expect } from '@playwright/test'

const TEST_EMAIL = 'admin@example.com'
const TEST_PASSWORD = 'changeme'

test.describe('Skills', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/', { timeout: 5000 })
  })

  test('should display skills list', async ({ page }) => {
    await page.goto('/skills')

    // Should show skills heading
    await expect(page.getByRole('heading', { name: /skills/i })).toBeVisible()

    // Should show at least one skill (from seed data)
    await expect(page.getByRole('link', { name: /linkedin profile lookup/i })).toBeVisible({ timeout: 5000 })
  })

  test('should filter skills by category', async ({ page }) => {
    await page.goto('/skills')

    // Wait for skills to load
    await expect(page.getByRole('link', { name: /linkedin profile lookup/i })).toBeVisible({ timeout: 5000 })

    // Click on a category filter if available
    const sourcingFilter = page.getByRole('button', { name: /sourcing/i })
    if (await sourcingFilter.isVisible()) {
      await sourcingFilter.click()
      // Should still show linkedin-lookup (sourcing category)
      await expect(page.getByRole('link', { name: /linkedin profile lookup/i })).toBeVisible()
    }
  })

  test('should navigate to skill detail page', async ({ page }) => {
    await page.goto('/skills')

    // Wait for skills to load
    await expect(page.getByRole('link', { name: /linkedin profile lookup/i })).toBeVisible({ timeout: 5000 })

    // Click on a skill
    await page.getByRole('link', { name: /linkedin profile lookup/i }).click()

    // Should show skill detail with download button
    await expect(page.getByRole('button', { name: /download/i })).toBeVisible({ timeout: 5000 })
  })

  test('should show skill details with download option', async ({ page }) => {
    await page.goto('/skills/linkedin-lookup')

    // Should show skill name
    await expect(page.getByRole('heading', { name: /linkedin profile lookup/i })).toBeVisible({ timeout: 5000 })

    // Should show download button
    await expect(page.getByRole('button', { name: /download/i })).toBeVisible()
  })

  test('should download skill file', async ({ page }) => {
    await page.goto('/skills/linkedin-lookup')

    // Wait for page to load
    await expect(page.getByRole('button', { name: /download/i })).toBeVisible({ timeout: 5000 })

    // Set up download listener
    const downloadPromise = page.waitForEvent('download')

    // Click download
    await page.getByRole('button', { name: /download/i }).click()

    // Verify download started
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('linkedin')
  })
})
