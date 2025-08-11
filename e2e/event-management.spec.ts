import { test, expect } from '@playwright/test'

test.describe('Event Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated session
    await page.goto('/auth/signin')
    
    // Use test credentials (assuming test data exists)
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/)
  })

  test('should create new event successfully', async ({ page }) => {
    await page.click('text=Create New Event')
    await expect(page).toHaveURL(/\/events\/create/)
    
    const eventName = `Test Event ${Date.now()}`
    await page.fill('input[name="eventName"]', eventName)
    await page.fill('textarea[name="description"]', 'Test event description')
    
    // Add manual attendee
    await page.click('text=Add Attendee')
    await page.fill('input[name="attendeeName"]', 'John Doe')
    await page.fill('input[name="attendeeId"]', 'ID001')
    
    await page.click('button[type="submit"]')
    
    // Should redirect to event dashboard
    await expect(page).toHaveURL(/\/events\/[^\/]+$/)
    await expect(page.locator('h1')).toContainText(eventName)
  })

  test('should import attendees via CSV', async ({ page }) => {
    await page.click('text=Create New Event')
    
    const eventName = `CSV Test Event ${Date.now()}`
    await page.fill('input[name="eventName"]', eventName)
    
    // Switch to CSV import
    await page.click('text=Import CSV')
    
    // Create test CSV content
    const csvContent = 'name,id\nJohn Doe,ID001\nJane Smith,ID002'
    
    // Upload CSV file (simulate file upload)
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'attendees.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    })
    
    await page.click('button[type="submit"]')
    
    // Should show import success and redirect
    await expect(page).toHaveURL(/\/events\/[^\/]+$/)
    await expect(page.locator('text=2 attendees imported')).toBeVisible()
  })

  test('should display event statistics', async ({ page }) => {
    // Navigate to existing event (assuming one exists)
    await page.click('.event-card:first-child')
    
    // Check statistics panel
    await expect(page.locator('[data-testid="total-attendees"]')).toBeVisible()
    await expect(page.locator('[data-testid="verified-count"]')).toBeVisible()
    await expect(page.locator('[data-testid="attendance-rate"]')).toBeVisible()
  })

  test('should navigate to QR scanner', async ({ page }) => {
    await page.click('.event-card:first-child')
    await page.click('text=Scan QR Code')
    
    await expect(page).toHaveURL(/\/events\/[^\/]+\/scan/)
    await expect(page.locator('h1')).toContainText('QR Code Scanner')
  })

  test('should view attendance records', async ({ page }) => {
    await page.click('.event-card:first-child')
    await page.click('text=View Attendance')
    
    await expect(page).toHaveURL(/\/events\/[^\/]+\/verifications/)
    await expect(page.locator('h1')).toContainText('Attendance Records')
  })

  test('should archive event', async ({ page }) => {
    await page.click('.event-card:first-child')
    await page.click('text=Settings')
    
    await expect(page).toHaveURL(/\/events\/[^\/]+\/settings/)
    
    await page.click('text=Archive Event')
    await page.click('text=Confirm Archive')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    
    // Event should appear in archived section
    await page.click('text=Archived Events')
    await expect(page.locator('.archived-event-card')).toBeVisible()
  })
})