
import { MessageMedia } from 'whatsapp-web.js';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';

/**
 * Interface for media conversion options.
 */
export interface MediaConversionOptions {
  /** Send media as sticker */
  isSticker?: boolean;
  /** Send audio as voice message */
  isVoice?: boolean;
  /** Send media in HD quality */
  isHD?: boolean;
  /** Custom filename for the media */
  filename?: string;
  /** Custom MIME type (overrides auto-detection) */
  mimetype?: string;
  /** Maximum file size in bytes (default: 64MB) */
  maxSize?: number;
}

/**
 * Converts media from a URL, base64 string, or file path to a MessageMedia object.
 *
 * @param media - The media to convert, which can be a URL, base64 string, or file path.
 * @param options - Options for media conversion.
 * @returns A Promise that resolves to a MessageMedia object.
 */
export async function toMessageMedia(
  media: string,
  options: MediaConversionOptions = {},
): Promise<MessageMedia> {
  if (isUrl(media)) {
    return await fromUrl(media, options);
  } else if (isBase64(media)) {
    return fromBase64(media, options);
  } else if (fs.existsSync(media)) {
    return fromFilePath(media, options);
  } else {
    throw new Error('Invalid media format. Must be a URL, base64 string, or a valid file path.');
  }
}

/**
 * Creates a MessageMedia instance from a URL.
 *
 * @param url - The URL of the media.
 * @param options - Options for media conversion.
 * @returns A Promise that resolves to a MessageMedia object.
 */
export async function fromUrl(
  url: string,
  options: MediaConversionOptions = {},
): Promise<MessageMedia> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch media from URL: ${url}`);
    }

    const buffer = await response.buffer();
    const base64Data = buffer.toString('base64');
    const mimetype = response.headers.get('content-type') || mime.lookup(url) || 'application/octet-stream';

    return new MessageMedia(mimetype, base64Data, getFilename(url, options.filename));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error fetching media from URL: ${errorMessage}`);
  }
}

/**
 * Creates a MessageMedia instance from a base64 string.
 *
 * @param base64Data - The base64-encoded media data.
 * @param options - Options for media conversion.
 * @returns A MessageMedia object.
 */
export function fromBase64(
  base64Data: string,
  options: MediaConversionOptions = {},
): MessageMedia {
  const mimetype = getMimeTypeFromBase64(base64Data) || 'application/octet-stream';
  return new MessageMedia(mimetype, base64Data, options.filename);
}

/**
 * Creates a MessageMedia instance from a local file path.
 *
 * @param filePath - The path to the local media file.
 * @param options - Options for media conversion.
 * @returns A MessageMedia object.
 */
export function fromFilePath(
  filePath: string,
  options: MediaConversionOptions = {},
): MessageMedia {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }
  const base64Data = fs.readFileSync(filePath, 'base64');
  const mimetype = mime.lookup(filePath) || 'application/octet-stream';

  return new MessageMedia(mimetype, base64Data, getFilename(filePath, options.filename));
}

/**
 * Checks if a string is a valid URL.
 *
 * @param s - The string to check.
 * @returns True if the string is a URL, false otherwise.
 */
function isUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Checks if a string is a base64-encoded string.
 *
 * @param s - The string to check.
 * @returns True if the string is base64-encoded, false otherwise.
 */
function isBase64(s: string): boolean {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length % 4 === 0;
}

/**
 * Extracts a filename from a URL or file path.
 *
 * @param mediaPath - The URL or file path.
 * @param defaultFilename - A default filename to use if one cannot be extracted.
 * @returns The filename.
 */
function getFilename(mediaPath: string, defaultFilename?: string): string {
  return defaultFilename || path.basename(mediaPath) || 'file';
}

/**
 * Determines the MIME type from a base64 string.
 *
 * @param base64Data - The base64-encoded data.
 * @returns The MIME type, or null if it cannot be determined.
 */
function getMimeTypeFromBase64(base64Data: string): string | null {
    const signatures: { [key: string]: string } = {
        'R0lGODdh': 'image/gif',
        'R0lGODlh': 'image/gif',
        'iVBORw0KGgo': 'image/png',
        '/9j/': 'image/jpeg',
        'JVBERi0': 'application/pdf',
        'UEsDBBQ': 'application/zip',
        'PK': 'application/zip',
        'SUQzBA': 'audio/mp3',
        'GkXfo': 'video/mp4',
        'Qk': 'image/bmp',
        'UklGR': 'audio/wav',
        'AAAAIGZ0eXA': 'video/mp4',
        'AAABAA': 'image/x-icon',
        'PHN2Zw': 'image/svg+xml',
    };

    for (const signature in signatures) {
        if (base64Data.startsWith(signature)) {
            return signatures[signature];
        }
    }
    return null;
}

/**
 * Validates media file size.
 *
 * @param base64Data - The base64-encoded data.
 * @param maxSize - Maximum allowed size in bytes (default: 64MB).
 * @throws Error if file exceeds size limit.
 */
function validateFileSize(base64Data: string, maxSize: number = 64 * 1024 * 1024): void {
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > maxSize) {
        throw new Error(`File size exceeds limit. Max allowed: ${maxSize} bytes, got: ${sizeInBytes} bytes`);
    }
}

/**
 * Checks if the media type is supported for stickers.
 *
 * @param mimetype - The MIME type to check.
 * @returns True if the media can be sent as a sticker.
 */
export function isStickerSupported(mimetype: string): boolean {
    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    return supportedTypes.includes(mimetype.toLowerCase());
}

/**
 * Checks if the media type is supported for voice messages.
 *
 * @param mimetype - The MIME type to check.
 * @returns True if the media can be sent as a voice message.
 */
export function isVoiceSupported(mimetype: string): boolean {
    const supportedTypes = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/m4a'];
    return supportedTypes.includes(mimetype.toLowerCase());
}

/**
 * Gets the media type category from MIME type.
 *
 * @param mimetype - The MIME type.
 * @returns The media category ('image', 'audio', 'video', 'document').
 */
export function getMediaType(mimetype: string): 'image' | 'audio' | 'video' | 'document' {
    const type = mimetype.toLowerCase().split('/')[0];
    switch (type) {
        case 'image':
            return 'image';
        case 'audio':
            return 'audio';
        case 'video':
            return 'video';
        default:
            return 'document';
    }
}

/**
 * Creates MessageMedia with validation and enhanced options.
 *
 * @param data - The media data (URL, base64, or file path).
 * @param options - Enhanced conversion options.
 * @returns A Promise that resolves to a MessageMedia object with validation.
 */
export async function createValidatedMedia(
    data: string,
    options: MediaConversionOptions = {},
): Promise<MessageMedia> {
    const media = await toMessageMedia(data, options);
    
    // Validate file size
    if (options.maxSize) {
        validateFileSize(media.data, options.maxSize);
    }
    
    // Override MIME type if specified
    if (options.mimetype) {
        media.mimetype = options.mimetype;
    }
    
    // Validate sticker support
    if (options.isSticker && !isStickerSupported(media.mimetype)) {
        throw new Error(`Media type ${media.mimetype} is not supported for stickers`);
    }
    
    // Validate voice support
    if (options.isVoice && !isVoiceSupported(media.mimetype)) {
        throw new Error(`Media type ${media.mimetype} is not supported for voice messages`);
    }
    
    return media;
}

