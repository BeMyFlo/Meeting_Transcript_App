import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(process.env.JWT_SECRET || 'default-fallback-secret-key-meeting-transcriber')
  .digest(); // 32 bytes

/**
 * Encrypt a plain text string using AES-256-CBC
 * @param {string} text - The raw text to encrypt
 * @returns {string} The encrypted text formatted as "ivHex:encryptedHex"
 */
export function encrypt(text) {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
}

/**
 * Decrypt an AES-256-CBC encrypted string
 * @param {string} encryptedText - The encrypted text formatted as "ivHex:encryptedHex"
 * @returns {string} The decrypted plain text. If decryption fails or text is not encrypted, returns original text.
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return '';
  
  // Backward compatibility: If the text doesn't contain a colon, it's not our encrypted format
  if (!encryptedText.includes(':')) {
    return encryptedText;
  }

  try {
    const [ivHex, encryptedHex] = encryptedText.split(':');
    if (!ivHex || !encryptedHex) return encryptedText;

    const iv = Buffer.from(ivHex, 'hex');
    const encryptedTextBuffer = Buffer.from(encryptedHex, 'hex');
    
    // Quick validation of hex lengths/types
    if (iv.length !== 16) {
      return encryptedText;
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    let decrypted = decipher.update(encryptedTextBuffer, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // If decryption fails (e.g. invalid signature, bad padding, or raw string that looks like it has a colon),
    // we fallback gracefully to the original string for backward compatibility.
    console.warn('Decryption failed, falling back to original text:', error.message);
    return encryptedText;
  }
}
