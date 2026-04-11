import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectDeviceInfo,
  getCachedDeviceInfo,
  clearDeviceInfoCache,
  isLowEndDevice,
  isHighEndDevice,
  getDeviceTier,
  formatDeviceInfo,
  type DeviceInfo
} from './deviceDetector';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn(() => 'android'),
    isNativePlatform: vi.fn(() => true)
  }
}));

// Mock Capacitor Device plugin
vi.mock('@capacitor/device', () => ({
  Device: {
    getId: vi.fn(() => Promise.resolve({ identifier: 'test-device-id' })),
    getInfo: vi.fn(() => Promise.resolve({
      platform: 'android',
      operatingSystem: 'android',
      osVersion: '13',
      manufacturer: 'Samsung',
      model: 'Galaxy S21',
      isVirtual: false,
      webViewVersion: '110.0.5481.153'
    })),
    getBatteryInfo: vi.fn(() => Promise.resolve({
      batteryLevel: 0.8,
      isCharging: false
    }))
  }
}));

describe('deviceDetector', () => {
  beforeEach(() => {
    clearDeviceInfoCache();
    vi.clearAllMocks();
    
    // Mock navigator properties
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      writable: true,
      configurable: true,
      value: 8
    });
    
    Object.defineProperty(navigator, 'deviceMemory', {
      writable: true,
      configurable: true,
      value: 6
    });
    
    // Mock window.screen
    Object.defineProperty(window, 'screen', {
      writable: true,
      configurable: true,
      value: {
        width: 1080,
        height: 2400
      }
    });
    
    // Mock devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 3.0
    });
    
    // Mock import.meta.env
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_APP_VERSION: '1.0.0'
        }
      }
    });
  });

  afterEach(() => {
    clearDeviceInfoCache();
  });

  describe('detectDeviceInfo', () => {
    it('should detect device information correctly', async () => {
      const deviceInfo = await detectDeviceInfo();

      expect(deviceInfo).toMatchObject({
        platform: 'android',
        osVersion: '13',
        manufacturer: 'Samsung',
        model: 'Galaxy S21',
        isVirtual: false,
        cpuCores: 8,
        memoryGB: 6,
        screenWidth: 1080,
        screenHeight: 2400,
        devicePixelRatio: 3.0,
        appVersion: '1.0.0',
        webViewVersion: '110.0.5481.153'
      });
    });

    it('should cache device info after first detection', async () => {
      const firstCall = await detectDeviceInfo();
      const secondCall = await detectDeviceInfo();

      expect(firstCall).toBe(secondCall); // Same object reference
    });

    it('should handle Device API failures gracefully', async () => {
      const { Device } = await import('@capacitor/device');
      vi.mocked(Device.getInfo).mockRejectedValueOnce(new Error('Device API failed'));

      clearDeviceInfoCache();
      const deviceInfo = await detectDeviceInfo();

      expect(deviceInfo).toBeDefined();
      // When Device API fails, it falls back to Capacitor.getPlatform() which returns 'android' in our mock
      expect(['android', 'web']).toContain(deviceInfo.platform);
      expect(deviceInfo.cpuCores).toBe(8);
      expect(deviceInfo.memoryGB).toBe(6);
    });

    it('should parse OS version correctly', async () => {
      const { Device } = await import('@capacitor/device');
      vi.mocked(Device.getInfo).mockResolvedValueOnce({
        platform: 'android',
        operatingSystem: 'android',
        osVersion: 'Android 13.0.1',
        manufacturer: 'Google',
        model: 'Pixel 7',
        isVirtual: false,
        webViewVersion: '110.0.5481.153'
      });

      clearDeviceInfoCache();
      const deviceInfo = await detectDeviceInfo();

      expect(deviceInfo.osVersion).toBe('13.0.1');
    });

    it('should use fallback values when navigator APIs are unavailable', async () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        configurable: true,
        value: undefined
      });
      
      Object.defineProperty(navigator, 'deviceMemory', {
        writable: true,
        configurable: true,
        value: undefined
      });

      clearDeviceInfoCache();
      const deviceInfo = await detectDeviceInfo();

      expect(deviceInfo.cpuCores).toBe(4); // Fallback value
      expect(deviceInfo.memoryGB).toBe(4); // Fallback value
    });

    it('should detect GPU renderer when WebGL is available', async () => {
      // Mock WebGL context
      const mockGetParameter = vi.fn((param) => {
        if (param === 37446) { // UNMASKED_RENDERER_WEBGL
          return 'Adreno (TM) 650';
        }
        return null;
      });

      const mockGetExtension = vi.fn((name) => {
        if (name === 'WEBGL_debug_renderer_info') {
          return {
            UNMASKED_RENDERER_WEBGL: 37446
          };
        }
        return null;
      });

      const mockContext = {
        getParameter: mockGetParameter,
        getExtension: mockGetExtension
      };

      HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
          return mockContext as any;
        }
        return null;
      });

      clearDeviceInfoCache();
      const deviceInfo = await detectDeviceInfo();

      expect(deviceInfo.gpuRenderer).toBe('Adreno (TM) 650');
    });

    it('should return null for GPU renderer when WebGL is unavailable', async () => {
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

      clearDeviceInfoCache();
      const deviceInfo = await detectDeviceInfo();

      expect(deviceInfo.gpuRenderer).toBeNull();
    });
  });

  describe('getCachedDeviceInfo', () => {
    it('should return null when cache is empty', () => {
      const cached = getCachedDeviceInfo();
      expect(cached).toBeNull();
    });

    it('should return cached device info after detection', async () => {
      await detectDeviceInfo();
      const cached = getCachedDeviceInfo();

      expect(cached).not.toBeNull();
      expect(cached?.platform).toBe('android');
    });
  });

  describe('clearDeviceInfoCache', () => {
    it('should clear the device info cache', async () => {
      await detectDeviceInfo();
      expect(getCachedDeviceInfo()).not.toBeNull();

      clearDeviceInfoCache();
      expect(getCachedDeviceInfo()).toBeNull();
    });
  });

  describe('isLowEndDevice', () => {
    it('should return true for devices with < 4GB RAM', () => {
      const deviceInfo: DeviceInfo = {
        platform: 'android',
        osVersion: '11',
        manufacturer: 'Samsung',
        model: 'Galaxy A10',
        isVirtual: false,
        cpuCores: 8,
        memoryGB: 3,
        gpuRenderer: 'Mali-G71',
        screenWidth: 720,
        screenHeight: 1520,
        devicePixelRatio: 2.0,
        appVersion: '1.0.0',
        webViewVersion: '100.0.0'
      };

      expect(isLowEndDevice(deviceInfo)).toBe(true);
    });

    it('should return true for devices with <= 4 CPU cores', () => {
      const deviceInfo: DeviceInfo = {
        platform: 'android',
        osVersion: '11',
        manufacturer: 'Samsung',
        model: 'Galaxy A10',
        isVirtual: false,
        cpuCores: 4,
        memoryGB: 6,
        gpuRenderer: 'Mali-G71',
        screenWidth: 720,
        screenHeight: 1520,
        devicePixelRatio: 2.0,
        appVersion: '1.0.0',
        webViewVersion: '100.0.0'
      };

      expect(isLowEndDevice(deviceInfo)).toBe(true);
    });

    it('should return false for mid-range devices', () => {
      const deviceInfo: DeviceInfo = {
        platform: 'android',
        osVersion: '12',
        manufacturer: 'Samsung',
        model: 'Galaxy A52',
        isVirtual: false,
        cpuCores: 8,
        memoryGB: 6,
        gpuRenderer: 'Adreno 618',
        screenWidth: 1080,
        screenHeight: 2400,
        devicePixelRatio: 2.5,
        appVersion: '1.0.0',
        webViewVersion: '110.0.0'
      };

      expect(isLowEndDevice(deviceInfo)).toBe(false);
    });
  });

  describe('isHighEndDevice', () => {
    it('should return true for devices with >= 6GB RAM and > 4 CPU cores', () => {
      const deviceInfo: DeviceInfo = {
        platform: 'android',
        osVersion: '13',
        manufacturer: 'Samsung',
        model: 'Galaxy S21',
        isVirtual: false,
        cpuCores: 8,
        memoryGB: 8,
        gpuRenderer: 'Adreno 660',
        screenWidth: 1080,
        screenHeight: 2400,
        devicePixelRatio: 3.0,
        appVersion: '1.0.0',
        webViewVersion: '110.0.0'
      };

      expect(isHighEndDevice(deviceInfo)).toBe(true);
    });

    it('should return false for devices with < 6GB RAM', () => {
      const deviceInfo: DeviceInfo = {
        platform: 'android',
        osVersion: '12',
        manufacturer: 'Samsung',
        model: 'Galaxy A52',
        isVirtual: false,
        cpuCores: 8,
        memoryGB: 4,
        gpuRenderer: 'Adreno 618',
        screenWidth: 1080,
        screenHeight: 2400,
        devicePixelRatio: 2.5,
        appVersion: '1.0.0',
        webViewVersion: '110.0.0'
      };

      expect(isHighEndDevice(deviceInfo)).toBe(false);
    });

    it('should return false for devices with <= 4 CPU cores', () => {
      const deviceInfo: DeviceInfo = {
        platform: 'android',
        osVersion: '12',
        manufacturer: 'Samsung',
        model: 'Galaxy A52',
        isVirtual: false,
        cpuCores: 4,
        memoryGB: 8,
        gpuRenderer: 'Adreno 618',
        screenWidth: 1080,
        screenHeight: 2400,
        devicePixelRatio: 2.5,
        appVersion: '1.0.0',
        webViewVersion: '110.0.0'
      };

      expect(isHighEndDevice(deviceInfo)).toBe(false);
    });
  });

  describe('getDeviceTier', () => {
    it('should return "low" for low-end devices', () => {
      const deviceInfo: DeviceInfo = {
        platform: 'android',
        osVersion: '11',
        manufacturer: 'Samsung',
        model: 'Galaxy A10',
        isVirtual: false,
        cpuCores: 4,
        memoryGB: 3,
        gpuRenderer: 'Mali-G71',
        screenWidth: 720,
        screenHeight: 1520,
        devicePixelRatio: 2.0,
        appVersion: '1.0.0',
        webViewVersion: '100.0.0'
      };

      expect(getDeviceTier(deviceInfo)).toBe('low');
    });

    it('should return "mid" for mid-range devices', () => {
      const deviceInfo: DeviceInfo = {
        platform: 'android',
        osVersion: '12',
        manufacturer: 'Samsung',
        model: 'Galaxy A52',
        isVirtual: false,
        cpuCores: 8,
        memoryGB: 4,
        gpuRenderer: 'Adreno 618',
        screenWidth: 1080,
        screenHeight: 2400,
        devicePixelRatio: 2.5,
        appVersion: '1.0.0',
        webViewVersion: '110.0.0'
      };

      expect(getDeviceTier(deviceInfo)).toBe('mid');
    });

    it('should return "high" for high-end devices', () => {
      const deviceInfo: DeviceInfo = {
        platform: 'android',
        osVersion: '13',
        manufacturer: 'Samsung',
        model: 'Galaxy S21',
        isVirtual: false,
        cpuCores: 8,
        memoryGB: 8,
        gpuRenderer: 'Adreno 660',
        screenWidth: 1080,
        screenHeight: 2400,
        devicePixelRatio: 3.0,
        appVersion: '1.0.0',
        webViewVersion: '110.0.0'
      };

      expect(getDeviceTier(deviceInfo)).toBe('high');
    });
  });

  describe('formatDeviceInfo', () => {
    it('should format device info as a readable string', () => {
      const deviceInfo: DeviceInfo = {
        platform: 'android',
        osVersion: '13',
        manufacturer: 'Samsung',
        model: 'Galaxy S21',
        isVirtual: false,
        cpuCores: 8,
        memoryGB: 8,
        gpuRenderer: 'Adreno 660',
        screenWidth: 1080,
        screenHeight: 2400,
        devicePixelRatio: 3.0,
        appVersion: '1.0.0',
        webViewVersion: '110.0.5481.153'
      };

      const formatted = formatDeviceInfo(deviceInfo);

      expect(formatted).toContain('Platform: android 13');
      expect(formatted).toContain('Device: Samsung Galaxy S21');
      expect(formatted).toContain('CPU: 8 cores');
      expect(formatted).toContain('RAM: 8GB');
      expect(formatted).toContain('GPU: Adreno 660');
      expect(formatted).toContain('Screen: 1080x2400 @3x');
      expect(formatted).toContain('App: v1.0.0');
      expect(formatted).toContain('WebView: 110.0.5481.153');
      expect(formatted).toContain('Virtual: No');
    });

    it('should handle null GPU renderer', () => {
      const deviceInfo: DeviceInfo = {
        platform: 'web',
        osVersion: 'unknown',
        manufacturer: 'unknown',
        model: 'unknown',
        isVirtual: false,
        cpuCores: 4,
        memoryGB: 4,
        gpuRenderer: null,
        screenWidth: 1920,
        screenHeight: 1080,
        devicePixelRatio: 1.0,
        appVersion: '1.0.0',
        webViewVersion: 'unknown'
      };

      const formatted = formatDeviceInfo(deviceInfo);

      expect(formatted).toContain('GPU: Unknown');
    });

    it('should show "Yes" for virtual devices', () => {
      const deviceInfo: DeviceInfo = {
        platform: 'android',
        osVersion: '13',
        manufacturer: 'Google',
        model: 'sdk_gphone64_arm64',
        isVirtual: true,
        cpuCores: 4,
        memoryGB: 4,
        gpuRenderer: 'SwiftShader',
        screenWidth: 1080,
        screenHeight: 2400,
        devicePixelRatio: 2.0,
        appVersion: '1.0.0',
        webViewVersion: '110.0.0'
      };

      const formatted = formatDeviceInfo(deviceInfo);

      expect(formatted).toContain('Virtual: Yes');
    });
  });
});
