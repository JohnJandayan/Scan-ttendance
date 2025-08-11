import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Scan-ttendance/)
    await expect(page.locator('h1')).toContainText('Scan-ttendance')
    await expect(page.locator('text=Get Started')).toBeVisible()
  })

  test('should navigate to sign up page', async ({ page }) => {
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/\/auth\/signup/)
    await expect(page.locator('h1')).toContainText('Create Organization Account')
  })

  test('should show validation errors for invalid sign up', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Name is required')).toBeVisible()
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Organization name is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should successfully sign up new organization', async ({ page }) => {
    await page.goto('/auth/signup')
    
    const timestamp = Date.now()
    const testOrg = `TestOrg${timestamp}`
    const testEmail = `test${timestamp}@example.com`
    
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="organizationName"]', testOrg)
    await page.fill('input[name="password"]', 'TestPassword123!')
    
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard after successful signup
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('h1')).toContainText('Organization Dashboard')
  })

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.click('text=Already have an account? Sign in')
    await expect(page).toHaveURL(/\/auth\/signin/)
    await expect(page.locator('h1')).toContainText('Sign In')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })
})