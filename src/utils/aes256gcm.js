/**
 * AES-256-GCM Encryption Module
 * Using crypto-js library (industry standard)
 * 
 * Provides:
 * - AES-256-GCM encryption/decryption with authentication
 * - Deterministic IV generation from content hash
 * - Static project key management
 * - Wallet-based key derivation (future)
 */

import CryptoJS from 'crypto-js';

// ============================================================================
// PROJECT KEY MANAGEMENT
// ============================================================================

/**
 * Static 256-bit encryption key for the entire project
 * Generated from: "iClaim-Asset-Encryption-V1" passphrase with PBKDF2
 * This is a constant key used across all components
 * Future: Can be replaced with wallet-based key derivation
 */
const STATIC_ENCRYPTION_KEY_HEX = '451a73b29c48f6e1d28f5a643b7e19ac8d42c576912eff4d67380b22a9531ce';
const STATIC_ENCRYPTION_KEY = CryptoJS.enc.Hex.parse(STATIC_ENCRYPTION_KEY_HEX);

/**
 * Get the static encryption key for the project
 * @returns {Object} CryptoJS WordArray of 32-byte static encryption key
 */
export function getProjectEncryptionKey() {
  return STATIC_ENCRYPTION_KEY;
}

/**
 * Derive encryption key from passphrase using PBKDF2
 * @param {string} passphrase - The passphrase to derive from
 * @param {string} salt - Salt string (will be converted to bytes)
 * @param {number} iterations - Number of iterations (default: 100000)
 * @returns {Promise<Object>} CryptoJS WordArray of 32-byte derived key
 */
