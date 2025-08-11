import { test, expect } from '@playwright/test'

test.describe('QR Code Scanning Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated session and navigate to event
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
    
    // Navigate to first event's scanner
    await page.click('.event-card:first-child')
    await page.click('text=Scan QR Code')
    await page.waitForURL(/\/events\/[^\/]+\/scan/)
  })

  test('should display QR scanner interface', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('QR Code Scanner')
    await expect(page.locator('[data-testid="camera-view"]')).toBeVisible()
    await expect(page.locator('text=Point camera at QR code')).toBeVisible()
  })

  test('should handle camera permission request', async ({ page }) => {
    // Grant camera permissions
    await page.context().grantPermissions(['camera'])
    
    // Camera should initialize
    await expect(page.locator('[data-testid="camera-active"]')).toBeVisible()
  })

  test('should show error for denied camera permission', async ({ page }) => {
    // Deny camera permissions
    await page.context().grantPermissions([])
    
    await expect(page.locator('text=Camera access denied')).toBeVisible()
    await expect(page.locator('text=Please enable camera access')).toBeVisible()
  })

  test('should simulate successful QR scan', async ({ page }) => {
    // Mock successful QR scan
    await page.evaluate(() => {
      // Simulate QR code detection
      window.dispatchEvent(new CustomEvent('qr-detected', {
        detail: { text: 'ID001' }
      }))
    })
    
    // Should show success feedback
    await expect(page.locator('text=Scan successful')).toBeVisible()
    await expect(page.locator('[data-testid="scan-result"]')).toContainText('ID001')
  })

  test('should handle invalid QR code', async ({ page }) => {
    // Mock invalid QR scan
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('qr-detected', {
        detail: { text: 'INVALID_ID' }
      }))
    })
    
    // Should show error feedback
    await expect(page.locator('text=Invalid QR code')).toBeVisible()
    await expect(page.locator('text=ID not found in attendee list')).toBeVisible()
  })

  test('should handle duplicate scan', async ({ page }) => {
    // Mock duplicate scan
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('qr-detected', {
        detail: { text: 'ID001' }
      }))
    })
    
    // Wait for first scan to complete
    await expect(page.locator('text=Scan successful')).toBeVisible()
    
    // Scan same ID again
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('qr-detected', {
        detail: { text: 'ID001' }
      }))
    })
    
    // Should show duplicate warning
    await expect(page.locator('text=Already scanned')).toBeVisible()
  })

  test('should display scan history', async ({ page }) => {
    // Navigate to scan history
    await page.click('text=View History')
    
    await expect(page.locator('[data-testid="scan-history"]')).toBeVisible()
    await expect(page.locator('.scan-entry')).toHaveCount.greaterThan(0)
  })

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Interface should be mobile-optimized
    await expect(page.locator('[data-testid="mobile-scanner"]')).toBeVisible()
    await expect(page.locator('[data-testid="camera-view"]')).toHaveCSS('width', '100%')
  })
})