/**
 * Pure JavaScript AES-256-GCM Implementation
 * Academic project - no external libraries
 * 
 * Implements:
 * - AES-256 encryption/decryption (Rijndael cipher)
 * - GCM (Galois/Counter Mode) for authenticated encryption
 * - PBKDF2 key derivation
 */

// ============================================================================
// S-BOXES AND CONSTANTS
// ============================================================================

// SubBytes S-box
const SBOX = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5e, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xd7, 0x4b, 0x55, 0xcf, 0x34, 0xc5, 0x84,
  0xcb, 0x7b, 0x34, 0xd1, 0x65, 0xb4, 0x92, 0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e,
  0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9b, 0x98, 0xf1, 0x4d, 0x27, 0xbe, 0xe3, 0xc1, 0x8a, 0xd7, 0x6e,
  0x34, 0x56, 0x78, 0x78, 0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf,
];

// Inverse S-box
const INV_SBOX = [
  0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
  0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
  0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
  0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
  0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
  0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9b, 0x98,
  0xf1, 0x4d, 0x27, 0xbe, 0xe3, 0xc1, 0x8a, 0xd7, 0x6e, 0x34, 0x56, 0x78, 0x78, 0xca, 0x82, 0xc9,
  0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 0xb7, 0xfd, 0x93,
  0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15, 0x04, 0xc7, 0x23,
  0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75, 0x09, 0x83, 0x2c,
  0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84, 0x53, 0xd1, 0x00,
  0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf, 0xd0, 0xef, 0xaa,
  0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8, 0x51, 0xa3, 0x40,
  0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 0xcd, 0x0c, 0x13,
  0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73, 0x60, 0x81, 0x4f,
  0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb, 0xe0, 0x32, 0x3a,
  0x0a, 0x49, 0x06, 0x24, 0x5e, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 0xe7, 0xc8, 0x37,
  0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08, 0xba, 0x78, 0x25,
  0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xd7, 0x4b, 0x55, 0xcf, 0x34, 0xc5, 0x84, 0xcb, 0x7b, 0x34,
];

// Rcon (round constants)
const RCON = [
  0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function rotWord(word) {
  return ((word << 8) | (word >> 24)) & 0xffffffff;
}

function subWord(word) {
  return (
    (SBOX[(word >> 24) & 0xff] << 24) ^
    (SBOX[(word >> 16) & 0xff] << 16) ^
    (SBOX[(word >> 8) & 0xff] << 8) ^
    SBOX[word & 0xff]
  );
}

function gmul(a, b) {
  let p = 0;
  for (let counter = 0; counter < 8; counter++) {
    if ((b & 1) === 1) {
      p ^= a;
    }
    const hiBitSet = (a & 0x80) === 0x80;
    a = (a << 1) & 0xff;
    if (hiBitSet) {
      a ^= 0x1b;
    }
    b >>= 1;
  }
  return p;
}

function bytesToWord(b0, b1, b2, b3) {
  return (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
}

function wordToBytes(word) {
  return [
    (word >> 24) & 0xff,
    (word >> 16) & 0xff,
    (word >> 8) & 0xff,
    word & 0xff,
  ];
}

// ============================================================================
// KEY SCHEDULE (KEY EXPANSION)
// ============================================================================

function keyExpansion(key) {
  // AES-256 uses 56 words (14 rounds + 1)
  const w = [];
  const nk = 8; // 256 bits = 8 words
  const nr = 14; // 14 rounds for AES-256

  // First Nk words are the key itself
  for (let i = 0; i < nk; i++) {
    w[i] = bytesToWord(key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]);
  }

  // Generate remaining words
  for (let i = nk; i < 4 * (nr + 1); i++) {
    let temp = w[i - 1];

    if (i % nk === 0) {
      temp = subWord(rotWord(temp)) ^ (RCON[Math.floor(i / nk) - 1] << 24);
    } else if (nk > 6 && i % nk === 4) {
      temp = subWord(temp);
    }

    w[i] = w[i - nk] ^ temp;
  }

  return w;
}

// ============================================================================
// AES CORE OPERATIONS
// ============================================================================

function subBytes(state) {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      state[i][j] = SBOX[state[i][j]];
    }
  }
}

function invSubBytes(state) {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      state[i][j] = INV_SBOX[state[i][j]];
    }
  }
}

