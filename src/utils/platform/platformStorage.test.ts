/**
 * Tests for platform-specific localStorage utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPlatformKey, getPlatformItem, setPlatformItem, removePlatformItem } from './platformStorage';
import * as platform from './platform';

describe('platformStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getPlatformKey', () => {
    it('should prefix key with android platform', () => {
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: true,
        isIOS: false,
        isWeb: false,
        platform: 'android'
      });

      const key = getPlatformKey('fps-limit');
      expect(key).toBe('android:fps-limit');
    });

    it('should prefix key with web platform', () => {
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: false,
        isIOS: false,
        isWeb: true,
        platform: 'web'
      });

      const key = getPlatformKey('fps-limit');
      expect(key).toBe('web:fps-limit');
    });

    it('should prefix key with ios platform', () => {
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: false,
        isIOS: true,
        isWeb: false,
        platform: 'ios'
      });

      const key = getPlatformKey('fps-limit');
      expect(key).toBe('ios:fps-limit');
    });
  });

  describe('getPlatformItem', () => {
    it('should get item with platform-specific key', () => {
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: true,
        isIOS: false,
        isWeb: false,
        platform: 'android'
      });

      localStorage.setItem('android:fps-limit', '30');
      
      const value = getPlatformItem('fps-limit');
      expect(value).toBe('30');
    });

    it('should return null if item does not exist', () => {
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: true,
        isIOS: false,
        isWeb: false,
        platform: 'android'
      });

      const value = getPlatformItem('non-existent');
      expect(value).toBeNull();
    });

    it('should not get item from different platform', () => {
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: true,
        isIOS: false,
        isWeb: false,
        platform: 'android'
      });

      // Set item for web platform
      localStorage.setItem('web:fps-limit', '60');
      
      // Try to get as android platform
      const value = getPlatformItem('fps-limit');
      expect(value).toBeNull();
    });
  });

  describe('setPlatformItem', () => {
    it('should set item with platform-specific key', () => {
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: true,
        isIOS: false,
        isWeb: false,
        platform: 'android'
      });

      setPlatformItem('fps-limit', '30');
      
      const stored = localStorage.getItem('android:fps-limit');
      expect(stored).toBe('30');
    });

    it('should not affect other platform settings', () => {
      // Set web platform setting
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: false,
        isIOS: false,
        isWeb: true,
        platform: 'web'
      });
      setPlatformItem('fps-limit', '60');

      // Set android platform setting
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: true,
        isIOS: false,
        isWeb: false,
        platform: 'android'
      });
      setPlatformItem('fps-limit', '30');

      // Verify both exist independently
      expect(localStorage.getItem('web:fps-limit')).toBe('60');
      expect(localStorage.getItem('android:fps-limit')).toBe('30');
    });
  });

  describe('removePlatformItem', () => {
    it('should remove item with platform-specific key', () => {
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: true,
        isIOS: false,
        isWeb: false,
        platform: 'android'
      });

      localStorage.setItem('android:fps-limit', '30');
      removePlatformItem('fps-limit');
      
      const stored = localStorage.getItem('android:fps-limit');
      expect(stored).toBeNull();
    });

    it('should not remove item from different platform', () => {
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: true,
        isIOS: false,
        isWeb: false,
        platform: 'android'
      });

      // Set items for both platforms
      localStorage.setItem('web:fps-limit', '60');
      localStorage.setItem('android:fps-limit', '30');

      // Remove android item
      removePlatformItem('fps-limit');

      // Verify only android item was removed
      expect(localStorage.getItem('android:fps-limit')).toBeNull();
      expect(localStorage.getItem('web:fps-limit')).toBe('60');
    });
  });

  describe('Platform isolation', () => {
    it('should keep Android and web settings completely separate', () => {
      // Android user sets 30 FPS
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: true,
        isIOS: false,
        isWeb: false,
        platform: 'android'
      });
      setPlatformItem('fps-limit', '30');

      // Web user sets 60 FPS
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: false,
        isIOS: false,
        isWeb: true,
        platform: 'web'
      });
      setPlatformItem('fps-limit', '60');

      // Verify Android gets 30
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: true,
        isIOS: false,
        isWeb: false,
        platform: 'android'
      });
      expect(getPlatformItem('fps-limit')).toBe('30');

      // Verify Web gets 60
      vi.spyOn(platform, 'detectPlatform').mockReturnValue({
        isAndroid: false,
        isIOS: false,
        isWeb: true,
        platform: 'web'
      });
      expect(getPlatformItem('fps-limit')).toBe('60');
    });
  });
});
