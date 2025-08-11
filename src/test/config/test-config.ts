/**
 * Test configuration for different environments
 */

export interface TestConfig {
  database: {
    url: string
    schema: string
    testSchema: string
  }
  api: {
    baseUrl: string
    timeout: number
  }
  auth: {
    jwtSecret: string
    testUser: {
      email: string
      password: string
      organizationName: string
    }
  }
  performance: {
    qrScanTimeout: number
    databaseQueryTimeout: number
    apiResponseTimeout: number
  }
  e2e: {
    baseUrl: string
    headless: boolean
    slowMo: number
  }
}

const defaultConfig: TestConfig = {
  database: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/scan_ttendance_test',
    schema: 'public',
    testSchema: 'test_org'
  },
  api: {
    baseUrl: process.env.TEST_API_URL || 'http://localhost:3000',
    timeout: 5000
  },
  auth: {
    jwtSecret: process.env.TEST_JWT_SECRET || 'test-jwt-secret-key',
    testUser: {
      email: 'test@example.com',
      password: 'TestPassword123!',
      organizationName: 'Test Organization'
    }
  },
  performance: {
    qrScanTimeout: 100,
    databaseQueryTimeout: 50,
    apiResponseTimeout: 1000
  },
  e2e: {
    baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',
    headless: process.env.CI === 'true',
    slowMo: process.env.CI === 'true' ? 0 : 100
  }
}

export const getTestConfig = (): TestConfig => {
  const environment = process.env.NODE_ENV || 'test'
  
  switch (environment) {
    case 'test':
      return defaultConfig
    
    case 'production':
      return {
        ...defaultConfig,
        database: {
          ...defaultConfig.database,
          url: process.env.DATABASE_URL || defaultConfig.database.url
        },
        e2e: {
          ...defaultConfig.e2e,
          headless: true,
          slowMo: 0
        },
        performance: {
          ...defaultConfig.performance,
          qrScanTimeout: 200, // More lenient in CI
          databaseQueryTimeout: 100,
          apiResponseTimeout: 2000
        }
      }
    
    case 'development':
      return {
        ...defaultConfig,
        e2e: {
          ...defaultConfig.e2e,
          headless: false,
          slowMo: 250
        }
      }
    
    default:
      return defaultConfig
  }
}

export const testConfig = getTestConfig()