function shiftRows(state) {
  // Row 1: shift left 1
  let temp = state[1][0];
  state[1][0] = state[1][1];
  state[1][1] = state[1][2];
  state[1][2] = state[1][3];
  state[1][3] = temp;

  // Row 2: shift left 2
  temp = state[2][0];
  state[2][0] = state[2][2];
  state[2][2] = temp;
  temp = state[2][1];
  state[2][1] = state[2][3];
  state[2][3] = temp;

  // Row 3: shift left 3 (right 1)
  temp = state[3][3];
  state[3][3] = state[3][2];
  state[3][2] = state[3][1];
  state[3][1] = state[3][0];
  state[3][0] = temp;
}

function invShiftRows(state) {
  // Row 1: shift right 1
  let temp = state[1][3];
  state[1][3] = state[1][2];
  state[1][2] = state[1][1];
  state[1][1] = state[1][0];
  state[1][0] = temp;

  // Row 2: shift right 2
  temp = state[2][0];
  state[2][0] = state[2][2];
  state[2][2] = temp;
  temp = state[2][1];
  state[2][1] = state[2][3];
  state[2][3] = temp;

  // Row 3: shift right 3
  temp = state[3][0];
  state[3][0] = state[3][1];
  state[3][1] = state[3][2];
  state[3][2] = state[3][3];
  state[3][3] = temp;
}

function mixColumns(state) {
  for (let i = 0; i < 4; i++) {
    const a0 = state[0][i];
    const a1 = state[1][i];
    const a2 = state[2][i];
    const a3 = state[3][i];

    state[0][i] = gmul(0x02, a0) ^ gmul(0x03, a1) ^ a2 ^ a3;
    state[1][i] = a0 ^ gmul(0x02, a1) ^ gmul(0x03, a2) ^ a3;
    state[2][i] = a0 ^ a1 ^ gmul(0x02, a2) ^ gmul(0x03, a3);
    state[3][i] = gmul(0x03, a0) ^ a1 ^ a2 ^ gmul(0x02, a3);
  }
}

function invMixColumns(state) {
  for (let i = 0; i < 4; i++) {
    const a0 = state[0][i];
    const a1 = state[1][i];
    const a2 = state[2][i];
    const a3 = state[3][i];

    state[0][i] = gmul(0x0e, a0) ^ gmul(0x0b, a1) ^ gmul(0x0d, a2) ^ gmul(0x09, a3);
    state[1][i] = gmul(0x09, a0) ^ gmul(0x0e, a1) ^ gmul(0x0b, a2) ^ gmul(0x0d, a3);
    state[2][i] = gmul(0x0d, a0) ^ gmul(0x09, a1) ^ gmul(0x0e, a2) ^ gmul(0x0b, a3);
    state[3][i] = gmul(0x0b, a0) ^ gmul(0x0d, a1) ^ gmul(0x09, a2) ^ gmul(0x0e, a3);
  }
}

function addRoundKey(state, roundKey) {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      state[i][j] ^= roundKey[i][j];
    }
  }
}

function bytesToState(bytes) {
  const state = [[], [], [], []];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      state[i][j] = bytes[i + 4 * j];
    }
  }
  return state;
}

function stateToBytes(state) {
  const bytes = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      bytes[i + 4 * j] = state[i][j];
    }
  }
  return bytes;
}

// ============================================================================
// AES ENCRYPTION/DECRYPTION
// ============================================================================

function aesEncryptBlock(block, expandedKey) {
  const Nr = 14; // 14 rounds for AES-256
  const state = bytesToState(block);

  // Initial round
  const roundKey0 = [];
  for (let i = 0; i < 4; i++) {
    roundKey0[i] = [];
    for (let j = 0; j < 4; j++) {
      roundKey0[i][j] = (expandedKey[4 * j] >> (8 * (3 - i))) & 0xff;
    }
  }
  addRoundKey(state, roundKey0);

  // Main rounds
  for (let round = 1; round < Nr; round++) {
    subBytes(state);
    shiftRows(state);
    mixColumns(state);

    const roundKey = [];
    for (let i = 0; i < 4; i++) {
      roundKey[i] = [];
      for (let j = 0; j < 4; j++) {
        roundKey[i][j] = (expandedKey[4 * (round * 4 + j)] >> (8 * (3 - i))) & 0xff;
      }
    }
    addRoundKey(state, roundKey);
  }

  // Final round
  subBytes(state);
  shiftRows(state);

  const finalRoundKey = [];
  for (let i = 0; i < 4; i++) {
    finalRoundKey[i] = [];
    for (let j = 0; j < 4; j++) {
      finalRoundKey[i][j] = (expandedKey[4 * (Nr * 4 + j)] >> (8 * (3 - i))) & 0xff;
    }
  }
  addRoundKey(state, finalRoundKey);

  return stateToBytes(state);
}

