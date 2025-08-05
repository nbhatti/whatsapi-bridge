
import { createValidatedMedia, MediaConversionOptions } from '../utils/media';
import * as fs from 'fs';

/**
 * Example usage of the media utility.
 */
async function runMediaExamples() {
  // --- Example 1: Convert a remote image URL to a MessageMedia object ---
  try {
    console.log('--- Running Example 1: Remote Image URL ---');
    const imageUrl = 'https://via.placeholder.com/150';
    const imageMedia = await createValidatedMedia(imageUrl, { filename: 'placeholder.jpg' });
    console.log('Image from URL:', {
      mimetype: imageMedia.mimetype,
      filename: imageMedia.filename,
      data: imageMedia.data.substring(0, 30) + '...',
    });
  } catch (error: any) {
    console.error('Error in Example 1:', error.message);
  }

  // --- Example 2: Convert a local file to a MessageMedia sticker ---
  try {
    console.log('\n--- Running Example 2: Local File as Sticker ---');
    const stickerPath = './path/to/your/sticker.png'; // Replace with your actual file path
    const stickerOptions: MediaConversionOptions = { isSticker: true, filename: 'my-sticker.webp' };
    
    // Create a dummy file for demonstration
    if (!fs.existsSync(stickerPath)) {
        const dummyData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/GgAJ8wFwAAAAASUVORK5CYII=';
        fs.writeFileSync(stickerPath, Buffer.from(dummyData, 'base64'));
    }
    
    const stickerMedia = await createValidatedMedia(stickerPath, stickerOptions);
    console.log('Sticker from local file:', {
      mimetype: stickerMedia.mimetype,
      filename: stickerMedia.filename,
      data: stickerMedia.data.substring(0, 30) + '...',
    });
  } catch (error: any) {
    console.error('Error in Example 2:', error.message);
  }

  // --- Example 3: Convert a base64 string to a voice message ---
  try {
    console.log('\n--- Running Example 3: Base64 as Voice Message ---');
    // A dummy base64 string for an audio file
    const audioBase64 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    const voiceOptions: MediaConversionOptions = { isVoice: true, mimetype: 'audio/mp3' };
    const voiceMedia = await createValidatedMedia(audioBase64, voiceOptions);
    console.log('Voice message from base64:', {
      mimetype: voiceMedia.mimetype,
      filename: voiceMedia.filename,
      data: voiceMedia.data.substring(0, 30) + '...',
    });
  } catch (error: any) {
    console.error('Error in Example 3:', error.message);
  }

  // --- Example 4: Handle an unsupported media type for stickers ---
  try {
    console.log('\n--- Running Example 4: Unsupported Sticker Type ---');
    const unsupportedStickerPath = './path/to/your/document.pdf'; // Replace with an actual file
    
    if (!fs.existsSync(unsupportedStickerPath)) {
        const dummyData = 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PC9UeXBlIC9DYXRhbG9nL1BhZ2VzIDIgMCBSL0xhbmcgKGVuLVVTKSAvU3RydWN0VHJlZVJvb3QgMyAwIFIvTWFya0luZm8gPDwvTWFya2VkIHRydWU+Pj4+CmVuZG9iago=';
        fs.writeFileSync(unsupportedStickerPath, Buffer.from(dummyData, 'base64'));
    }

    await createValidatedMedia(unsupportedStickerPath, { isSticker: true });
  } catch (error: any) {
    console.error('Error in Example 4:', error.message);
  }
}

// Run the examples
runMediaExamples();