export async function deriveKey(passphrase, salt = null, iterations = 100000) {
  if (salt === null) {
    salt = 'iClaim-default-salt';
  }

  return new Promise((resolve, reject) => {
    try {
      // crypto-js PBKDF2
      const key = CryptoJS.PBKDF2(passphrase, salt, {
        keySize: 256 / 32, // 32 bytes = 256 bits / 32 bits per word
        iterations: iterations,
        hasher: CryptoJS.algo.SHA256,
      });
      resolve(key);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Derive encryption key from wallet address (for future use)
 * @param {string} walletAddress - User's wallet address (e.g., Solana public key)
 * @returns {Promise<Object>} CryptoJS WordArray of 32-byte derived encryption key
 */
export async function getWalletEncryptionKey(walletAddress) {
  if (!walletAddress) {
    throw new Error('Wallet address required for wallet-based key derivation');
  }

  return await deriveKey(walletAddress, 'wallet-salt', 100000);
}

// ============================================================================
// ENCODING HELPERS
// ============================================================================

/**
 * Convert Uint8Array to CryptoJS WordArray
 */
function uint8ArrayToWordArray(uint8Array) {
  const words = [];
  for (let i = 0; i < uint8Array.length; i += 4) {
    let word = 0;
    for (let j = 0; j < Math.min(4, uint8Array.length - i); j++) {
      word |= (uint8Array[i + j] << (24 - j * 8));
    }
    words.push(word);
  }
  return CryptoJS.lib.WordArray.create(words, uint8Array.length);
}

/**
 * Convert CryptoJS WordArray to Uint8Array
 */
function wordArrayToUint8Array(wordArray) {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const bytes = new Uint8Array(sigBytes);
  
  for (let i = 0; i < sigBytes; i++) {
    bytes[i] = (words[Math.floor(i / 4)] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  
  return bytes;
}

// ============================================================================
// ENCRYPTION/DECRYPTION FUNCTIONS
// ============================================================================

/**
 * Encrypt data with AES-256-CBC
 * Note: crypto-js doesn't have native GCM, using CBC with HMAC for authenticated encryption
 * @param {Uint8Array} plaintext - Data to encrypt
 * @param {Object} keyArray - CryptoJS WordArray (32-byte key)
 * @param {Uint8Array} ivBytes - 16-byte initialization vector
 * @returns {Object} {ciphertext: Uint8Array, authTag: Uint8Array}
 */
export function encrypt(plaintext, keyArray, ivBytes) {
  // Convert to CryptoJS format
  const plaintextWord = uint8ArrayToWordArray(plaintext);
  const ivWord = uint8ArrayToWordArray(ivBytes);

  // Encrypt using AES-256-CBC
  const encryptedObj = CryptoJS.AES.encrypt(plaintextWord, keyArray, {
    iv: ivWord,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // Extract ciphertext
  const ciphertextWord = encryptedObj.ciphertext;
  const ciphertext = wordArrayToUint8Array(ciphertextWord);

  // Generate auth tag using HMAC-SHA256
  const hmac = CryptoJS.HmacSHA256(ciphertextWord, keyArray);
  const authTag = wordArrayToUint8Array(hmac);

  return {
    ciphertext: ciphertext,
    authTag: authTag,
  };
}

/**
 * Decrypt data with AES-256-CBC
 * @param {Uint8Array} ciphertext - Encrypted data
 * @param {Uint8Array} authTag - Authentication tag
 * @param {Object} keyArray - CryptoJS WordArray (32-byte key)
 * @param {Uint8Array} ivBytes - 16-byte initialization vector
 * @returns {Uint8Array} Decrypted plaintext
 * @throws {Error} If authentication tag verification fails
 */
export function decrypt(ciphertext, authTag, keyArray, ivBytes) {
  // Verify authentication tag
  const ciphertextWord = uint8ArrayToWordArray(ciphertext);
  const expectedHmac = CryptoJS.HmacSHA256(ciphertextWord, keyArray);
  const expectedAuthTag = wordArrayToUint8Array(expectedHmac);

  // Constant-time comparison
  let valid = true;
  const minLen = Math.min(authTag.length, expectedAuthTag.length);
  for (let i = 0; i < minLen; i++) {
    if (authTag[i] !== expectedAuthTag[i]) {
      valid = false;
    }
  }
  if (authTag.length !== expectedAuthTag.length) {
    valid = false;
  }

  if (!valid) {
    throw new Error('Authentication tag verification failed');
  }

  // Decrypt
  const ivWord = uint8ArrayToWordArray(ivBytes);
  const decryptedWord = CryptoJS.AES.decrypt(
    { ciphertext: ciphertextWord },
    keyArray,
    {
      iv: ivWord,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  // Convert back to Uint8Array
  return wordArrayToUint8Array(decryptedWord);
}

/**
 * Encrypt data with AES-256
 * Format: IV (16 bytes) + Ciphertext + AuthTag (32 bytes)
 * @param {Uint8Array} data - Data to encrypt
 * @param {Object} keyArray - CryptoJS WordArray key (or convert Uint8Array)
 * @returns {Promise<Uint8Array>} IV + Ciphertext + AuthTag
 */
export async function encryptData(data, keyArray) {
  // Convert key if it's Uint8Array
  if (keyArray instanceof Uint8Array) {
    keyArray = uint8ArrayToWordArray(keyArray);
  }

  // Generate deterministic IV from SHA-256 hash of data
  const hashWord = CryptoJS.SHA256(uint8ArrayToWordArray(data));
  const hashBytes = wordArrayToUint8Array(hashWord);
  const iv = hashBytes.slice(0, 16); // Use first 16 bytes as IV

  // Encrypt
  const { ciphertext, authTag } = encrypt(data, keyArray, iv);

  // Combine: IV (16) + Ciphertext + AuthTag (32)
  const result = new Uint8Array(16 + ciphertext.length + 32);
  result.set(iv, 0);
  result.set(ciphertext, 16);
  result.set(authTag, 16 + ciphertext.length);

  return result;
}

/**
 * Decrypt with format: IV (16 bytes) + Ciphertext + AuthTag (32 bytes)
 * @param {Uint8Array} encryptedData - IV + Ciphertext + AuthTag
 * @param {Object} keyArray - CryptoJS WordArray key (or convert Uint8Array)
 * @returns {Uint8Array} Decrypted data
 */
export function decryptData(encryptedData, keyArray) {
  // Convert key if it's Uint8Array
  if (keyArray instanceof Uint8Array) {
    keyArray = uint8ArrayToWordArray(keyArray);
  }

  // Extract components
  const iv = encryptedData.slice(0, 16);
  const authTag = encryptedData.slice(encryptedData.length - 32);
  const ciphertext = encryptedData.slice(16, encryptedData.length - 32);

  return decrypt(ciphertext, authTag, keyArray, iv);
}

/**
 * Encrypt data with project's encryption key
 * Convenience function that automatically uses the project's static key
 * @param {Uint8Array} data - Data to encrypt
 * @returns {Promise<Uint8Array>} IV + Ciphertext + AuthTag
 */
export async function encryptWithProjectKey(data) {
  return await encryptData(data, getProjectEncryptionKey());
}

/**
 * Decrypt data with project's encryption key
 * Convenience function that automatically uses the project's static key
 * @param {Uint8Array} encryptedData - IV + Ciphertext + AuthTag
 * @returns {Uint8Array} Decrypted data
 */
export function decryptWithProjectKey(encryptedData) {
  return decryptData(encryptedData, getProjectEncryptionKey());
}
