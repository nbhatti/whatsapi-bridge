// cypress/support/index.d.ts

/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to log in a user
     * @example cy.login('user@example.com', 'password123')
     */
    login(email?: string, password?: string): Chainable<void>

    /**
     * Custom command to log out the current user
     * @example cy.logout()
     */
    logout(): Chainable<void>

    /**
     * Custom command to seed test data in the database
     * @example cy.seedTestData()
     */
    seedTestData(): Chainable<void>

    /**
     * Custom command to clean up test data from the database
     * @example cy.cleanTestData()
     */
    cleanTestData(): Chainable<void>
  }
}
