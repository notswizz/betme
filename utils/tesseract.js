import Tesseract from 'tesseract.js';

export async function extractText(imageFile) {
  try {
    console.log('Starting text extraction...');
    
    const result = await Tesseract.recognize(
      imageFile,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`Recognition progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    console.log('Raw extracted text:', result.data.text);
    
    // Enhanced betting-specific text cleanup
    let text = result.data.text
      .trim()
      // Clean whitespace
      .replace(/\s+/g, ' ')
      // Format common betting patterns
      .replace(/(\d+)\s*-\s*(\d+)/g, '$1-$2')
      .replace(/([+-]\d{3,})/g, '$1')
      .replace(/\$\s*(\d+\.?\d*)/g, '$$$1')
      .replace(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/g, '$1')
      .replace(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/g, '$1')
      // Common betting terms
      .replace(/\b(spread|moneyline|over\/under|o\/u|ml|pts)\b/gi, match => match.toLowerCase())
      // Team names cleanup
      .replace(/\b(vs\.|vs|versus)\b/gi, 'vs')
      // Split and rejoin lines
      .split('\n')
      .filter(line => line.trim())
      .join('\n');

    console.log('Formatted text:', text);
    return text;
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to process image');
  }
} 