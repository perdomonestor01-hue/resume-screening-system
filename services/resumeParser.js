const fs = require('fs').promises;
const pdfParse = require('pdf-parse-fork');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');

/**
 * Resume Parser Service
 * Extracts text content from PDF, DOCX, DOC, TXT, JPG, and PNG files
 */
class ResumeParser {
  /**
   * Parse resume file and extract text content
   * @param {string} filePath - Path to the resume file
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<Object>} - Parsed resume data
   */
  async parseResume(filePath, mimeType) {
    try {
      let text = '';
      let metadata = {};

      if (mimeType === 'application/pdf') {
        const result = await this.parsePDF(filePath);
        text = result.text;
        metadata = result.metadata;
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        const result = await this.parseDOCX(filePath);
        text = result.text;
        metadata = result.metadata;
      } else if (mimeType === 'text/plain') {
        text = await this.parseTXT(filePath);
      } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/png') {
        const result = await this.parseImage(filePath);
        text = result.text;
        metadata = result.metadata;
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Extract basic information from the text
      const extractedInfo = this.extractBasicInfo(text);

      return {
        text: text.trim(),
        metadata,
        ...extractedInfo,
        success: true
      };
    } catch (error) {
      console.error('Error parsing resume:', error);
      return {
        text: '',
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Parse PDF file with enhanced error handling
   */
  async parsePDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);

      // Try parsing with pdf-parse-fork
      try {
        const data = await pdfParse(dataBuffer);
        return {
          text: data.text,
          metadata: {
            pages: data.numpages,
            info: data.info
          }
        };
      } catch (parseError) {
        console.warn('PDF parsing failed, attempting fallback method:', parseError.message);

        // Fallback: Try with stricter options
        const data = await pdfParse(dataBuffer, {
          max: 0, // Parse all pages
          version: 'v1.10.100' // Use specific version
        });

        return {
          text: data.text,
          metadata: {
            pages: data.numpages,
            info: data.info,
            parsedWithFallback: true
          }
        };
      }
    } catch (error) {
      console.error('All PDF parsing methods failed:', error.message);
      throw new Error(`Failed to parse PDF: ${error.message}. The PDF may be corrupted or use an unsupported format. Please try converting it to a different format or re-saving it.`);
    }
  }

  /**
   * Parse DOCX/DOC file
   */
  async parseDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });

    return {
      text: result.value,
      metadata: {
        messages: result.messages
      }
    };
  }

  /**
   * Parse TXT file
   */
  async parseTXT(filePath) {
    const text = await fs.readFile(filePath, 'utf-8');
    return text;
  }

  /**
   * Parse Image file (JPG/PNG) using OCR
   */
  async parseImage(filePath) {
    console.log(`🖼️  Processing image with OCR: ${filePath}`);

    try {
      const result = await Tesseract.recognize(
        filePath,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      console.log('✅ OCR completed successfully');

      return {
        text: result.data.text,
        metadata: {
          confidence: result.data.confidence,
          ocr: true
        }
      };
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  }

  /**
   * Extract basic information from resume text
   * Uses simple pattern matching to find common resume elements
   */
  extractBasicInfo(text) {
    const info = {
      name: null,
      email: null,
      phone: null,
      address: null
    };

    // Extract email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      info.email = emailMatch[0];
    }

    // Extract phone number (various formats)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      info.phone = phoneMatch[0];
    }

    // Extract name (usually first line or near top, before email)
    // This is a simple heuristic - the first non-empty line that's not too long
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (let line of lines.slice(0, 5)) {
      // Look for a name-like line (2-4 words, not too long, no special chars)
      if (line.length < 50 && !line.includes('@') && !line.match(/\d{3}/)) {
        const words = line.split(/\s+/);
        if (words.length >= 2 && words.length <= 4) {
          info.name = line;
          break;
        }
      }
    }

    // Extract address
    info.address = this.extractAddress(text);

    return info;
  }

  /**
   * Extract address from resume text using multiple patterns
   * @param {string} text - Resume text
   * @returns {string|null} - Extracted address or null
   */
  extractAddress(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Pattern 1: Full US address with street, city, state, ZIP
    const fullAddressPattern = /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|court|ct|circle|cir|boulevard|blvd|parkway|pkwy)[,\s]+[\w\s]+,\s*[A-Z]{2}\s+\d{5}(-\d{4})?/i;

    // Pattern 2: City, State ZIP
    const cityStateZipPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s+(\d{5}(-\d{4})?)/;

    // Pattern 3: Street address on one line, city/state/ZIP on next
    const streetPattern = /^\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|court|ct|circle|cir|boulevard|blvd|parkway|pkwy)/i;

    // Check first 20 lines for address patterns (typically in header)
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i];

      // Check for full address in single line
      const fullMatch = line.match(fullAddressPattern);
      if (fullMatch) {
        return fullMatch[0].trim();
      }

      // Check for city, state, ZIP
      const cityStateMatch = line.match(cityStateZipPattern);
      if (cityStateMatch) {
        // Check if previous line has street address
        if (i > 0 && streetPattern.test(lines[i - 1])) {
          return (lines[i - 1] + ', ' + cityStateMatch[0]).trim();
        }
        return cityStateMatch[0].trim();
      }

      // Check for multi-line address (street on one line, city/state/ZIP on next)
      if (i < lines.length - 1) {
        const combinedLines = line + ', ' + lines[i + 1];
        const combinedMatch = combinedLines.match(fullAddressPattern);
        if (combinedMatch) {
          return combinedMatch[0].trim();
        }

        // Check if this line is a street and next line has city/state/ZIP
        if (streetPattern.test(line)) {
          const nextLineMatch = lines[i + 1].match(cityStateZipPattern);
          if (nextLineMatch) {
            return (line + ', ' + nextLineMatch[0]).trim();
          }
        }
      }
    }

    // Fallback: Look for any city, state, ZIP combination (less precise)
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const cityStateMatch = lines[i].match(cityStateZipPattern);
      if (cityStateMatch) {
        console.log(`📍 Found address (city/state/ZIP only): ${cityStateMatch[0]}`);
        return cityStateMatch[0].trim();
      }
    }

    return null;
  }

  /**
   * Validate if a string looks like a valid US address
   * @param {string} address - Address to validate
   * @returns {boolean}
   */
  isValidAddress(address) {
    if (!address || address.length < 5) return false;

    // Check for US state abbreviations
    const hasStateAbbr = /\b[A-Z]{2}\b/.test(address);
    // Check for ZIP code
    const hasZip = /\d{5}(-\d{4})?/.test(address);
    // Check for common street indicators
    const hasStreet = /(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|court|ct|circle|cir|boulevard|blvd|parkway|pkwy)/i.test(address);

    // A valid address should have at least state + ZIP or all three components
    return (hasStateAbbr && hasZip) || (hasStateAbbr && hasStreet && hasZip);
  }

  /**
   * Validate file before parsing
   */
  validateFile(file) {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB default
    const allowedExtensions = (process.env.ALLOWED_EXTENSIONS || '.pdf,.docx,.doc,.txt').split(',');

    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${maxSize / 1048576}MB limit` };
    }

    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return { valid: false, error: `File type ${ext} not allowed. Allowed: ${allowedExtensions.join(', ')}` };
    }

    return { valid: true };
  }
}

module.exports = new ResumeParser();
