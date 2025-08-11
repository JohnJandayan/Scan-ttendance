# Test Suite Documentation

This directory contains the comprehensive test suite for the Scan-ttendance application. The test suite is designed to ensure quality, performance, and reliability across all application components.

## Test Structure

```
src/test/
├── components/          # React component tests
├── hooks/              # Custom hook tests
├── middleware/         # API middleware tests
├── integration/        # API integration tests
├── performance/        # Performance benchmarks
├── utils/              # Test utilities and helpers
├── config/             # Test configuration
└── setup.ts           # Global test setup
```

## Test Types

### 1. Unit Tests
- **Location**: `src/test/components/`, `src/test/hooks/`, individual test files
- **Purpose**: Test individual components, functions, and modules in isolation
- **Framework**: Vitest + React Testing Library
- **Command**: `npm run test:unit`

### 2. Integration Tests
- **Location**: `src/test/integration/`
- **Purpose**: Test API endpoints and service interactions
- **Framework**: Vitest + Supertest
- **Command**: `npm run test:integration`

### 3. End-to-End Tests
- **Location**: `e2e/`
- **Purpose**: Test complete user workflows across the application
- **Framework**: Playwright
- **Command**: `npm run test:e2e`

### 4. Performance Tests
- **Location**: `src/test/performance/`
- **Purpose**: Benchmark critical operations like QR scanning and database queries
- **Framework**: Vitest with performance measurements
- **Command**: `npm run test:performance`

## Running Tests

### All Tests
```bash
npm run test:all
```

### Specific Test Suites
```bash
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # End-to-end tests only
npm run test:performance # Performance tests only
```

### Watch Mode
```bash
npm run test:watch       # Watch mode for development
```

### Coverage
```bash
npm run test:coverage    # Generate coverage report
```

### Interactive UI
```bash
npm run test:ui          # Vitest UI
npm run test:e2e:ui      # Playwright UI
```

## Test Configuration

### Environment Variables
Create a `.env.test` file with the following variables:

```env
# Database
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scan_ttendance_test

# Authentication
TEST_JWT_SECRET=test-jwt-secret-key

# API
TEST_API_URL=http://localhost:3000

# E2E
E2E_BASE_URL=http://localhost:3000
```

### Coverage Thresholds
The test suite enforces minimum coverage thresholds:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Writing Tests

### Component Tests
```typescript
import { render, screen } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### API Integration Tests
```typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { mockApp } from '@/test/utils/test-helpers'

describe('API Endpoints', () => {
  it('should handle POST requests', async () => {
    const response = await request(mockApp)
      .post('/api/endpoint')
      .send({ data: 'test' })
      .expect(200)
    
    expect(response.body.success).toBe(true)
  })
})
```

### E2E Tests
```typescript
import { test, expect } from '@playwright/test'

test('user can complete workflow', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Get Started')
  await expect(page).toHaveURL(/\/signup/)
})
```

### Performance Tests
```typescript
import { describe, it, expect } from 'vitest'
import { measurePerformance } from '@/test/utils/test-helpers'

describe('Performance', () => {
  it('should complete operation within time limit', async () => {
    const { duration } = await measurePerformance(
      async () => await myOperation(),
      100 // max 100ms
    )
    
    expect(duration).toBeLessThan(100)
  })
})
```

## Test Utilities

### Mock Data Generators
```typescript
import { 
  generateMockOrganization,
  generateMockEvent,
  generateMockAttendee 
} from '@/test/utils/test-helpers'

const mockOrg = generateMockOrganization({ name: 'Custom Name' })
```

### Database Helpers
```typescript
import { createMockDatabase, cleanupTestData } from '@/test/utils/test-helpers'

const mockDb = createMockDatabase()
await cleanupTestData(mockDb, 'org-123')
```

### Authentication Helpers
```typescript
import { createMockAuthContext } from '@/test/utils/test-helpers'

const mockAuth = createMockAuthContext({ id: 'user-123' })
```

## Continuous Integration

The test suite runs automatically on:
- **Push** to main/develop branches
- **Pull requests** to main/develop branches

### CI Pipeline Steps
1. **Linting** - Code style and quality checks
2. **Type Checking** - TypeScript compilation
3. **Unit Tests** - Component and function tests
4. **Integration Tests** - API endpoint tests
5. **Performance Tests** - Benchmark critical operations
6. **Build** - Application compilation
7. **E2E Tests** - Full workflow testing
8. **Security Audit** - Dependency vulnerability scan
9. **Coverage Report** - Code coverage analysis
10. **Deployment** - Automatic deployment on main branch

### Test Matrix
Tests run on multiple Node.js versions:
- Node.js 18.x
- Node.js 20.x

## Performance Benchmarks

### QR Code Scanning
- **Decode Time**: < 100ms
- **Initialization**: < 1000ms
- **Concurrent Scans**: 10 scans < 500ms

### Database Operations
- **Attendance Query**: < 50ms
- **Bulk Insert (1000 records)**: < 1000ms
- **Schema Creation**: < 500ms
- **Complex Statistics**: < 200ms

### API Response Times
- **Authentication**: < 200ms
- **Event Creation**: < 300ms
- **Attendance Verification**: < 100ms

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Ensure PostgreSQL is running
sudo service postgresql start

# Create test database
createdb scan_ttendance_test
```

#### Camera Permission Errors (E2E)
```bash
# Grant permissions in Playwright
await context.grantPermissions(['camera'])
```

#### Timeout Errors
```bash
# Increase timeout in test configuration
test.setTimeout(30000)
```

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* npm run test

# Run specific test file
npm run test -- src/test/components/MyComponent.test.tsx

# Run tests matching pattern
npm run test -- --grep "authentication"
```

## Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and isolated

### Mocking
- Mock external dependencies
- Use realistic test data
- Clean up mocks between tests
- Avoid over-mocking

### Performance
- Set appropriate timeouts
- Use `beforeEach`/`afterEach` for setup/cleanup
- Avoid unnecessary async operations
- Measure and benchmark critical paths

### Maintenance
- Update tests when features change
- Remove obsolete tests
- Keep test utilities up to date
- Monitor coverage trends

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain coverage thresholds
4. Update documentation
5. Add performance benchmarks for critical features

For bug fixes:
1. Write a failing test that reproduces the bug
2. Fix the bug
3. Ensure the test passes
4. Verify no regressions