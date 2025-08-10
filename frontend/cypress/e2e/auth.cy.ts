describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.cleanTestData();
    cy.seedTestData();
  });

  after(() => {
    cy.cleanTestData();
  });

  it('should display login page', () => {
    cy.visit('/login');
    cy.contains('Login').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    
    // Should show validation errors
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    cy.contains('Invalid credentials').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    cy.login();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('WhatsApp API').should('be.visible');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should logout successfully', () => {
    cy.login();
    cy.logout();
    
    // Should redirect to login page
    cy.url().should('include', '/login');
    cy.contains('Login').should('be.visible');
  });

  it('should navigate to different pages when authenticated', () => {
    cy.login();
    
    // Test navigation
    cy.contains('Chat').click();
    cy.url().should('include', '/chat');
    
    cy.contains('Devices').click();
    cy.url().should('include', '/devices');
    
    cy.contains('Groups').click();
    cy.url().should('include', '/groups');
    
    cy.contains('Contacts').click();
    cy.url().should('include', '/contacts');
  });

  it('should redirect to login when accessing protected routes without auth', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
    
    cy.visit('/chat');
    cy.url().should('include', '/login');
    
    cy.visit('/devices');
    cy.url().should('include', '/login');
  });
});
