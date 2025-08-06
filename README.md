# 🚀 WhatsAPI Bridge

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![CI/CD Pipeline](https://github.com/nbhatti/whatsapi-bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/nbhatti/whatsapi-bridge/actions/workflows/ci.yml)
[![Release Pipeline](https://github.com/nbhatti/whatsapi-bridge/actions/workflows/release.yml/badge.svg)](https://github.com/nbhatti/whatsapi-bridge/actions/workflows/release.yml)
[![CodeQL](https://github.com/nbhatti/whatsapi-bridge/actions/workflows/codeql.yml/badge.svg)](https://github.com/nbhatti/whatsapi-bridge/actions/workflows/codeql.yml)
[![Codecov](https://codecov.io/gh/nbhatti/whatsapi-bridge/branch/main/graph/badge.svg)](https://codecov.io/gh/nbhatti/whatsapi-bridge)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.1.0-lightgrey)](https://expressjs.com/)
[![WhatsApp Web.js](https://img.shields.io/badge/WhatsApp%20Web.js-1.31.0-25D366)](https://wwebjs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://github.com/nbhatti/whatsapi-bridge/pkgs/container/whatsapi-bridge)

**Enterprise-grade WhatsApp Web.js REST API Bridge with AI capabilities, TypeScript, Redis, and Socket.IO support for seamless messaging automation.**

Developed by **[yLinx](https://ylinx.pk)** - A leading IT consulting and cloud services company providing innovative business solutions.

## 🌟 Features

- 🔌 **REST API Bridge** for WhatsApp Web.js
- 🤖 **AI Integration** for intelligent messaging
- 📱 **Multi-Device Support** with QR code authentication
- 💬 **Complete Messaging Suite** (text, media, documents, locations)
- 👥 **Group Management** (create, modify, participants)
- 📊 **Real-time Updates** via Socket.IO
- 🗄️ **Redis Integration** for session persistence and caching
- 📚 **Interactive API Documentation** with Swagger UI
- 🐳 **Docker Support** with compose configurations
- 🔒 **Enterprise Security** with rate limiting and API key authentication
- 📋 **Comprehensive Logging** with Winston
- ✅ **Full TypeScript** implementation with testing
- 🔄 **Health Monitoring** endpoints

## 📋 Table of Contents

- [Features](#-features)
- [Disclaimers](#-disclaimers)
- [About yLinx](#-about-ylinx)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Docker Deployment](#-docker-deployment)
- [CI/CD & Automation](#-cicd--automation)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

### 📚 Additional Documentation
- **[🚀 Quick Start Guide](QUICKSTART.md)** - Get up and running in minutes
- **[🔧 Installation Guide](INSTALLATION.md)** - Comprehensive installation instructions
- **[🤝 Contributing Guidelines](CONTRIBUTING.md)** - How to contribute to the project
- **[🔒 Security Policy](SECURITY.md)** - Security guidelines and reporting
- **[📋 Changelog](CHANGELOG.md)** - Version history and release notes

## ⚠️ Disclaimers

### Important Legal and Usage Notices:

**🚨 NOT AFFILIATED WITH WHATSAPP OR META**
- This project is **NOT** affiliated with, endorsed by, or connected to WhatsApp Inc., Meta Platforms Inc., or Facebook Inc.
- WhatsApp is a trademark of Meta Platforms Inc.

**📋 TERMS OF USE**
- This software is provided under the MIT License for **educational and legitimate business purposes only**
- Users are **solely responsible** for compliance with WhatsApp's Terms of Service
- **yLinx** and the project contributors are **NOT responsible** for:
  - Account suspensions, bans, or restrictions imposed by WhatsApp
  - Any violations of WhatsApp's Terms of Service
  - Misuse of the software for spam, abuse, or illegal activities
  - Any damages or losses resulting from the use of this software

**🛡️ RESPONSIBLE USAGE**
- **DO NOT** use for spam, harassment, or unsolicited messaging
- **RESPECT** WhatsApp's rate limits and usage policies
- **ENSURE** compliance with local laws and regulations
- **USE** only with explicit consent for business messaging

**🔒 SECURITY NOTICE**
- Keep your API keys, session data, and credentials secure
- Use proper authentication and rate limiting in production
- Regularly update dependencies for security patches

## 🏢 About yLinx

**[yLinx](https://ylinx.pk)** is a leading IT consulting and technology services company specializing in:

- 🌐 **Internet & Data Connectivity**
- ☁️ **Cloud Services**
- 🖥️ **Server Co-location & Hosting**
- 📞 **Call Center & IP Telephony Solutions**
- 💼 **ERP Solutions for Small Businesses**
- 🔧 **Custom IT Solutions & Consulting**

**Mission:** "Let's eDrive Your Business" - We deliver seamless, high-quality technology solutions that empower businesses to thrive in the digital age.

**Contact yLinx:**
- 🌍 Website: [https://ylinx.pk](https://ylinx.pk)
- 📧 Email: [naseer@ylinx.pk](mailto:naseer@ylinx.pk)
- 📍 Address: 71-B1 Johar Town, Lahore, Pakistan
- ☎️ Phone: +92 423 222 7788

## 🚀 Getting Started

These instructions will get you a copy of WhatsAPI Bridge up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (v22 or higher) - LTS recommended
* npm (v10 or higher)
* Docker (for running Redis)

### Installing

1. Clone the repository:
   ```sh
   git clone https://github.com/nbhatti/whatsapi-bridge.git
   cd whatsapi-bridge
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file from the example:
   ```sh
   cp .env.example .env
   ```
   Update the `.env` file with your specific configuration, especially the `REDIS_URL` for connecting to Redis.

### Running Redis with Docker

For local development, you can use the provided Docker Compose file to run Redis:

```sh
# Start Redis in background
npm run redis:up

# Stop Redis
npm run redis:down
```

Alternatively, you can use Docker commands directly:

```sh
# Start Redis
docker-compose -f docker-compose.redis.yml up -d

# Stop Redis
docker-compose -f docker-compose.redis.yml down
```

### Running the Application

* **Development:**
  ```sh
  npm run dev
  ```
  This will start the server with hot-reloading using `ts-node-dev`.

* **Production:**
  First, build the application:
  ```sh
  npm run build
  ```
  Then, start the server:
  ```sh
  npm start
  ```

## 📚 API Documentation

The API is comprehensively documented using **Swagger UI** with interactive endpoints. Once the server is running, access the documentation at:

**🔗 [http://localhost:3000/docs](http://localhost:3000/docs)**

### Available API Categories:

- 🤖 **AI Integration** - Intelligent messaging capabilities
- 💬 **Chats** - Chat management and operations
- 📱 **Devices** - Multi-device support and authentication
- 👥 **Groups** - Group creation and management
- 📤 **Messages** - Send and receive various message types
- ✅ **Examples** - Ready-to-use API examples
- 🔧 **Validation** - Input validation examples

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Build and start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

### Development with Docker

```bash
# Development mode with hot reloading
npm run docker:dev

# Build development containers
npm run docker:dev:build
```

### Production Deployment

```bash
# Build production containers
npm run docker:build

# Start production services
docker-compose up -d
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=production
API_KEY=your-secure-api-key

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_TIMEOUT=60000

# AI Configuration (Optional)
OPENAI_API_KEY=your-openai-key
AI_MODEL=gpt-3.5-turbo

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Best Practices

1. **🔐 Use Strong API Keys** - Generate cryptographically secure API keys
2. **🚫 Enable Rate Limiting** - Protect against abuse and DDoS
3. **📝 Monitor Logs** - Keep track of all API activities
4. **🔒 Use HTTPS** - Always use SSL/TLS in production
5. **🗄️ Secure Redis** - Use password authentication for Redis

## 📖 Usage Examples

### Basic Message Sending

```javascript
// Send a text message
POST /api/v1/messages/send
{
  "deviceId": "device-1",
  "to": "1234567890@c.us",
  "type": "text",
  "content": "Hello from WhatsAPI Bridge!"
}
```

### AI-Powered Responses

```javascript
// Get AI response for a message
POST /api/v1/ai/chat
{
  "deviceId": "device-1",
  "message": "How can I help you today?",
  "context": "customer_support"
}
```

### Group Management

```javascript
// Create a new group
POST /api/v1/groups/create
{
  "deviceId": "device-1",
  "name": "My Business Group",
  "participants": ["1234567890@c.us", "0987654321@c.us"]
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration
```

## 📊 Health Monitoring

Monitor your WhatsAPI Bridge instance:

- **Health Check:** `GET /health`
- **Metrics:** Real-time system metrics
- **Redis Status:** Connection status monitoring
- **Memory Usage:** Application memory tracking

## 🔄 CI/CD & Automation

WhatsAPI Bridge includes enterprise-grade CI/CD pipelines with comprehensive automation:

### 🚀 **Continuous Integration Pipeline**
- **Multi-Platform Testing** - Ubuntu, Windows, macOS
- **Node.js Matrix** - Tests on Node.js 22 & 24
- **Quality Gates** - Linting, formatting, security audits
- **Docker Integration** - Automated container builds and testing
- **Performance Analysis** - Bundle size tracking and optimization
- **Dependency Management** - Automated vulnerability scanning

### 🛡️ **Security & Code Analysis**
- **CodeQL Analysis** - GitHub's semantic code analysis
- **Trivy Container Scanning** - Docker image vulnerability detection
- **Automated Security Audits** - Weekly dependency vulnerability checks
- **SARIF Integration** - Security findings in GitHub Security tab

### 📦 **Release Automation**
- **Semantic Versioning** - Automated version bumping
- **Multi-Architecture Docker** - AMD64 and ARM64 container builds
- **GitHub Container Registry** - Automated Docker image publishing
- **Release Assets** - Compiled distributions and source archives
- **Changelog Generation** - Automated release notes from git history

### 🤖 **Dependency Management**
- **Dependabot Integration** - Automated dependency updates
- **Smart Scheduling** - Weekly updates with intelligent grouping
- **Security Priority** - Critical security patches auto-merged
- **Manual Review** - Major version updates require approval

### 📈 **Monitoring & Reporting**
- **Code Coverage** - Codecov integration with detailed reporting
- **Build Notifications** - Real-time status updates
- **Performance Metrics** - Bundle size and build time tracking
- **Quality Trends** - Long-term code health monitoring

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Setup

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/whatsapi-bridge.git`
3. **Install** dependencies: `npm install`
4. **Create** a feature branch: `git checkout -b feature/amazing-feature`
5. **Make** your changes
6. **Test** your changes: `npm test`
7. **Commit** your changes: `git commit -m 'Add amazing feature'`
8. **Push** to the branch: `git push origin feature/amazing-feature`
9. **Open** a Pull Request

### Code Style

- Follow **TypeScript** best practices
- Use **ESLint** and **Prettier** for code formatting
- Write **comprehensive tests** for new features
- Add **JSDoc** comments for public APIs
- Follow **conventional commits** format

### Reporting Issues

When reporting issues, please include:

- Node.js and npm versions
- Operating system details
- Steps to reproduce the issue
- Expected vs actual behavior
- Relevant logs or error messages

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### MIT License Summary:
- ✅ **Free to use** for any purpose
- ✅ **Modify and distribute** freely
- ✅ **Private and commercial use** allowed
- ❗ **No warranty** provided
- 📋 **Attribution required**

## 🆘 Support

### Community Support

- 📖 **Documentation**: Check our comprehensive docs
- 🐛 **Issues**: [GitHub Issues](https://github.com/nbhatti/whatsapi-bridge/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/nbhatti/whatsapi-bridge/discussions)

### Commercial Support

For enterprise support, custom development, or consulting services:

**Contact yLinx:**
- 📧 Email: [naseer@ylinx.pk](mailto:naseer@ylinx.pk)
- 🌐 Website: [https://ylinx.pk](https://ylinx.pk)
- 📞 Phone: +92 423 222 7788

### Author

**Muhammad Naseer Bhatti**
- Email: [naseer@ylinx.pk](mailto:naseer@ylinx.pk)
- Company: [yLinx](https://ylinx.pk)
- GitHub: [@nbhatti](https://github.com/nbhatti)

---

<p align="center">
  <b>🚀 Made with ❤️ by <a href="https://ylinx.pk">yLinx</a></b><br>
  <i>"Let's eDrive Your Business"</i>
</p>

---

**⭐ If this project helped you, please consider giving it a star on GitHub! ⭐**

