import { v4 as uuidv4, v1 as uuidv1, validate as validateUuid, version as getUuidVersion } from 'uuid';

// Generate a random UUID v4
export const generateUUID = (): string => {
  return uuidv4();
};

// Generate a timestamp-based UUID v1
export const generateTimestampUUID = (): string => {
  return uuidv1();
};

// Generate a client ID with prefix
export const generateClientId = (prefix: string = 'client'): string => {
  return `${prefix}_${uuidv4()}`;
};

// Generate a session ID
export const generateSessionId = (): string => {
  return `session_${uuidv4()}`;
};

// Generate a message ID
export const generateMessageId = (): string => {
  return `msg_${uuidv4()}`;
};

// Validate UUID format
export const isValidUUID = (uuid: string): boolean => {
  return validateUuid(uuid);
};

// Get UUID version
export const getUuidVersionNumber = (uuid: string): number | null => {
  try {
    return getUuidVersion(uuid);
  } catch {
    return null;
  }
};

// Generate short ID (8 characters)
export const generateShortId = (): string => {
  return uuidv4().substring(0, 8);
};

// Generate custom ID with format
export const generateCustomId = (prefix: string, includeTimestamp: boolean = false): string => {
  const uuid = uuidv4();
  const timestamp = includeTimestamp ? `_${Date.now()}` : '';
  return `${prefix}_${uuid}${timestamp}`;
};
