# Media Utility

The media utility provides helper functions to convert various media formats (URLs, base64, file uploads) to `whatsapp-web.js` MessageMedia objects with auto-detection of MIME types and support for stickers, voice messages, and HD flag.

## Features

- Convert media from URLs, base64 strings, or local file paths
- Auto-detect MIME types using file signatures and extensions
- Support for sticker conversion (image files only)
- Support for voice message conversion (audio files only)
- HD quality flag support
- File size validation
- Custom filename support
- Comprehensive error handling

## Usage

### Basic Usage

```typescript
import { toMessageMedia, createValidatedMedia } from '../utils/media';

// From URL
const mediaFromUrl = await toMessageMedia('https://example.com/image.jpg');

// From base64
const mediaFromBase64 = await toMessageMedia('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/GgAJ8wFwAAAAASUVORK5CYII=');

// From file path
const mediaFromFile = await toMessageMedia('./path/to/file.png');
```

### Advanced Usage with Options

```typescript
import { createValidatedMedia, MediaConversionOptions } from '../utils/media';

const options: MediaConversionOptions = {
  isSticker: true,
  filename: 'my-sticker.webp',
  maxSize: 1024 * 1024, // 1MB
};

const sticker = await createValidatedMedia('./sticker.png', options);
```

### Voice Message

```typescript
const voiceOptions: MediaConversionOptions = {
  isVoice: true,
  mimetype: 'audio/ogg',
};

const voiceMessage = await createValidatedMedia('./audio.ogg', voiceOptions);
```

## API Reference

### Functions

- `toMessageMedia(media: string, options?: MediaConversionOptions): Promise<MessageMedia>`
- `fromUrl(url: string, options?: MediaConversionOptions): Promise<MessageMedia>`
- `fromBase64(base64Data: string, options?: MediaConversionOptions): MessageMedia`
- `fromFilePath(filePath: string, options?: MediaConversionOptions): MessageMedia`
- `createValidatedMedia(data: string, options?: MediaConversionOptions): Promise<MessageMedia>`
- `isStickerSupported(mimetype: string): boolean`
- `isVoiceSupported(mimetype: string): boolean`
- `getMediaType(mimetype: string): 'image' | 'audio' | 'video' | 'document'`

### MediaConversionOptions

```typescript
interface MediaConversionOptions {
  isSticker?: boolean;     // Send media as sticker
  isVoice?: boolean;       // Send audio as voice message
  isHD?: boolean;          // Send media in HD quality
  filename?: string;       // Custom filename
  mimetype?: string;       // Custom MIME type (overrides auto-detection)
  maxSize?: number;        // Maximum file size in bytes
}
```

## Supported File Types

### Stickers
- PNG (`image/png`)
- JPEG (`image/jpeg`, `image/jpg`)
- WebP (`image/webp`)

### Voice Messages
- MP3 (`audio/mpeg`, `audio/mp3`)
- OGG (`audio/ogg`)
- WAV (`audio/wav`)
- M4A (`audio/m4a`)

### Auto-detected MIME Types
- GIF (`image/gif`)
- PNG (`image/png`)
- JPEG (`image/jpeg`)
- PDF (`application/pdf`)
- ZIP (`application/zip`)
- MP3 (`audio/mp3`)
- MP4 (`video/mp4`)
- BMP (`image/bmp`)
- WAV (`audio/wav`)
- ICO (`image/x-icon`)
- SVG (`image/svg+xml`)

## Examples

See `src/examples/media.example.ts` for comprehensive usage examples.

## Error Handling

The utility provides detailed error messages for:
- Invalid media formats
- Network errors when fetching from URLs
- File not found errors
- Unsupported media types for stickers/voice
- File size exceeded limits
