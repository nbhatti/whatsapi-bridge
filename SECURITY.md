# Security Policy

## 🔒 Our Commitment to Security

At **yLinx**, we take security seriously and are committed to ensuring the safety and security of WhatsAPI Bridge and its users.

## 📋 Table of Contents

- [Supported Versions](#supported-versions)
- [Reporting a Vulnerability](#reporting-a-vulnerability)
- [Security Best Practices](#security-best-practices)
- [Known Security Considerations](#known-security-considerations)
- [Security Updates](#security-updates)
- [Responsible Disclosure](#responsible-disclosure)

## 🛡️ Supported Versions

We actively maintain security for the following versions of WhatsAPI Bridge:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 1.x.x   | ✅ Yes            | Active development and security updates |
| 0.x.x   | ❌ No             | End of life - please upgrade |

**Recommendation:** Always use the latest stable version to ensure you have the most recent security patches and improvements.

## 🚨 Reporting a Vulnerability

### Critical Security Issues

For **critical security vulnerabilities** that could potentially:
- Compromise user data or privacy
- Allow unauthorized access to systems
- Enable remote code execution
- Bypass authentication or authorization

**Please DO NOT create a public GitHub issue.**

### Secure Reporting Channels

**Primary Contact:**
- 📧 **Email:** [security@ylinx.pk](mailto:security@ylinx.pk)
- 🔐 **Encryption:** PGP key available upon request

**Alternative Contact:**
- 📧 **Email:** [naseer@ylinx.pk](mailto:naseer@ylinx.pk)
- 📞 **Phone:** +92 423 222 7788 (for urgent issues)

### What to Include

When reporting a security vulnerability, please provide:

```markdown
**Vulnerability Type:** [e.g., SQL Injection, XSS, Authentication Bypass]

**Affected Component:** [e.g., API endpoint, authentication middleware]

**Affected Versions:** [e.g., 1.0.0 - 1.2.1]

**Description:** 
Clear description of the vulnerability

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Impact Assessment:**
- Confidentiality: [High/Medium/Low]
- Integrity: [High/Medium/Low]
- Availability: [High/Medium/Low]

**Proof of Concept:**
[Include if safe to do so, avoid actual exploitation]

**Suggested Mitigation:**
[If you have ideas for fixes]

**Reporter Information:**
- Name: [Your name or handle]
- Contact: [How we can reach you]
- Public Credit: [Yes/No - if you want to be credited]
```

### Response Timeline

- **Initial Response:** Within 48 hours
- **Assessment:** Within 5 business days
- **Status Updates:** Weekly until resolution
- **Fix Timeline:** Based on severity
  - Critical: 1-3 days
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release cycle

## 🛡️ Security Best Practices

### For Deployment

**🔐 Authentication & Authorization**
```env
# Use strong, unique API keys
API_KEY=your-cryptographically-secure-api-key

# Enable rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

**🔒 Transport Security**
- Always use HTTPS in production
- Configure proper SSL/TLS certificates
- Enable HTTP Strict Transport Security (HSTS)

**🗄️ Database & Redis Security**
```env
# Use password authentication for Redis
REDIS_PASSWORD=your-strong-redis-password

# Use secure Redis connection
REDIS_URL=rediss://username:password@host:port
```

**📝 Logging & Monitoring**
- Enable comprehensive logging
- Monitor for suspicious activities
- Set up alerts for security events
- Regularly review access logs

### For Development

**🔧 Dependency Management**
```bash
# Regularly audit dependencies
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Update dependencies regularly
npm update
```

**🧪 Security Testing**
```bash
# Run security linting
npm run lint

# Check for known vulnerabilities
npm audit

# Run all tests including security tests
npm test
```

**📱 WhatsApp Session Security**
- Store session files securely
- Use appropriate file permissions (600)
- Regularly rotate session tokens
- Monitor session activity

### Environment Security

**🐳 Docker Security**
- Use minimal base images
- Run containers as non-root user
- Scan images for vulnerabilities
- Keep base images updated

**☁️ Cloud Deployment**
- Use service accounts with minimal permissions
- Enable cloud provider security features
- Configure network security groups properly
- Use managed services where possible

## ⚠️ Known Security Considerations

### WhatsApp Terms of Service
- **Risk:** Account suspension or ban by WhatsApp
- **Mitigation:** Follow WhatsApp's Terms of Service and rate limits
- **Responsibility:** User assumes all risks related to WhatsApp policy violations

### Session Management
- **Risk:** Session hijacking or unauthorized access
- **Mitigation:** Secure session storage, proper access controls
- **Best Practice:** Regular session rotation and monitoring

### Rate Limiting
- **Risk:** API abuse and resource exhaustion
- **Mitigation:** Implement proper rate limiting and monitoring
- **Configuration:** Adjust limits based on your use case

### Third-Party Dependencies
- **Risk:** Vulnerabilities in npm packages
- **Mitigation:** Regular dependency updates and security audits
- **Monitoring:** Automated vulnerability scanning

## 🔄 Security Updates

### Update Notifications

We recommend:
- ⭐ **Star** our repository to get notified of releases
- 📧 **Subscribe** to security announcements
- 🔔 **Enable** GitHub notifications for security advisories

### Emergency Security Patches

For critical security issues, we may:
- Release immediate patches outside regular release cycles
- Provide specific upgrade instructions
- Offer direct support for enterprise users

### Automated Security

```json
{
  "scripts": {
    "security:audit": "npm audit",
    "security:fix": "npm audit fix",
    "security:check": "npm run lint && npm audit"
  }
}
```

## 🤝 Responsible Disclosure

### Our Commitment

- **Acknowledgment:** We'll acknowledge receipt of your report promptly
- **Communication:** We'll keep you informed of our progress
- **Credit:** We'll credit you in our security advisories (if desired)
- **No Retaliation:** We won't take legal action for good faith security research

### Researcher Guidelines

**✅ Acceptable Research:**
- Testing on your own instances
- Automated scanning with reasonable rate limits
- Responsible vulnerability disclosure
- Collaboration on fixes

**❌ Unacceptable Activities:**
- Testing on third-party instances without permission
- Accessing or modifying user data
- Disrupting service availability
- Public disclosure before coordinated release

### Bounty Program

While we don't currently offer a formal bug bounty program, we:
- Recognize valuable contributions publicly
- Consider monetary rewards for exceptional findings
- Offer direct communication with our security team
- Provide priority support for security researchers

## 📞 Security Contact Information

**yLinx Security Team**

- 🔒 **Primary:** [security@ylinx.pk](mailto:security@ylinx.pk)
- 👤 **Lead:** Muhammad Naseer Bhatti ([naseer@ylinx.pk](mailto:naseer@ylinx.pk))
- 🌐 **Company:** [https://ylinx.pk](https://ylinx.pk)
- 📍 **Address:** 71-B1 Johar Town, Lahore, Pakistan
- ☎️ **Phone:** +92 423 222 7788

**Business Hours:** Sunday - Thursday, 9 AM - 6 PM (PKT)
**Emergency Response:** Available 24/7 for critical security issues

---

## 🙏 Thank You

We appreciate your help in keeping WhatsAPI Bridge secure. Your responsible disclosure helps protect our users and the broader community.

For questions about this security policy, please contact [security@ylinx.pk](mailto:security@ylinx.pk).

---

<p align="center">
  <b>🔒 Security is a shared responsibility</b><br>
  <i>Together, we build safer software</i>
</p>

---

**Last Updated:** January 2025
