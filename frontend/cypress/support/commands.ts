// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Custom command for login
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('TEST_USER_EMAIL') || 'test@example.com';
  const testPassword = password || Cypress.env('TEST_USER_PASSWORD') || 'testPassword123';

  cy.visit('/login');
  cy.get('input[name="email"]').type(testEmail);
  cy.get('input[name="password"]').type(testPassword);
  cy.get('button[type="submit"]').click();
  
  // Wait for redirect to dashboard
  cy.url().should('include', '/dashboard');
});

// Custom command for logout
Cypress.Commands.add('logout', () => {
  cy.get('button').contains('Sign out').click();
  cy.url().should('include', '/login');
});

// Custom command to seed test data
Cypress.Commands.add('seedTestData', () => {
  cy.request({
    method: 'POST',
    url: '/api/test/seed',
    failOnStatusCode: false,
  });
});

// Custom command to clean test data
Cypress.Commands.add('cleanTestData', () => {
  cy.request({
    method: 'POST',
    url: '/api/test/cleanup',
    failOnStatusCode: false,
  });
});