function aesDecryptBlock(block, expandedKey) {
  const Nr = 14; // 14 rounds for AES-256
  const state = bytesToState(block);

  // Inverse initial round (last round key)
  const invRoundKey = [];
  for (let i = 0; i < 4; i++) {
    invRoundKey[i] = [];
    for (let j = 0; j < 4; j++) {
      invRoundKey[i][j] = (expandedKey[4 * (Nr * 4 + j)] >> (8 * (3 - i))) & 0xff;
    }
  }
  addRoundKey(state, invRoundKey);

  // Main rounds (in reverse)
  for (let round = Nr - 1; round > 0; round--) {
    invShiftRows(state);
    invSubBytes(state);

    const roundKey = [];
    for (let i = 0; i < 4; i++) {
      roundKey[i] = [];
      for (let j = 0; j < 4; j++) {
        roundKey[i][j] = (expandedKey[4 * (round * 4 + j)] >> (8 * (3 - i))) & 0xff;
      }
    }
    addRoundKey(state, roundKey);
    invMixColumns(state);
  }

  // Final round
  invShiftRows(state);
  invSubBytes(state);

  const roundKey = [];
  for (let i = 0; i < 4; i++) {
    roundKey[i] = [];
    for (let j = 0; j < 4; j++) {
      roundKey[i][j] = (expandedKey[4 * j] >> (8 * (3 - i))) & 0xff;
    }
  }
  addRoundKey(state, roundKey);

  return stateToBytes(state);
}

// ============================================================================
// CTR MODE (Counter Mode)
// ============================================================================

function ctrMode(data, key, nonce) {
  const encryptedKey = keyExpansion(key);
  const blockSize = 16;
  const output = [];
  let counter = 0;

  // Create counter block (nonce + counter)
  const counterBlock = new Uint8Array(16);
  counterBlock.set(nonce);

  for (let offset = 0; offset < data.length; offset += blockSize) {
    // Set counter value (last 4 bytes)
    counterBlock[12] = (counter >> 24) & 0xff;
    counterBlock[13] = (counter >> 16) & 0xff;
    counterBlock[14] = (counter >> 8) & 0xff;
    counterBlock[15] = counter & 0xff;

    // Encrypt counter block
    const encrypted = aesEncryptBlock(Array.from(counterBlock), encryptedKey);

    // XOR with data
    const chunkSize = Math.min(blockSize, data.length - offset);
    for (let i = 0; i < chunkSize; i++) {
      output.push(data[offset + i] ^ encrypted[i]);
    }

    counter++;
  }

  return output;
}

// ============================================================================
// GCM MODE (Galois/Counter Mode)
// ============================================================================

function ghash(authData, ciphertext, h) {
  const blockSize = 16;
  let x = new Uint8Array(16);

  // Process authenticated data
  for (let i = 0; i < authData.length; i += blockSize) {
    const chunk = new Uint8Array(16);
    const chunkSize = Math.min(blockSize, authData.length - i);
    chunk.set(authData.slice(i, i + chunkSize));

    for (let j = 0; j < 16; j++) {
      x[j] ^= chunk[j];
    }
    x = gfMul(x, h);
  }

  // Process ciphertext
  for (let i = 0; i < ciphertext.length; i += blockSize) {
    const chunk = new Uint8Array(16);
    const chunkSize = Math.min(blockSize, ciphertext.length - i);
    chunk.set(ciphertext.slice(i, i + chunkSize));

    for (let j = 0; j < 16; j++) {
      x[j] ^= chunk[j];
    }
    x = gfMul(x, h);
  }

  // Length block
  const lengthBlock = new Uint8Array(16);
  const authBits = BigInt(authData.length * 8);
  const cipherBits = BigInt(ciphertext.length * 8);

  for (let i = 0; i < 8; i++) {
    lengthBlock[i] = Number((authBits >> BigInt(56 - i * 8)) & BigInt(0xff));
    lengthBlock[8 + i] = Number((cipherBits >> BigInt(56 - i * 8)) & BigInt(0xff));
  }

  for (let j = 0; j < 16; j++) {
    x[j] ^= lengthBlock[j];
  }
  x = gfMul(x, h);

  return x;
}

