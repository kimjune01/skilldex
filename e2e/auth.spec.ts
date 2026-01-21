import { test, expect } from '@playwright/test'

// Default seed credentials
const TEST_EMAIL = 'admin@example.com'
const TEST_PASSWORD = 'changeme'

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /skillomatic/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show error message
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 5000 })
  })

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/', { timeout: 5000 })

    // Should show dashboard content
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL('/', { timeout: 5000 })

    // Find and click logout
    await page.getByRole('button', { name: /logout|sign out/i }).click()

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/skills')

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })
})
