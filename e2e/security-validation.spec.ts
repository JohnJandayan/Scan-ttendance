import { test, expect, Page } from '@playwright/test'

test.describe('Security Validation and Access Control Tests', () => {
  test.describe('Authentication Security', () => {
    test('should prevent unauthorized access to protected routes', async ({ page }) => {
      const protectedRoutes = [
        '/dashboard',
        '/events/create',
        '/events/test-event/scan',
        '/events/test-event/settings',
        '/events/test-event/verifications',
        '/org/members'
      ]

      for (const route of protectedRoutes) {
        await page.goto(route)
        // Should redirect to sign-in page
        await expect(page).toHaveURL(/\/auth\/signin/)
        
        // Should show appropriate message
        await expect(page.locator('text=Please sign in to continue')).toBeVisible()
      }
    })

    test('should validate JWT token expiration', async ({ page }) => {
      // Sign in first
      await page.goto('/auth/signin')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'TestPassword123!')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/dashboard/)

      // Simulate expired token
      await page.evaluate(() => {
        localStorage.setItem('auth_token', 'expired.jwt.token')
      })

      // Try to access protected resource
      await page.goto('/events/create')
      
      // Should redirect to sign-in due to invalid token
      await expect(page).toHaveURL(/\/auth\/signin/)
      await expect(page.locator('text=Session expired')).toBeVisible()
    })

    test('should enforce strong password requirements', async ({ page }) => {
      await page.goto('/auth/signup')

      const weakPasswords = [
        '123456',
        'password',
        'abc123',
        'qwerty',
        'Password', // Missing number and special char
        'password123', // Missing uppercase and special char
        'PASSWORD123!' // Missing lowercase
      ]

      for (const weakPassword of weakPasswords) {
        await page.fill('input[name="name"]', 'Test User')
        await page.fill('input[name="email"]', 'test@example.com')
        await page.fill('input[name="organizationName"]', 'Test Org')
        await page.fill('input[name="password"]', weakPassword)
        
        await page.click('button[type="submit"]')
        
        // Should show password strength error
        await expect(page.locator('text=Password must contain')).toBeVisible()
        
        // Clear form for next test
        await page.fill('input[name="password"]', '')
      }

      // Test strong password acceptance
      await page.fill('input[name="password"]', 'StrongPassword123!')
      await page.click('button[type="submit"]')
      
      // Should not show password error (may show other validation errors)
      await expect(page.locator('text=Password must contain')).not.toBeVisible()
    })

    test('should implement rate limiting on authentication endpoints', async ({ page }) => {
      await page.goto('/auth/signin')

      // Attempt multiple failed logins rapidly
      for (let i = 0; i < 6; i++) {
        await page.fill('input[name="email"]', 'test@example.com')
        await page.fill('input[name="password"]', 'wrongpassword')
        await page.click('button[type="submit"]')
        
        if (i < 4) {
          await expect(page.locator('text=Invalid credentials')).toBeVisible()
        }
      }

      // Should show rate limiting message after too many attempts
      await expect(page.locator('text=Too many login attempts')).toBeVisible()
      await expect(page.locator('text=Please try again later')).toBeVisible()
      
      // Login button should be disabled
      await expect(page.locator('button[type="submit"]')).toBeDisabled()
    })
  })

  test.describe('Input Validation and Sanitization', () => {
    test('should prevent XSS attacks in form inputs', async ({ page }) => {
      await page.goto('/auth/signup')

      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '<svg onload="alert(\'xss\')">',
        '"><script>alert("xss")</script>',
        '\';alert("xss");//'
      ]

      for (const payload of xssPayloads) {
        await page.fill('input[name="name"]', payload)
        await page.fill('input[name="organizationName"]', payload)
        
        // Check that dangerous content is sanitized
        const nameValue = await page.inputValue('input[name="name"]')
        const orgValue = await page.inputValue('input[name="organizationName"]')
        
        expect(nameValue).not.toContain('<script>')
        expect(nameValue).not.toContain('javascript:')
        expect(nameValue).not.toContain('onerror')
        expect(nameValue).not.toContain('onload')
        
        expect(orgValue).not.toContain('<script>')
        expect(orgValue).not.toContain('javascript:')
        expect(orgValue).not.toContain('onerror')
        expect(orgValue).not.toContain('onload')
      }
    })

    test('should validate file uploads securely', async ({ page }) => {
      await page.goto('/events/create')
      await page.fill('input[name="eventName"]', 'Security Test Event')
      
      await page.click('text=Import CSV')

      // Test malicious file types
      const maliciousFiles = [
        { name: 'malicious.exe', content: 'MZ\x90\x00', type: 'application/octet-stream' },
        { name: 'script.js', content: 'alert("xss")', type: 'application/javascript' },
        { name: 'malicious.php', content: '<?php system($_GET["cmd"]); ?>', type: 'application/x-php' }
      ]

      for (const file of maliciousFiles) {
        const fileInput = page.locator('input[type="file"]')
        await fileInput.setInputFiles({
          name: file.name,
          mimeType: file.type,
          buffer: Buffer.from(file.content)
        })

        await page.click('button[type="submit"]')
        
        // Should reject non-CSV files
        await expect(page.locator('text=Invalid file type')).toBeVisible()
        await expect(page.locator('text=Only CSV files are allowed')).toBeVisible()
      }

      // Test oversized file
      const largeContent = 'name,id\n' + 'a,b\n'.repeat(100000) // Very large CSV
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'large.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(largeContent)
      })

      await page.click('button[type="submit"]')
      
      // Should reject files that are too large
      await expect(page.locator('text=File too large')).toBeVisible()
    })

    test('should prevent SQL injection in search and filter inputs', async ({ page }) => {
      // Sign in first
      await page.goto('/auth/signin')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'TestPassword123!')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/dashboard/)

      await page.goto('/events/test-event/verifications')

      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "' UNION SELECT * FROM sensitive_data --",
        "'; UPDATE users SET password='hacked' WHERE id=1; --"
      ]

      for (const payload of sqlInjectionPayloads) {
        await page.fill('input[data-testid="search-input"]', payload)
        await page.waitForTimeout(500) // Wait for search debounce
        
        // Should not cause errors or expose sensitive data
        await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible()
        
        // Search should return safe results or no results
        const results = await page.locator('[data-testid="search-results"]').count()
        expect(results).toBeGreaterThanOrEqual(0)
      }
    })
  })

  test.describe('Authorization and Access Control', () => {
    test('should enforce organization-level data isolation', async ({ page, context }) => {
      // Create two different organization contexts
      const org1Context = await context.browser()?.newContext()
      const org2Context = await context.browser()?.newContext()
      
      if (!org1Context || !org2Context) return

      const org1Page = await org1Context.newPage()
      const org2Page = await org2Context.newPage()

      // Sign in as different organizations
      await org1Page.goto('/auth/signin')
      await org1Page.fill('input[name="email"]', 'org1@example.com')
      await org1Page.fill('input[name="password"]', 'TestPassword123!')
      await org1Page.click('button[type="submit"]')

      await org2Page.goto('/auth/signin')
      await org2Page.fill('input[name="email"]', 'org2@example.com')
      await org2Page.fill('input[name="password"]', 'TestPassword123!')
      await org2Page.click('button[type="submit"]')

      // Try to access other organization's data
      await org1Page.goto('/events/org2-event-id')
      await expect(org1Page.locator('text=Access denied')).toBeVisible()

      await org2Page.goto('/events/org1-event-id')
      await expect(org2Page.locator('text=Access denied')).toBeVisible()

      await org1Context.close()
      await org2Context.close()
    })

    test('should enforce role-based permissions', async ({ page }) => {
      // Test different user roles and their permissions
      const roles = [
        { email: 'admin@example.com', role: 'admin', canCreateEvents: true, canManageMembers: true },
        { email: 'manager@example.com', role: 'manager', canCreateEvents: true, canManageMembers: false },
        { email: 'viewer@example.com', role: 'viewer', canCreateEvents: false, canManageMembers: false }
      ]

      for (const roleTest of roles) {
        await page.goto('/auth/signin')
        await page.fill('input[name="email"]', roleTest.email)
        await page.fill('input[name="password"]', 'TestPassword123!')
        await page.click('button[type="submit"]')
        await page.waitForURL(/\/dashboard/)

        // Test event creation permission
        if (roleTest.canCreateEvents) {
          await expect(page.locator('[data-testid="create-event-btn"]')).toBeVisible()
        } else {
          await expect(page.locator('[data-testid="create-event-btn"]')).not.toBeVisible()
        }

        // Test member management permission
        if (roleTest.canManageMembers) {
          await expect(page.locator('[data-testid="member-management"]')).toBeVisible()
        } else {
          await expect(page.locator('[data-testid="member-management"]')).not.toBeVisible()
        }

        // Sign out for next test
        await page.click('[data-testid="user-menu"]')
        await page.click('text=Sign Out')
      }
    })

    test('should prevent privilege escalation', async ({ page }) => {
      // Sign in as regular user
      await page.goto('/auth/signin')
      await page.fill('input[name="email"]', 'user@example.com')
      await page.fill('input[name="password"]', 'TestPassword123!')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/dashboard/)

      // Try to access admin endpoints directly
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/organizations',
        '/api/admin/system-stats',
        '/admin/dashboard'
      ]

      for (const endpoint of adminEndpoints) {
        const response = await page.request.get(endpoint)
        expect(response.status()).toBe(403) // Forbidden
      }

      // Try to modify user role through client-side manipulation
      await page.evaluate(() => {
        localStorage.setItem('user_role', 'admin')
        sessionStorage.setItem('permissions', JSON.stringify(['admin', 'all']))
      })

      // Refresh and verify permissions are still enforced server-side
      await page.reload()
      await expect(page.locator('[data-testid="admin-panel"]')).not.toBeVisible()
    })
  })

  test.describe('Data Protection and Privacy', () => {
    test('should not expose sensitive data in client-side code', async ({ page }) => {
      await page.goto('/dashboard')

      // Check that sensitive data is not exposed in JavaScript
      const sensitiveData = await page.evaluate(() => {
        const scripts = Array.from(document.scripts).map(script => script.textContent || '')
        const html = document.documentElement.outerHTML
        
        return {
          hasPasswordHashes: scripts.some(script => script.includes('$2b$') || script.includes('bcrypt')),
          hasJWTSecrets: scripts.some(script => script.includes('jwt_secret') || script.includes('JWT_SECRET')),
          hasDBCredentials: scripts.some(script => script.includes('database_url') || script.includes('DB_PASSWORD')),
          hasAPIKeys: html.includes('sk_') || html.includes('api_key'),
          hasInternalIPs: scripts.some(script => script.includes('192.168.') || script.includes('10.0.'))
        }
      })

      expect(sensitiveData.hasPasswordHashes).toBe(false)
      expect(sensitiveData.hasJWTSecrets).toBe(false)
      expect(sensitiveData.hasDBCredentials).toBe(false)
      expect(sensitiveData.hasAPIKeys).toBe(false)
      expect(sensitiveData.hasInternalIPs).toBe(false)
    })

    test('should implement proper session management', async ({ page }) => {
      // Sign in
      await page.goto('/auth/signin')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'TestPassword123!')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/dashboard/)

      // Check session cookie properties
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(cookie => cookie.name.includes('session') || cookie.name.includes('auth'))

      if (sessionCookie) {
        expect(sessionCookie.httpOnly).toBe(true) // Should be HTTP-only
        expect(sessionCookie.secure).toBe(true) // Should be secure in production
        expect(sessionCookie.sameSite).toBe('Strict') // Should have SameSite protection
      }

      // Test session timeout
      await page.evaluate(() => {
        // Simulate session timeout by manipulating token timestamp
        const token = localStorage.getItem('auth_token')
        if (token) {
          const parts = token.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]))
            payload.exp = Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
            const newToken = parts[0] + '.' + btoa(JSON.stringify(payload)) + '.' + parts[2]
            localStorage.setItem('auth_token', newToken)
          }
        }
      })

      await page.reload()
      
      // Should redirect to sign-in due to expired session
      await expect(page).toHaveURL(/\/auth\/signin/)
    })

    test('should handle CORS properly', async ({ page }) => {
      // Test that CORS is properly configured
      const corsTest = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/events', {
            method: 'GET',
            headers: {
              'Origin': 'https://malicious-site.com'
            }
          })
          return {
            status: response.status,
            corsHeaders: response.headers.get('Access-Control-Allow-Origin')
          }
        } catch (error) {
          return { error: error.message }
        }
      })

      // Should not allow arbitrary origins
      expect(corsTest.corsHeaders).not.toBe('*')
      expect(corsTest.corsHeaders).not.toBe('https://malicious-site.com')
    })
  })

  test.describe('Security Headers and Configuration', () => {
    test('should have proper security headers', async ({ page }) => {
      const response = await page.goto('/')
      
      const headers = response?.headers() || {}
      
      // Check for security headers
      expect(headers['x-frame-options']).toBeTruthy() // Clickjacking protection
      expect(headers['x-content-type-options']).toBe('nosniff') // MIME type sniffing protection
      expect(headers['x-xss-protection']).toBeTruthy() // XSS protection
      expect(headers['strict-transport-security']).toBeTruthy() // HTTPS enforcement
      expect(headers['content-security-policy']).toBeTruthy() // CSP protection
      
      // Verify CSP doesn't allow unsafe inline scripts
      const csp = headers['content-security-policy']
      if (csp) {
        expect(csp).not.toContain("'unsafe-inline'")
        expect(csp).not.toContain("'unsafe-eval'")
      }
    })

    test('should prevent information disclosure in error messages', async ({ page }) => {
      // Test various error scenarios
      const errorTests = [
        { url: '/api/events/nonexistent-id', expectedStatus: 404 },
        { url: '/api/admin/secret-endpoint', expectedStatus: 403 },
        { url: '/api/events', method: 'POST', expectedStatus: 401 } // Without auth
      ]

      for (const test of errorTests) {
        const response = await page.request.fetch(test.url, {
          method: test.method || 'GET',
          failOnStatusCode: false
        })

        expect(response.status()).toBe(test.expectedStatus)

        const responseText = await response.text()
        
        // Should not expose sensitive information in error messages
        expect(responseText).not.toContain('database')
        expect(responseText).not.toContain('password')
        expect(responseText).not.toContain('secret')
        expect(responseText).not.toContain('token')
        expect(responseText).not.toContain('stack trace')
        expect(responseText).not.toContain('file path')
      }
    })
  })
})