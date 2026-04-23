/**
 * Nonce Generator
 * 
 * Generates cryptographically random nonces for replay attack prevention.
 * Each nonce is unique and used only once for score submissions.
 * 
 * Requirements: 2.1, 2.8
 */

/**
 * Generate a cryptographically random nonce
 * 
 * Uses Web Crypto API to generate 128 bits (16 bytes) of random data,
 * then converts to hexadecimal string (32 characters).
 * 
 * @returns 32-character hexadecimal nonce string
 * 
 * @example
 * const nonce = generateNonce();
 * // Returns: "a1b2c3d4e5f6789012345678901234ab"
 */
export function generateNonce(): string {
  // Generate 128 bits (16 bytes) of random data
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  
  // Convert to hexadecimal string (32 characters)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate nonce format
 * 
 * Checks if a string is a valid nonce (32 hex characters).
 * 
 * @param nonce - The nonce string to validate
 * @returns true if valid, false otherwise
 */
export function isValidNonce(nonce: string): boolean {
  // Must be exactly 32 characters
  if (nonce.length !== 32) {
    return false;
  }
  
  // Must contain only hexadecimal characters (0-9, a-f)
  const hexPattern = /^[0-9a-f]{32}$/;
  return hexPattern.test(nonce);
}
