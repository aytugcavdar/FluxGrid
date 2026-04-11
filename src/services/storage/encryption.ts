/**
 * Data Encryption
 * 
 * Provides AES-GCM encryption/decryption using Web Crypto API
 * for sensitive data storage.
 * 
 * Requirements: 7.5, 12.7
 */

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  algorithm: 'AES-GCM';
  keyLength: 128 | 192 | 256;
  ivLength: number; // bytes
  saltLength: number; // bytes
  iterations: number; // PBKDF2 iterations
}

// Default configuration
const DEFAULT_CONFIG: EncryptionConfig = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12, // 96 bits recommended for AES-GCM
  saltLength: 16, // 128 bits
  iterations: 100000, // PBKDF2 iterations
};

/**
 * Encryption error
 */
export class EncryptionError extends Error {
  constructor(message: string, public code: 'ENCRYPTION_FAILED' | 'DECRYPTION_FAILED' | 'KEY_DERIVATION_FAILED') {
    super(message);
    this.name = 'EncryptionError';
  }
}

/**
 * Encryption Service
 * Handles data encryption and decryption using Web Crypto API
 */
export class EncryptionService {
  private config: EncryptionConfig;
  private masterKey: CryptoKey | null = null;
  private isWebCryptoAvailable: boolean = false;

  constructor(config: Partial<EncryptionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isWebCryptoAvailable = typeof window !== 'undefined' && !!window.crypto && !!window.crypto.subtle;
  }

  /**
   * Initialize encryption service with master password
   */
  public async initialize(password: string): Promise<void> {
    if (!this.isWebCryptoAvailable) {
      throw new EncryptionError('Web Crypto API not available', 'KEY_DERIVATION_FAILED');
    }

    try {
      // Derive master key from password
      this.masterKey = await this.deriveKey(password);
    } catch (error) {
      throw new EncryptionError('Failed to derive master key', 'KEY_DERIVATION_FAILED');
    }
  }

  /**
   * Encrypt data
   */
  public async encrypt(data: string): Promise<string> {
    if (!this.isWebCryptoAvailable) {
      // Fallback: return base64 encoded data (not secure, but better than nothing)
      console.warn('[Encryption] Web Crypto API not available, using base64 encoding');
      return btoa(data);
    }

    if (!this.masterKey) {
      throw new EncryptionError('Encryption service not initialized', 'ENCRYPTION_FAILED');
    }

    try {
      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(this.config.ivLength));

      // Encode data
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);

      // Encrypt
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: this.config.algorithm,
          iv,
        },
        this.masterKey,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Convert to base64
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      throw new EncryptionError('Encryption failed', 'ENCRYPTION_FAILED');
    }
  }

  /**
   * Decrypt data
   */
  public async decrypt(encryptedData: string): Promise<string> {
    if (!this.isWebCryptoAvailable) {
      // Fallback: decode base64
      console.warn('[Encryption] Web Crypto API not available, using base64 decoding');
      return atob(encryptedData);
    }

    if (!this.masterKey) {
      throw new EncryptionError('Encryption service not initialized', 'DECRYPTION_FAILED');
    }

    try {
      // Convert from base64
      const combined = this.base64ToArrayBuffer(encryptedData);

      // Extract IV and encrypted data
      const iv = combined.slice(0, this.config.ivLength);
      const data = combined.slice(this.config.ivLength);

      // Decrypt
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: this.config.algorithm,
          iv,
        },
        this.masterKey,
        data
      );

      // Decode data
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      throw new EncryptionError('Decryption failed', 'DECRYPTION_FAILED');
    }
  }

  /**
   * Encrypt object (serializes to JSON first)
   */
  public async encryptObject<T = any>(obj: T): Promise<string> {
    const json = JSON.stringify(obj);
    return this.encrypt(json);
  }

  /**
   * Decrypt object (deserializes from JSON)
   */
  public async decryptObject<T = any>(encryptedData: string): Promise<T> {
    const json = await this.decrypt(encryptedData);
    return JSON.parse(json);
  }

  /**
   * Check if encryption is available
   */
  public isAvailable(): boolean {
    return this.isWebCryptoAvailable;
  }

  /**
   * Check if initialized
   */
  public isInitialized(): boolean {
    return this.masterKey !== null;
  }

  // Private methods

  /**
   * Derive encryption key from password using PBKDF2
   */
  private async deriveKey(password: string): Promise<CryptoKey> {
    // Generate or retrieve salt
    const salt = await this.getSalt();

    // Import password as key material
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive key using PBKDF2
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.config.iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: this.config.algorithm,
        length: this.config.keyLength,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Get or generate salt
   */
  private async getSalt(): Promise<Uint8Array> {
    const SALT_KEY = 'fluxgrid_encryption_salt';

    // Try to retrieve existing salt
    const storedSalt = localStorage.getItem(SALT_KEY);
    if (storedSalt) {
      return this.base64ToArrayBuffer(storedSalt);
    }

    // Generate new salt
    const salt = window.crypto.getRandomValues(new Uint8Array(this.config.saltLength));

    // Store salt
    localStorage.setItem(SALT_KEY, this.arrayBufferToBase64(salt));

    return salt;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * Simple encryption helpers (for quick use)
 */
export class SimpleEncryption {
  private static service: EncryptionService | null = null;
  private static defaultPassword = 'fluxgrid_default_key_2024'; // Should be replaced with user-specific key

  /**
   * Initialize with default password
   */
  private static async ensureInitialized(): Promise<void> {
    if (!this.service) {
      this.service = new EncryptionService();
      await this.service.initialize(this.defaultPassword);
    }
  }

  /**
   * Encrypt string
   */
  public static async encrypt(data: string): Promise<string> {
    await this.ensureInitialized();
    return this.service!.encrypt(data);
  }

  /**
   * Decrypt string
   */
  public static async decrypt(encryptedData: string): Promise<string> {
    await this.ensureInitialized();
    return this.service!.decrypt(encryptedData);
  }

  /**
   * Encrypt object
   */
  public static async encryptObject<T = any>(obj: T): Promise<string> {
    await this.ensureInitialized();
    return this.service!.encryptObject(obj);
  }

  /**
   * Decrypt object
   */
  public static async decryptObject<T = any>(encryptedData: string): Promise<T> {
    await this.ensureInitialized();
    return this.service!.decryptObject(encryptedData);
  }

  /**
   * Set custom password
   */
  public static async setPassword(password: string): Promise<void> {
    this.service = new EncryptionService();
    await this.service.initialize(password);
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
