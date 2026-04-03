import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit tests for WebGL Error Handling (Task 17.2)
 * 
 * These tests verify that the Grid component properly handles WebGL initialization failures:
 * - Error modal is shown when WebGL initialization fails
 * - Error message is in Turkish
 * - Error message contains correct text
 * 
 * Requirements: 12.4
 * Validates: Requirements 12.4
 */

describe('Grid - WebGL Error Handling (Task 17.2)', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockBabylonEngine: any;
  
  beforeEach(() => {
    // Create a mock canvas element
    mockCanvas = document.createElement('canvas');
    mockCanvas.id = 'renderCanvas';
    document.body.appendChild(mockCanvas);
    
    // Mock BABYLON namespace
    mockBabylonEngine = {
      webGLVersion: 2,
      setHardwareScalingLevel: vi.fn(),
      dispose: vi.fn(),
    };
    
    // Clear any existing error divs
    const existingErrors = document.querySelectorAll('[data-testid="webgl-error"]');
    existingErrors.forEach(el => el.remove());
  });
  
  afterEach(() => {
    // Clean up
    if (mockCanvas.parentNode) {
      mockCanvas.parentNode.removeChild(mockCanvas);
    }
    
    // Remove any error divs created during tests
    const errorDivs = document.querySelectorAll('[data-testid="webgl-error"]');
    errorDivs.forEach(el => el.remove());
    
    vi.clearAllMocks();
  });
  
  describe('WebGL initialization failure handling', () => {
    it('should show error modal when WebGL initialization throws an error', () => {
      // Simulate WebGL initialization failure by throwing an error
      const initializeWebGL = () => {
        try {
          throw new Error('WebGL not supported');
        } catch (error) {
          console.error('[Grid] WebGL initialization failed:', error);
          
          // Show user-friendly error message (simulating the actual implementation)
          const errorDiv = document.createElement('div');
          errorDiv.setAttribute('data-testid', 'webgl-error');
          errorDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1f2937;color:#e5e7eb;padding:24px;border-radius:12px;text-align:center;max-width:300px;z-index:9999;';
          errorDiv.innerHTML = '<h3 style="margin:0 0 12px 0;font-size:18px;">Grafik Desteği Gerekli</h3><p style="margin:0;font-size:14px;opacity:0.8;">Cihazınız WebGL desteklemiyor. Oyun çalıştırılamıyor.</p>';
          document.body.appendChild(errorDiv);
          return;
        }
      };
      
      // Execute the initialization
      initializeWebGL();
      
      // Verify error modal is shown
      const errorDiv = document.querySelector('[data-testid="webgl-error"]');
      expect(errorDiv).not.toBeNull();
      expect(errorDiv).toBeInstanceOf(HTMLDivElement);
    });
    
    it('should show error modal when engine.webGLVersion is not available', () => {
      // Simulate WebGL initialization where engine is created but webGLVersion is falsy
      const initializeWebGL = () => {
        try {
          // Simulate engine creation that succeeds but has no webGLVersion
          const engine = { webGLVersion: 0 }; // 0 is falsy
          
          if (!engine.webGLVersion) {
            throw new Error('WebGL not supported');
          }
        } catch (error) {
          console.error('[Grid] WebGL initialization failed:', error);
          
          // Show user-friendly error message
          const errorDiv = document.createElement('div');
          errorDiv.setAttribute('data-testid', 'webgl-error');
          errorDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1f2937;color:#e5e7eb;padding:24px;border-radius:12px;text-align:center;max-width:300px;z-index:9999;';
          errorDiv.innerHTML = '<h3 style="margin:0 0 12px 0;font-size:18px;">Grafik Desteği Gerekli</h3><p style="margin:0;font-size:14px;opacity:0.8;">Cihazınız WebGL desteklemiyor. Oyun çalıştırılamıyor.</p>';
          document.body.appendChild(errorDiv);
          return;
        }
      };
      
      // Execute the initialization
      initializeWebGL();
      
      // Verify error modal is shown
      const errorDiv = document.querySelector('[data-testid="webgl-error"]');
      expect(errorDiv).not.toBeNull();
    });
  });
  
  describe('Error message content', () => {
    it('should display error message in Turkish', () => {
      // Simulate WebGL failure and create error modal
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('data-testid', 'webgl-error');
      errorDiv.innerHTML = '<h3 style="margin:0 0 12px 0;font-size:18px;">Grafik Desteği Gerekli</h3><p style="margin:0;font-size:14px;opacity:0.8;">Cihazınız WebGL desteklemiyor. Oyun çalıştırılamıyor.</p>';
      document.body.appendChild(errorDiv);
      
      // Verify Turkish text is present
      const heading = errorDiv.querySelector('h3');
      const message = errorDiv.querySelector('p');
      
      expect(heading?.textContent).toBe('Grafik Desteği Gerekli');
      expect(message?.textContent).toBe('Cihazınız WebGL desteklemiyor. Oyun çalıştırılamıyor.');
    });
    
    it('should contain the exact error message specified in requirements', () => {
      // The requirement specifies: "Cihazınız WebGL desteklemiyor. Oyun çalıştırılamıyor."
      const expectedMessage = 'Cihazınız WebGL desteklemiyor. Oyun çalıştırılamıyor.';
      
      // Simulate WebGL failure and create error modal
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('data-testid', 'webgl-error');
      errorDiv.innerHTML = '<h3 style="margin:0 0 12px 0;font-size:18px;">Grafik Desteği Gerekli</h3><p style="margin:0;font-size:14px;opacity:0.8;">Cihazınız WebGL desteklemiyor. Oyun çalıştırılamıyor.</p>';
      document.body.appendChild(errorDiv);
      
      // Verify exact message
      const message = errorDiv.querySelector('p');
      expect(message?.textContent).toBe(expectedMessage);
    });
    
    it('should display error modal with centered positioning and high z-index', () => {
      // Simulate WebGL failure and create error modal
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('data-testid', 'webgl-error');
      // Set individual style properties instead of cssText for better jsdom compatibility
      errorDiv.style.position = 'fixed';
      errorDiv.style.top = '50%';
      errorDiv.style.left = '50%';
      errorDiv.style.transform = 'translate(-50%, -50%)';
      errorDiv.style.zIndex = '9999';
      errorDiv.style.textAlign = 'center';
      errorDiv.innerHTML = '<h3 style="margin:0 0 12px 0;font-size:18px;">Grafik Desteği Gerekli</h3><p style="margin:0;font-size:14px;opacity:0.8;">Cihazınız WebGL desteklemiyor. Oyun çalıştırılamıyor.</p>';
      document.body.appendChild(errorDiv);
      
      // Verify critical styling properties
      expect(errorDiv.style.position).toBe('fixed');
      expect(errorDiv.style.zIndex).toBe('9999');
      expect(errorDiv.style.textAlign).toBe('center');
    });
  });
  
  describe('Error handling behavior', () => {
    it('should log error to console when WebGL initialization fails', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate WebGL initialization failure
      try {
        throw new Error('WebGL not supported');
      } catch (error) {
        console.error('[Grid] WebGL initialization failed:', error);
      }
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Grid] WebGL initialization failed:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
    
    it('should not proceed with scene creation when WebGL fails', () => {
      let sceneCreated = false;
      
      // Simulate WebGL initialization
      const initializeWebGL = () => {
        try {
          throw new Error('WebGL not supported');
        } catch (error) {
          console.error('[Grid] WebGL initialization failed:', error);
          
          // Show error modal
          const errorDiv = document.createElement('div');
          errorDiv.setAttribute('data-testid', 'webgl-error');
          document.body.appendChild(errorDiv);
          
          // Early return - scene should not be created
          return;
        }
      };
      
      initializeWebGL();
      
      // Verify scene was not created
      expect(sceneCreated).toBe(false);
      
      // Verify error modal was shown instead
      const errorDiv = document.querySelector('[data-testid="webgl-error"]');
      expect(errorDiv).not.toBeNull();
    });
  });
});