function gfMul(a, b) {
  const result = new Uint8Array(16);
  const r = new Uint8Array([0xe1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  let v = new Uint8Array(b);

  for (let i = 0; i < 128; i++) {
    if ((a[Math.floor(i / 8)] & (0x80 >> (i % 8))) !== 0) {
      for (let j = 0; j < 16; j++) {
        result[j] ^= v[j];
      }
    }

    let carry = (v[15] & 1) !== 0;
    for (let j = 15; j > 0; j--) {
      v[j] = ((v[j] >> 1) | ((v[j - 1] & 1) << 7)) & 0xff;
    }
    v[0] = (v[0] >> 1) & 0xff;
    if (carry) {
      for (let j = 0; j < 16; j++) {
        v[j] ^= r[j];
      }
    }
  }

  return result;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Derive a 256-bit key from a passphrase using PBKDF2
 * @param {string} passphrase - The passphrase to derive from
 * @param {Uint8Array} salt - Salt bytes (16 bytes recommended)
 * @param {number} iterations - Number of iterations (default: 100000)
 * @returns {Uint8Array} 32-byte derived key
 */
export async function deriveKey(passphrase, salt = null, iterations = 100000) {
  if (salt === null) {
    salt = new Uint8Array(16);
  }

  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);

  // PBKDF2-like key derivation using WebCrypto (minimal external use for KDF only)
  const baseKey = await crypto.subtle.importKey(
    "raw",
    passphraseBytes,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Export to raw bytes for AES operations
  const exported = await crypto.subtle.exportKey("raw", derivedKey);
  return new Uint8Array(exported);
}

// ============================================================================
// PROJECT KEY MANAGEMENT
// ============================================================================

/**
 * Static 256-bit encryption key for the entire project
 * Generated from: "iClaim-Asset-Encryption-V1" passphrase with PBKDF2
 * This is a constant key used across all components
 * Future: Can be replaced with wallet-based key derivation
 */
const STATIC_ENCRYPTION_KEY = new Uint8Array([
  0x45, 0x1a, 0x73, 0xb2, 0x9c, 0x48, 0xf6, 0xe1,
  0xd2, 0x8f, 0x5a, 0x64, 0x3b, 0x7e, 0x19, 0xac,
  0x8d, 0x42, 0xc5, 0x76, 0x91, 0x2e, 0xff, 0x4d,
  0x67, 0x38, 0xb0, 0x22, 0xa9, 0x53, 0x15, 0xce,
]);

/**
 * Get the static encryption key for the project
 * This key is used for all encryption/decryption operations unless a specific key is provided
 * @returns {Uint8Array} 32-byte static encryption key
 */
export function getProjectEncryptionKey() {
  return new Uint8Array(STATIC_ENCRYPTION_KEY);
}

/**
 * Derive encryption key from wallet address (for future use)
 * @param {string} walletAddress - User's wallet address (e.g., Solana public key)
 * @returns {Promise<Uint8Array>} 32-byte derived encryption key
 */
export async function getWalletEncryptionKey(walletAddress) {
  if (!walletAddress) {
    throw new Error("Wallet address required for wallet-based key derivation");
  }

  const encoder = new TextEncoder();
  const walletBytes = encoder.encode(walletAddress);
  const staticSalt = new Uint8Array(16); // Static salt for deterministic derivation

  return await deriveKey(walletAddress, staticSalt, 100000);
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

/**
 * Encrypt data with AES-256-GCM
 * @param {Uint8Array|ArrayBuffer} plaintext - Data to encrypt
 * @param {Uint8Array} key - 32-byte AES-256 key
 * @param {Uint8Array} nonce - 12-byte nonce/IV
 * @param {Uint8Array} additionalData - Optional authenticated data (default: empty)
 * @returns {Object} {ciphertext: Uint8Array, authTag: Uint8Array}
 */
export function encrypt(plaintext, key, nonce, additionalData = new Uint8Array()) {
  if (!(plaintext instanceof Uint8Array)) {
    plaintext = new Uint8Array(plaintext);
  }
  if (key.length !== 32) {
    throw new Error("Key must be 32 bytes for AES-256");
  }
  if (nonce.length !== 12) {
    throw new Error("Nonce must be 12 bytes");
  }

  // Expand key
  const expandedKey = keyExpansion(Array.from(key));

  // Encrypt using CTR mode
  const ciphertext = new Uint8Array(ctrMode(plaintext, Array.from(key), nonce));

  // Generate authentication tag (last 16 bytes of GHASH output)
  // First, get H = E_K(0^128)
  const zeroBlock = new Uint8Array(16);
  const encryptedZero = aesEncryptBlock(Array.from(zeroBlock), expandedKey);
  const h = new Uint8Array(encryptedZero);

  // Compute GHASH
  const tag = ghash(additionalData, ciphertext, h);
  const authTag = tag.slice(0, 16);

  // Generate counter for final CTR block (increment counter)
  const counterBlockFinal = new Uint8Array(16);
  counterBlockFinal.set(nonce);
  const encryptedCounter = aesEncryptBlock(Array.from(counterBlockFinal), expandedKey);

  // Mask auth tag with encrypted counter
  for (let i = 0; i < 16; i++) {
    authTag[i] ^= encryptedCounter[i];
  }

  return {
    ciphertext: ciphertext,
    authTag: authTag,
  };
}

/**
 * Decrypt data with AES-256-GCM
 * @param {Uint8Array} ciphertext - Encrypted data
 * @param {Uint8Array} authTag - 16-byte authentication tag
 * @param {Uint8Array} key - 32-byte AES-256 key
 * @param {Uint8Array} nonce - 12-byte nonce/IV
 * @param {Uint8Array} additionalData - Optional authenticated data (default: empty)
 * @returns {Uint8Array} Decrypted plaintext
 * @throws {Error} If authentication tag verification fails
 */
export function decrypt(ciphertext, authTag, key, nonce, additionalData = new Uint8Array()) {
  if (!(ciphertext instanceof Uint8Array)) {
    ciphertext = new Uint8Array(ciphertext);
  }
  if (key.length !== 32) {
    throw new Error("Key must be 32 bytes for AES-256");
  }
  if (nonce.length !== 12) {
    throw new Error("Nonce must be 12 bytes");
  }
  if (authTag.length !== 16) {
    throw new Error("Authentication tag must be 16 bytes");
  }

  // Expand key
  const expandedKey = keyExpansion(Array.from(key));

  // Get H = E_K(0^128)
  const zeroBlock = new Uint8Array(16);
  const encryptedZero = aesEncryptBlock(Array.from(zeroBlock), expandedKey);
  const h = new Uint8Array(encryptedZero);

  // Compute GHASH for verification
  const computedTag = ghash(additionalData, ciphertext, h);
  const computedAuthTag = computedTag.slice(0, 16);

  // Generate counter for final CTR block
  const counterBlockFinal = new Uint8Array(16);
  counterBlockFinal.set(nonce);
  const encryptedCounter = aesEncryptBlock(Array.from(counterBlockFinal), expandedKey);

  // Unmask computed tag
  for (let i = 0; i < 16; i++) {
    computedAuthTag[i] ^= encryptedCounter[i];
  }

  // Verify authentication tag
  let tagValid = true;
  for (let i = 0; i < 16; i++) {
    if (computedAuthTag[i] !== authTag[i]) {
      tagValid = false;
      break;
    }
  }

  if (!tagValid) {
    throw new Error("Authentication tag verification failed");
  }

  // Decrypt using CTR mode
  const plaintext = new Uint8Array(ctrMode(ciphertext, Array.from(key), nonce));

  return plaintext;
}

/**
 * Format: IV (12 bytes) + Ciphertext + AuthTag (16 bytes)
 * Encrypt with deterministic IV from content hash
 * @param {Uint8Array} data - Data to encrypt
 * @param {Uint8Array} key - 32-byte AES-256 key
 * @returns {Uint8Array} IV + Ciphertext + AuthTag
 */
export async function encryptData(data, key) {
  // Compute SHA-256 hash of data for deterministic IV
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const nonce = new Uint8Array(hashBuffer.slice(0, 12));

  const { ciphertext, authTag } = encrypt(data, key, nonce);

  // Combine: nonce (12) + ciphertext + authTag (16)
  const result = new Uint8Array(12 + ciphertext.length + 16);
  result.set(nonce, 0);
  result.set(ciphertext, 12);
  result.set(authTag, 12 + ciphertext.length);

  return result;
}

/**
 * Decrypt with format: IV (12 bytes) + Ciphertext + AuthTag (16 bytes)
 * @param {Uint8Array} encryptedData - IV + Ciphertext + AuthTag
 * @param {Uint8Array} key - 32-byte AES-256 key
 * @returns {Uint8Array} Decrypted data
 */
export function decryptData(encryptedData, key) {
  const nonce = encryptedData.slice(0, 12);
  const authTag = encryptedData.slice(encryptedData.length - 16);
  const ciphertext = encryptedData.slice(12, encryptedData.length - 16);

  return decrypt(ciphertext, authTag, key, nonce);
}
