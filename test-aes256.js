/**
 * Test script for AES-256-GCM implementation
 * Tests basic encrypt/decrypt functionality
 */

import { deriveKey, encrypt, decrypt, encryptData, decryptData } from './src/utils/aes256gcm.js';

async function runTests() {
  console.log('=== AES-256-GCM Implementation Test ===\n');

  try {
    // Test 1: Key Derivation
    console.log('Test 1: Key Derivation');
    const passphrase = "test-passphrase";
    const salt = new Uint8Array(16);
    const key = await deriveKey(passphrase, salt, 100000);
    console.log(`✓ Key derived: ${key.length} bytes`);
    console.log(`  Key (hex): ${Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('')}\n`);

    // Test 2: Basic Encryption/Decryption
    console.log('Test 2: Basic Encryption/Decryption');
    const plaintext = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const nonce = new Uint8Array(12);
    
    const { ciphertext, authTag } = encrypt(plaintext, key, nonce);
    console.log(`✓ Encrypted: ${ciphertext.length} bytes`);
    console.log(`  Auth tag: ${Array.from(authTag).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)}...`);
    
    const decrypted = decrypt(ciphertext, authTag, key, nonce);
    const match = plaintext.every((val, idx) => val === decrypted[idx]);
    console.log(`✓ Decrypted: ${match ? 'MATCHES ORIGINAL' : 'FAILED'}\n`);

    // Test 3: High-level encryptData/decryptData
    console.log('Test 3: High-level API (encryptData/decryptData)');
    const testData = new Uint8Array([65, 66, 67, 68, 69]); // "ABCDE"
    const encryptedData = await encryptData(testData, key);
    console.log(`✓ Encrypted data: ${encryptedData.length} bytes (IV+Cipher+Tag)`);
    
    const decryptedData = decryptData(encryptedData, key);
    const highMatch = testData.every((val, idx) => val === decryptedData[idx]);
    console.log(`✓ Decrypted: ${highMatch ? 'MATCHES ORIGINAL' : 'FAILED'}\n`);

    // Test 4: Large Data
    console.log('Test 4: Large Data Encryption');
    const largeData = new Uint8Array(10000);
    for (let i = 0; i < largeData.length; i++) {
      largeData[i] = i % 256;
    }
    const largeEncrypted = await encryptData(largeData, key);
    const largeDecrypted = decryptData(largeEncrypted, key);
    const largeMatch = largeData.every((val, idx) => val === largeDecrypted[idx]);
    console.log(`✓ Large data (10KB): ${largeMatch ? 'MATCHES ORIGINAL' : 'FAILED'}\n`);

    // Test 5: Determinism Check
    console.log('Test 5: Deterministic Encryption (same input = same output)');
    const testInput = new Uint8Array([42, 43, 44]);
    const enc1 = await encryptData(testInput, key);
    const enc2 = await encryptData(testInput, key);
    const deterministic = enc1.every((val, idx) => val === enc2[idx]);
    console.log(`✓ Deterministic: ${deterministic ? 'YES (same output)' : 'NO (different output)'}\n`);

    // Test 6: Auth Tag Verification
    console.log('Test 6: Authentication Tag Verification');
    const authTest = new Uint8Array([10, 20, 30, 40]);
    const authEncrypted = await encryptData(authTest, key);
    
    // Corrupt the ciphertext
    authEncrypted[20] ^= 0xFF; // Flip bits
    
    try {
      decryptData(authEncrypted, key);
      console.log(`✗ Auth tag check FAILED (should have thrown error)\n`);
    } catch (err) {
      console.log(`✓ Auth tag verification works: ${err.message}\n`);
    }

    console.log('=== All Tests Complete ===');

  } catch (err) {
    console.error('Test failed:', err);
    console.error(err.stack);
  }
}

// Run tests
runTests();
