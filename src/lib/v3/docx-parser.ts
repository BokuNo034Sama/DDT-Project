import mammoth from "mammoth";
import unzipper from "unzipper";
import tesseract from "tesseract.js";

/**
 * Extracts raw text and HTML from a .docx buffer using mammoth.
 */
export async function extractTextFromDocx(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  const htmlResult = await mammoth.convertToHtml({ buffer });
  
  return {
    text: result.value,
    html: htmlResult.value,
    messages: result.messages
  };
}

/**
 * Extracts tables from the HTML representation of the .docx.
 * Mammoth converts Word tables to standard HTML <table> tags.
 */
export async function extractTablesFromDocx(htmlContent: string) {
  // Simple regex-based extraction for table content.
  // In a robust implementation, a proper HTML parser (like jsdom or cheerio) should be used.
  const tables: string[] = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let match;

  while ((match = tableRegex.exec(htmlContent)) !== null) {
    // Clean up HTML tags inside the table to get a raw text representation or keep HTML
    // We will keep HTML for the AI to parse structural data.
    tables.push(match[0]);
  }

  return tables;
}

/**
 * Extracts images from the .docx buffer by unzipping the archive,
 * finding the media files, and running OCR on them via Tesseract.
 */
export async function extractImagesWithOcr(buffer: Buffer) {
  const directory = await unzipper.Open.buffer(buffer);
  
  // Find files in word/media/
  const mediaFiles = directory.files.filter((f) => f.path.startsWith("word/media/"));
  
  const ocrResults: { filename: string; text: string }[] = [];

  for (const file of mediaFiles) {
    const fileBuffer = await file.buffer();
    
    try {
      // Run OCR on the image buffer
      const { data: { text } } = await tesseract.recognize(fileBuffer, 'eng');
      if (text.trim()) {
        ocrResults.push({
          filename: file.path,
          text: text.trim(),
        });
      }
    } catch (error) {
      console.warn(`Failed to OCR image ${file.path}:`, error);
    }
  }

  return ocrResults;
}

export async function parseDocxComprehensive(buffer: Buffer) {
  // 1. Get Text & HTML
  const { text, html } = await extractTextFromDocx(buffer);
  
  // 2. Extract Tables from HTML
  const tables = await extractTablesFromDocx(html);
  
  // 3. Extract Images and perform OCR
  // Note: This could be time consuming depending on the number of images.
  const imageOcrText = await extractImagesWithOcr(buffer);

  return {
    rawText: text,
    html,
    tables,
    imageOcrText,
  };
}
