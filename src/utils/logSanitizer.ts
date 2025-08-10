/**
 * Utility functions to sanitize sensitive data in logs
 * Ensures privacy by redacting message content and other sensitive information
 */

/**
 * Safely redact message content for logging while preserving useful debug info
 * @param content - The message content to redact
 * @param maxLength - Maximum length to show before truncation (default: 0 = full redaction)
 * @returns Redacted content string
 */
export function redactMessageContent(content: string, maxLength: number = 0): string {
  if (!content || typeof content !== 'string') {
    return '[empty]';
  }

  if (maxLength === 0) {
    return `[REDACTED - ${content.length} chars]`;
  }

  // For debugging purposes, optionally show a very limited preview
  if (content.length <= maxLength) {
    return content;
  }

  return `${content.substring(0, maxLength)}... [REDACTED - ${content.length} chars total]`;
}

/**
 * Get safe message metadata for logging without exposing content
 * @param content - The message content
 * @param type - The message type
 * @returns Safe logging metadata
 */
export function getMessageLogMetadata(content: string, type: string): {
  type: string;
  length: number;
  hasContent: boolean;
  contentPreview?: string;
} {
  return {
    type,
    length: content?.length || 0,
    hasContent: !!(content && content.trim()),
    // Only include preview for very short, likely non-sensitive content
    ...(content && content.length <= 10 && !containsSensitivePatterns(content) 
      ? { contentPreview: content } 
      : {})
  };
}

/**
 * Check if content might contain sensitive information
 * @param content - Content to check
 * @returns True if potentially sensitive
 */
function containsSensitivePatterns(content: string): boolean {
  if (!content) return false;
  
  const sensitivePatterns = [
    /\b\d{4,}\b/, // Numbers with 4+ digits (could be phone, ID, etc.)
    /@/, // Email addresses
    /password/i,
    /token/i,
    /key/i,
    /secret/i,
    /auth/i,
    /login/i,
    /otp/i,
    /pin/i,
    /\$/, // Could be financial
    /bank/i,
    /account/i,
    /card/i,
  ];

  return sensitivePatterns.some(pattern => pattern.test(content));
}

/**
 * Safely format phone number for logging (redact middle digits)
 * @param phoneNumber - Phone number to redact
 * @returns Redacted phone number
 */
export function redactPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return '[no-phone]';
  }

  // Remove common prefixes/suffixes
  const cleaned = phoneNumber.replace(/@c\.us$/, '').replace(/^\+/, '');
  
  if (cleaned.length <= 4) {
    return '[short-phone]';
  }
  
  if (cleaned.length <= 8) {
    return `${cleaned.substring(0, 2)}***${cleaned.substring(cleaned.length - 2)}`;
  }
  
  return `${cleaned.substring(0, 3)}****${cleaned.substring(cleaned.length - 3)}`;
}

/**
 * Create a safe log object that redacts sensitive information
 * @param logData - Original log data object
 * @returns Sanitized log data
 */
export function sanitizeLogData(logData: any): any {
  if (!logData || typeof logData !== 'object') {
    return logData;
  }

  const sanitized = { ...logData };

  // Redact common sensitive fields
  if (sanitized.content) {
    sanitized.content = redactMessageContent(sanitized.content);
  }
  
  if (sanitized.body) {
    sanitized.body = redactMessageContent(sanitized.body);
  }
  
  if (sanitized.text) {
    sanitized.text = redactMessageContent(sanitized.text);
  }
  
  if (sanitized.message && typeof sanitized.message === 'string') {
    sanitized.message = redactMessageContent(sanitized.message);
  }
  
  if (sanitized.to) {
    sanitized.to = redactPhoneNumber(sanitized.to);
  }
  
  if (sanitized.from) {
    sanitized.from = redactPhoneNumber(sanitized.from);
  }
  
  if (sanitized.phoneNumber) {
    sanitized.phoneNumber = redactPhoneNumber(sanitized.phoneNumber);
  }

  return sanitized;
}
