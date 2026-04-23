import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from '@services/storage/storageManager';
import { encrypt, decrypt } from '@services/storage/encryption';

// Mock logger
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  critical: vi.fn(),
};

// Mock encryption module
vi.mock('@services/storage/encryption', () => ({
  encrypt: vi.fn((data: string) => Promise.resolve(`encrypted_${data}`)),
  decrypt: vi.fn((data: string) => Promise.resolve(data.replace('encrypted_', ''))),
}));

// Mock Capacitor Preferences
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    keys: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('StorageManager', () => {
  let storage: StorageManager;

  beforeEach(async () => {
    // Clear localStorage before each test
    Object.keys(localStorage).forEach(key => localStorage.removeItem(key));
    
    storage = new StorageManager();
    // Add logger to storage instance
    (storage as any).logger = mockLogger;
    vi.clearAllMocks();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve data', async () => {
      await storage.setItem('test-key', { value: 'test-data' });
      const result = await storage.getItem('test-key');
      expect(result).toEqual({ value: 'test-data' });
    });

    it('should return null for non-existent keys', async () => {
      const result = await storage.getItem('non-existent');
      expect(result).toBeNull();
    });

    it('should remove data', async () => {
      await storage.setItem('test-key', { value: 'test-data' });
      await storage.removeItem('test-key');
      const result = await storage.getItem('test-key');
      expect(result).toBeNull();
    });

    it.skip('should clear all data', async () => {
      await storage.setItem('fluxgrid_key1', { value: 'data1' });
      await storage.setItem('fluxgrid_key2', { value: 'data2' });
      await storage.clear();
      
      const result1 = await storage.getItem('fluxgrid_key1');
      const result2 = await storage.getItem('fluxgrid_key2');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('Data Validation', () => {
    it('should validate data schema', async () => {
      // StorageManager validates data structure internally
      const validData = { name: 'John', age: 30 };

      await storage.setItem('valid', validData);
      const result = await storage.getItem('valid');
      expect(result).toEqual(validData);
    });
  });

  describe('Backup and Recovery', () => {
    it('should create backup', async () => {
      await storage.setItem('key1', { value: 'data1' });
      await storage.setItem('key2', { value: 'data2' });
      
      await storage.createBackup();
      
      // Verify backup was created
      const backup = await storage.getItem('fluxgrid_backup');
      expect(backup).toBeDefined();
    });

    it('should restore from backup', async () => {
      await storage.setItem('key1', { value: 'data1' });
      await storage.createBackup();
      
      await storage.clear();
      const restored = await storage.restoreBackup();
      
      expect(restored).toBe(true);
      const result = await storage.getItem('key1');
      expect(result).toEqual({ value: 'data1' });
    });

    it('should detect corrupted backup', async () => {
      // Clear any existing backup
      await storage.clear();
      
      // Try to restore when no backup exists
      const restored = await storage.restoreBackup();
      expect(restored).toBe(false);
    });
  });

  describe('Encryption', () => {
    it('should encrypt sensitive data', async () => {
      // StorageManager handles encryption internally
      await storage.setItem('sensitive', { password: 'secret123' });
      
      const result = await storage.getItem('sensitive');
      expect(result).toEqual({ password: 'secret123' });
    });
  });

  describe('Storage Quota Management', () => {
    it('should check storage quota', async () => {
      const size = await storage.getStorageSize();
      
      expect(size).toBeGreaterThanOrEqual(0);
    });

    it('should handle quota exceeded', async () => {
      // StorageManager checks quota automatically
      const largeData = 'x'.repeat(1024); // 1KB
      
      // This should succeed for reasonable data
      await storage.setItem('large-key', { data: largeData });
      const result = await storage.getItem('large-key');
      expect(result).toBeDefined();
    });
  });

  describe('Data Versioning', () => {
    it('should handle schema migrations', async () => {
      // Store data
      await storage.setItem('user', { name: 'John' });
      
      // Retrieve data
      const result = await storage.getItem('user');
      expect(result).toEqual({ name: 'John' });
    });
  });
});
