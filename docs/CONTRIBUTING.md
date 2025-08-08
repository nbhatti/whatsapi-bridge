# Contributing to WhatsAPI Bridge

🎉 Thank you for considering contributing to WhatsAPI Bridge! We appreciate your interest in making this project better.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

### Our Standards

**✅ Examples of behavior that contributes to a positive environment:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**❌ Examples of unacceptable behavior:**
- Harassment, discrimination, or offensive comments
- Spam, trolling, or deliberate disruption
- Publishing others' private information without permission
- Any conduct that would be inappropriate in a professional setting

## Getting Started

### Prerequisites

- Node.js (v22 or higher) - LTS recommended
- npm (v10 or higher)
- Git
- Docker (for Redis and containerization)
- A code editor (VS Code recommended)

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/whatsapi-bridge.git
   cd whatsapi-bridge
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/nbhatti/whatsapi-bridge.git
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

6. **Start Redis (required for development):**
   ```bash
   npm run redis:up
   ```

7. **Run in development mode:**
   ```bash
   npm run dev
   ```

8. **Run tests to ensure everything works:**
   ```bash
   npm test
   ```

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes**
- ✨ **New features**
- 📚 **Documentation improvements**
- 🧪 **Test coverage improvements**
- 🎨 **Code refactoring**
- 🔧 **Performance optimizations**
- 🌐 **Translations**

### Before You Start

1. **Check existing issues** to see if your idea is already being discussed
2. **Create an issue** to discuss new features or major changes
3. **Keep changes focused** - one pull request per feature/bug fix
4. **Follow coding standards** outlined below

## Pull Request Process

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, readable code
- Add tests for new functionality
- Update documentation as needed
- Follow the established code style

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Check code formatting
npm run format:check

# Run linting
npm run lint

# Check TypeScript compilation
npm run build
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
git commit -m "feat: add AI integration for message responses"
git commit -m "fix: resolve Redis connection timeout issue"
git commit -m "docs: update API documentation for groups endpoint"
```

**Commit Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:

- **Clear title** describing the change
- **Detailed description** of what you changed and why
- **Reference any related issues** using `#issue-number`
- **Screenshots or demos** for UI changes
- **Testing instructions** for reviewers

### 6. Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for features
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots or demos here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or marked as breaking)
```

## Coding Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Clear interface definitions
interface MessageRequest {
  deviceId: string;
  to: string;
  content: string;
  type: 'text' | 'media' | 'document';
}

// ✅ Good: Proper error handling
async function sendMessage(request: MessageRequest): Promise<MessageResponse> {
  try {
    const device = await DeviceManager.getDevice(request.deviceId);
    return await device.sendMessage(request);
  } catch (error) {
    logger.error('Failed to send message:', error);
    throw new Error(`Message sending failed: ${error.message}`);
  }
}

// ❌ Avoid: Any types
function processData(data: any): any {
  return data.something;
}
```

### Code Style

- **Naming Conventions:**
  - Classes: `PascalCase` (e.g., `DeviceManager`)
  - Functions/Variables: `camelCase` (e.g., `sendMessage`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `API_KEY`)
  - Files: `kebab-case` (e.g., `device-manager.ts`)

- **File Organization:**
  ```
  src/
  ├── controllers/     # Route handlers
  ├── services/        # Business logic
  ├── models/          # Data models
  ├── middlewares/     # Express middlewares
  ├── utils/           # Utility functions
  ├── config/          # Configuration files
  └── types/           # Type definitions
  ```

### Error Handling

```typescript
// ✅ Good: Proper error handling with logging
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed:', {
    error: error.message,
    stack: error.stack,
    context: { userId, deviceId }
  });
  throw new ServiceError('Operation failed', 'OPERATION_ERROR', error);
}
```

## Testing Guidelines

### Writing Tests

- **Unit Tests:** Test individual functions/methods
- **Integration Tests:** Test API endpoints and service interactions
- **Mocking:** Use appropriate mocks for external dependencies

```typescript
// Example unit test
describe('MessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendTextMessage', () => {
    it('should send a text message successfully', async () => {
      // Arrange
      const mockDevice = {
        sendMessage: jest.fn().mockResolvedValue({ id: 'msg123' })
      };
      DeviceManager.getDevice = jest.fn().mockResolvedValue(mockDevice);

      // Act
      const result = await MessageService.sendTextMessage({
        deviceId: 'device1',
        to: '1234567890@c.us',
        content: 'Hello World'
      });

      // Assert
      expect(result).toEqual({ id: 'msg123' });
      expect(mockDevice.sendMessage).toHaveBeenCalledWith({
        to: '1234567890@c.us',
        body: 'Hello World'
      });
    });
  });
});
```

### Test Coverage

- Maintain **>80% test coverage**
- Test both **success and failure scenarios**
- Include **edge cases** and **boundary conditions**
- Test **async operations** properly

## Documentation

### Code Documentation

```typescript
/**
 * Sends a WhatsApp message through the specified device
 * 
 * @param request - The message request containing device ID, recipient, and content
 * @returns Promise resolving to message response with ID and status
 * @throws {DeviceNotFoundError} When the specified device doesn't exist
 * @throws {MessageSendError} When message sending fails
 * 
 * @example
 * ```typescript
 * const response = await sendMessage({
 *   deviceId: 'device-1',
 *   to: '1234567890@c.us',
 *   content: 'Hello World',
 *   type: 'text'
 * });
 * console.log(`Message sent with ID: ${response.id}`);
 * ```
 */
async function sendMessage(request: MessageRequest): Promise<MessageResponse> {
  // Implementation
}
```

### API Documentation

- Update Swagger/OpenAPI specifications
- Include request/response examples
- Document error responses
- Add parameter descriptions

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

```markdown
**Bug Description**
Clear description of the issue

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Ubuntu 20.04]
- Node.js version: [e.g., 16.14.0]
- WhatsAPI Bridge version: [e.g., 1.0.0]
- Browser (if applicable): [e.g., Chrome 96]

**Additional Context**
- Error messages/logs
- Screenshots
- Related issues
```

### Feature Requests

```markdown
**Feature Description**
Clear description of the proposed feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other approaches you've considered

**Additional Context**
Mockups, examples, or related features
```

## Community

### Getting Help

- 📖 **Documentation:** Check the README and docs
- 💬 **GitHub Discussions:** For questions and community discussion
- 🐛 **GitHub Issues:** For bug reports and feature requests

### Recognition

Contributors will be recognized in:
- GitHub contributors list
- Project documentation
- Release notes (for significant contributions)

### Commercial Support

For enterprise support or custom development:
- 📧 Email: [naseer@ylinx.pk](mailto:naseer@ylinx.pk)
- 🌐 Website: [https://ylinx.pk](https://ylinx.pk)

---

## 🙏 Thank You

Your contributions help make WhatsAPI Bridge better for everyone. We appreciate your time and effort!

**Questions?** Feel free to reach out via GitHub Discussions or email.

---

<p align="center">
  <b>🚀 Made with ❤️ by <a href="https://ylinx.pk">yLinx</a></b><br>
  <i>"Let's eDrive Your Business"</i>
</p>
