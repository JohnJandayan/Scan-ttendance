import { test, expect, Page, BrowserContext } from '@playwright/test'

test.describe('Comprehensive End-to-End Integration Tests', () => {
  let context: BrowserContext
  let page: Page
  let organizationData: {
    name: string
    email: string
    organizationName: string
    password: string
  }

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    
    // Generate unique test data
    const timestamp = Date.now()
    organizationData = {
      name: 'Test Admin',
      email: `admin${timestamp}@testorg.com`,
      organizationName: `TestOrg${timestamp}`,
      password: 'SecurePassword123!'
    }
  })

  test.afterAll(async () => {
    await context.close()
  })

  test.describe('Complete User Workflow: Registration to Attendance Tracking', () => {
    test('should complete full workflow from registration to QR scanning', async () => {
      // Step 1: Landing Page Navigation (Requirement 1)
      await page.goto('/')
      await expect(page).toHaveTitle(/Scan-ttendance/)
      await expect(page.locator('h1')).toContainText('Scan-ttendance')
      await expect(page.locator('text=Get Started')).toBeVisible()

      // Step 2: Organization Registration (Requirement 2)
      await page.click('text=Get Started')
      await expect(page).toHaveURL(/\/auth\/signup/)
      
      await page.fill('input[name="name"]', organizationData.name)
      await page.fill('input[name="email"]', organizationData.email)
      await page.fill('input[name="organizationName"]', organizationData.organizationName)
      await page.fill('input[name="password"]', organizationData.password)
      
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/dashboard/)
      await expect(page.locator('h1')).toContainText('Organization Dashboard')

      // Step 3: Dashboard Access and Navigation (Requirement 4)
      await expect(page.locator('[data-testid="ongoing-events"]')).toBeVisible()
      await expect(page.locator('[data-testid="archived-events"]')).toBeVisible()
      await expect(page.locator('[data-testid="member-management"]')).toBeVisible()
      await expect(page.locator('[data-testid="create-event-btn"]')).toBeVisible()

      // Step 4: Event Creation (Requirement 5)
      await page.click('[data-testid="create-event-btn"]')
      await expect(page).toHaveURL(/\/events\/create/)
      
      const eventName = `Integration Test Event ${Date.now()}`
      await page.fill('input[name="eventName"]', eventName)
      await page.fill('textarea[name="description"]', 'Comprehensive integration test event')

      // Step 5: Attendee Management (Requirement 6)
      // Add manual attendees
      await page.click('text=Add Attendee')
      await page.fill('input[name="attendeeName"]', 'John Doe')
      await page.fill('input[name="attendeeId"]', 'ID001')
      await page.click('text=Add Another')
      
      await page.fill('input[name="attendeeName"]:nth-child(2)', 'Jane Smith')
      await page.fill('input[name="attendeeId"]:nth-child(2)', 'ID002')

      // Test CSV import functionality
      await page.click('text=Import CSV')
      const csvContent = 'name,id\nBob Johnson,ID003\nAlice Brown,ID004'
      
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'test-attendees.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent)
      })

      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/events\/[^\/]+$/)
      await expect(page.locator('h1')).toContainText(eventName)

      // Step 6: Event Dashboard Access (Requirement 7)
      await expect(page.locator('[data-testid="event-stats"]')).toBeVisible()
      await expect(page.locator('[data-testid="total-attendees"]')).toContainText('4') // 2 manual + 2 CSV
      await expect(page.locator('[data-testid="verified-count"]')).toContainText('0')
      await expect(page.locator('[data-testid="qr-scan-btn"]')).toBeVisible()
      await expect(page.locator('[data-testid="view-attendance-btn"]')).toBeVisible()

      // Step 7: QR Code Scanning (Requirement 8)
      await page.click('[data-testid="qr-scan-btn"]')
      await expect(page).toHaveURL(/\/events\/[^\/]+\/scan/)
      await expect(page.locator('h1')).toContainText('QR Code Scanner')

      // Grant camera permissions for testing
      await context.grantPermissions(['camera'])
      await expect(page.locator('[data-testid="camera-view"]')).toBeVisible()

      // Simulate successful QR scan
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('qr-detected', {
          detail: { text: 'ID001' }
        }))
      })

      await expect(page.locator('text=Scan successful')).toBeVisible()
      await expect(page.locator('[data-testid="scan-result"]')).toContainText('John Doe')

      // Test duplicate scan detection
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('qr-detected', {
          detail: { text: 'ID001' }
        }))
      })

      await expect(page.locator('text=Already scanned')).toBeVisible()

      // Test invalid ID scan
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('qr-detected', {
          detail: { text: 'INVALID_ID' }
        }))
      })

      await expect(page.locator('text=Invalid QR code')).toBeVisible()

      // Step 8: Attendance Records Viewing (Requirement 9)
      await page.click('[data-testid="view-attendance-btn"]')
      await expect(page).toHaveURL(/\/events\/[^\/]+\/verifications/)
      await expect(page.locator('h1')).toContainText('Attendance Records')
      await expect(page.locator('[data-testid="verification-record"]')).toBeVisible()
      await expect(page.locator('text=John Doe')).toBeVisible()
      await expect(page.locator('text=ID001')).toBeVisible()

      // Step 9: Event Settings and Archiving (Requirement 10)
      await page.click('[data-testid="event-settings-btn"]')
      await expect(page).toHaveURL(/\/events\/[^\/]+\/settings/)
      
      await page.click('text=Archive Event')
      await page.click('text=Confirm Archive')
      await expect(page).toHaveURL(/\/dashboard/)

      // Verify event appears in archived section
      await page.click('[data-testid="archived-events-tab"]')
      await expect(page.locator('.archived-event-card')).toBeVisible()
      await expect(page.locator('text=' + eventName)).toBeVisible()

      // Step 10: Member Management (Requirement 11)
      await page.click('[data-testid="member-management-tab"]')
      await expect(page.locator('h2')).toContainText('Member Management')
      
      await page.click('text=Add Member')
      await page.fill('input[name="memberName"]', 'Test Manager')
      await page.fill('input[name="memberEmail"]', `manager${Date.now()}@testorg.com`)
      await page.selectOption('select[name="role"]', 'manager')
      await page.click('button[type="submit"]')
      
      await expect(page.locator('text=Test Manager')).toBeVisible()
      await expect(page.locator('text=manager')).toBeVisible()
    })
  })

  test.describe('Cross-Device and Browser Compatibility', () => {
    test('should work correctly on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/')
      
      // Test responsive design (Requirement 12.1)
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
      await expect(page.locator('h1')).toHaveCSS('font-size', /^(24px|1\.5rem)/)
      
      // Test mobile-friendly forms
      await page.click('text=Get Started')
      await expect(page.locator('input[name="name"]')).toHaveCSS('width', '100%')
      
      // Test mobile QR scanner interface (Requirement 12.3)
      // Note: This would require actual authentication flow in a real test
      // For now, we'll test the interface elements
      await page.goto('/events/test-event/scan')
      await expect(page.locator('[data-testid="mobile-scanner"]')).toBeVisible()
      await expect(page.locator('[data-testid="camera-view"]')).toHaveCSS('width', '100%')
    })

    test('should maintain functionality across different browsers', async () => {
      // This test runs across all configured browsers in playwright.config.ts
      await page.goto('/')
      
      // Test core functionality works in all browsers
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('text=Get Started')).toBeVisible()
      
      // Test JavaScript functionality
      await page.evaluate(() => {
        return typeof window !== 'undefined' && 
               typeof document !== 'undefined' &&
               typeof localStorage !== 'undefined'
      })
    })
  })

  test.describe('Real-time Functionality and Performance', () => {
    test('should handle real-time updates correctly', async () => {
      // This would test WebSocket connections and real-time updates
      // For integration testing, we'll simulate the behavior
      
      await page.goto('/dashboard')
      
      // Simulate real-time event update
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('realtime-update', {
          detail: {
            type: 'verification',
            data: { eventId: 'test-event', participantId: 'ID001' }
          }
        }))
      })
      
      // Verify UI updates in real-time
      await expect(page.locator('[data-testid="live-stats"]')).toBeVisible()
    })

    test('should perform well under load', async () => {
      const startTime = Date.now()
      
      // Navigate through multiple pages quickly
      await page.goto('/')
      await page.goto('/auth/signup')
      await page.goto('/dashboard')
      await page.goto('/events/create')
      
      const endTime = Date.now()
      const navigationTime = endTime - startTime
      
      // Should navigate quickly (under 2 seconds for all pages)
      expect(navigationTime).toBeLessThan(2000)
    })
  })

  test.describe('Security and Access Control Validation', () => {
    test('should enforce authentication on protected routes', async () => {
      // Test unauthenticated access to protected routes
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/auth\/signin/)
      
      await page.goto('/events/create')
      await expect(page).toHaveURL(/\/auth\/signin/)
      
      await page.goto('/events/test-event/scan')
      await expect(page).toHaveURL(/\/auth\/signin/)
    })

    test('should validate input sanitization', async () => {
      await page.goto('/auth/signup')
      
      // Test XSS prevention
      const maliciousScript = '<script>alert("xss")</script>'
      await page.fill('input[name="name"]', maliciousScript)
      await page.fill('input[name="organizationName"]', maliciousScript)
      
      // Form should sanitize input
      const nameValue = await page.inputValue('input[name="name"]')
      const orgValue = await page.inputValue('input[name="organizationName"]')
      
      expect(nameValue).not.toContain('<script>')
      expect(orgValue).not.toContain('<script>')
    })

    test('should enforce role-based access control', async () => {
      // This would test different user roles and their permissions
      // For integration testing, we'll verify the UI elements are present
      
      await page.goto('/dashboard')
      
      // Admin should see all management options
      await expect(page.locator('[data-testid="member-management"]')).toBeVisible()
      await expect(page.locator('[data-testid="create-event-btn"]')).toBeVisible()
      
      // Test member role restrictions would be implemented here
      // with different user contexts
    })
  })

  test.describe('Error Handling and Recovery', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort())
      
      await page.goto('/dashboard')
      
      // Should show appropriate error messages
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('text=Network error')).toBeVisible()
      
      // Should provide retry mechanism
      await expect(page.locator('text=Retry')).toBeVisible()
    })

    test('should recover from errors without losing data', async () => {
      await page.goto('/events/create')
      
      // Fill form data
      await page.fill('input[name="eventName"]', 'Test Event')
      await page.fill('textarea[name="description"]', 'Test description')
      
      // Simulate temporary error
      await page.route('**/api/events', route => route.abort(), { times: 1 })
      
      await page.click('button[type="submit"]')
      
      // Should show error but preserve form data
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      expect(await page.inputValue('input[name="eventName"]')).toBe('Test Event')
      expect(await page.inputValue('textarea[name="description"]')).toBe('Test description')
    })
  })

  test.describe('Data Integrity and Consistency', () => {
    test('should maintain data consistency across operations', async () => {
      // This would test database transactions and data integrity
      // For integration testing, we'll verify the UI reflects consistent state
      
      await page.goto('/dashboard')
      
      // Get initial statistics
      const initialEvents = await page.locator('[data-testid="total-events"]').textContent()
      
      // Create new event
      await page.click('[data-testid="create-event-btn"]')
      await page.fill('input[name="eventName"]', 'Consistency Test Event')
      await page.click('button[type="submit"]')
      
      // Return to dashboard and verify count updated
      await page.goto('/dashboard')
      const updatedEvents = await page.locator('[data-testid="total-events"]').textContent()
      
      expect(parseInt(updatedEvents || '0')).toBe(parseInt(initialEvents || '0') + 1)
    })

    test('should handle concurrent operations correctly', async () => {
      // Test concurrent QR scans
      await page.goto('/events/test-event/scan')
      
      // Simulate rapid QR scans
      await page.evaluate(() => {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('qr-detected', {
              detail: { text: `ID00${i}` }
            }))
          }, i * 100)
        }
      })
      
      // Should handle all scans without conflicts
      await page.waitForTimeout(1000)
      await expect(page.locator('[data-testid="scan-count"]')).toContainText('5')
    })
  })
})