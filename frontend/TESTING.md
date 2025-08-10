# Testing Guide

This document describes the testing setup and practices for the WhatsApp Frontend application.

## Test Structure

```
├── src/
│   ├── components/__tests__/          # Component unit tests
│   ├── hooks/__tests__/              # Custom hook tests
│   ├── __tests__/                    # General unit tests
│   └── api/__tests__/               # API integration tests
├── cypress/
│   ├── e2e/                         # End-to-end tests
│   ├── support/                     # Cypress support files
│   └── fixtures/                    # Test data fixtures
├── __tests__/
│   ├── utils/                       # Test utilities
│   └── setup/                       # Test setup files
├── jest.config.js                   # Jest configuration
├── jest.setup.js                    # Jest setup file
└── cypress.config.ts                # Cypress configuration
```

## Types of Tests

### 1. Unit Tests (Jest + React Testing Library)

Run unit tests for components, hooks, and utilities:

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### Example Component Test
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '../Navigation';

describe('Navigation', () => {
  it('should render navigation links', () => {
    render(<Navigation />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
```

### 2. API Tests (Supertest + Node Mocks)

Run API endpoint tests:

```bash
# Run API tests only
npm run test:api
```

#### Example API Test
```typescript
import { createMocks } from 'node-mocks-http';
import { POST as loginHandler } from '../../app/api/auth/login/route';

describe('/api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: { email: 'test@example.com', password: 'password123' }
    });

    const response = await loginHandler(req);
    expect(response.status).toBe(200);
  });
});
```

### 3. End-to-End Tests (Cypress)

Run E2E tests that test the full application flow:

```bash
# Open Cypress Test Runner (interactive)
npm run cypress:open

# Run Cypress tests headlessly
npm run cypress:run

# Run E2E tests
npm run test:e2e
```

#### Example E2E Test
```typescript
describe('Authentication Flow', () => {
  it('should login and navigate to dashboard', () => {
    cy.login();
    cy.url().should('include', '/dashboard');
    cy.contains('WhatsApp API').should('be.visible');
  });
});
```

## Testing with Docker

Run E2E tests in Docker environment:

```bash
# Start test environment
docker-compose -f docker-compose.cypress.yml up --build

# Run tests only
docker-compose -f docker-compose.cypress.yml run --rm cypress
```

## Code Quality Tools

### ESLint
```bash
# Check for linting errors (max 0 warnings)
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

### Prettier
```bash
# Check code formatting
npm run format:check

# Format code
npm run format
```

### Husky Pre-commit Hooks

Pre-commit hooks automatically run:
- ESLint with no warnings allowed
- Prettier format check
- Unit tests

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

1. **Lint and Test Job**:
   - ESLint check
   - Prettier format check
   - Unit tests
   - API tests
   - Build verification

2. **E2E Tests Job**:
   - Cypress end-to-end tests
   - Screenshot/video capture on failure

3. **Build and Push Job** (main branch only):
   - Docker image build and push to GitHub Container Registry

4. **Security Scan Job** (main branch only):
   - Trivy vulnerability scanning

## Test Environment Variables

Set these environment variables for testing:

```env
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whatsapp_test
JWT_SECRET=test-jwt-secret
NEXTAUTH_SECRET=test-nextauth-secret
NEXTAUTH_URL=http://localhost:4000
```

## Best Practices

### Unit Testing
- Test component behavior, not implementation details
- Use data-testid for complex queries
- Mock external dependencies
- Test error states and edge cases

### Integration Testing
- Test API endpoints with real database transactions
- Use test database for isolation
- Clean up test data between tests

### E2E Testing
- Test critical user journeys
- Use Page Object Model for complex flows
- Keep tests independent and isolated
- Use custom commands for common actions

### Test Data
- Use factories for creating test data
- Keep test data minimal but realistic
- Use consistent test data across all test types

## Debugging Tests

### Jest Tests
```bash
# Run specific test file
npm test -- Navigation.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should login"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand Navigation.test.tsx
```

### Cypress Tests
```bash
# Open Cypress with debug mode
DEBUG=cypress:* npm run cypress:open

# Run specific test file
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

## Coverage Reports

Generate and view coverage reports:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Writing New Tests

1. **Component Tests**: Place in `src/components/__tests__/`
2. **Hook Tests**: Place in `src/hooks/__tests__/`
3. **API Tests**: Place in `src/__tests__/api/`
4. **E2E Tests**: Place in `cypress/e2e/`

Follow the existing patterns and use the test utilities in `__tests__/utils/test-utils.tsx`.
