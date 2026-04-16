/**
 * Touch Optimizer Utility
 * 
 * Android cihazlarda dokunma gecikmesini azaltan utility fonksiyonları.
 * Touch event handler'larını optimize eder ve 300ms click delay'ini bypass eder.
 * 
 * Requirements: 8.5, 9.1, 9.2, 9.3, 9.5, 12.3
 */

import { isAndroid } from '../platform/platform';

/**
 * CSS injection durumu
 */
let cssInjected = false;

/**
 * Android touch optimizer CSS'ini dinamik olarak inject eder
 * 
 * Sadece Android platformunda çalışır.
 * CSS dosyasını <link> tag olarak head'e ekler.
 * 
 * Requirements: 8.5, 12.3
 * 
 * @returns CSS inject edildi mi?
 * 
 * @example
 * ```typescript
 * // Uygulama başlangıcında çağır
 * injectAndroidTouchCSS();
 * ```
 */
export function injectAndroidTouchCSS(): boolean {
  // Android değilse, CSS inject etme
  if (!isAndroid()) {
    console.log('[TouchOptimizer] Not Android, skipping CSS injection');
    return false;
  }
  
  // Zaten inject edildiyse, tekrar etme
  if (cssInjected) {
    console.log('[TouchOptimizer] CSS already injected');
    return true;
  }
  
  try {
    // CSS dosyasını <link> tag olarak ekle
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/android-touch-optimizer.css';
    link.id = 'android-touch-optimizer-css';
    
    document.head.appendChild(link);
    
    cssInjected = true;
    console.log('[TouchOptimizer] Android touch optimizer CSS injected');
    
    return true;
  } catch (error) {
    console.error('[TouchOptimizer] Failed to inject CSS:', error);
    return false;
  }
}

/**
 * Android touch optimizer CSS'ini kaldırır
 * 
 * Test ve cleanup amaçlı kullanılır.
 * 
 * @internal
 */
export function removeAndroidTouchCSS(): void {
  const link = document.getElementById('android-touch-optimizer-css');
  
  if (link) {
    link.remove();
    cssInjected = false;
    console.log('[TouchOptimizer] Android touch optimizer CSS removed');
  }
}

/**
 * Touch optimizer'ın aktif olup olmadığını kontrol eder
 * 
 * @returns Android platformunda ve CSS inject edildiyse true
 */
export function isTouchOptimizerActive(): boolean {
  return isAndroid() && cssInjected;
}

/**
 * Touch event handler tipi
 */
export type TouchEventHandler = (event: TouchEvent) => void;

/**
 * Optimized touch event handler options
 */
export interface OptimizedTouchOptions {
  /**
   * Event handler fonksiyonu
   */
  handler: TouchEventHandler;
  
  /**
   * preventDefault() çağrılsın mı?
   * Default: true (300ms delay'i bypass etmek için)
   */
  preventDefault?: boolean;
  
  /**
   * Touch response süresini ölç ve kaydet
   * Default: false
   */
  measureResponseTime?: boolean;
  
  /**
   * Response time callback (ölçüm aktifse)
   */
  onResponseTime?: (responseTime: number) => void;
}

/**
 * Touch event handler'ı optimize eder
 * 
 * - passive: false flag kullanır (preventDefault için gerekli)
 * - event.preventDefault() çağrısını 16ms içinde yapar
 * - 300ms click delay'ini bypass eder
 * - Touch response süresini ölçebilir
 * 
 * @param options - Optimization options
 * @returns Optimized event handler ve cleanup fonksiyonu
 * 
 * @example
 * ```typescript
 * const { handler, cleanup } = createOptimizedTouchHandler({
 *   handler: (event) => {
 *     console.log('Touch event:', event);
 *   },
 *   preventDefault: true,
 *   measureResponseTime: true,
 *   onResponseTime: (time) => {
 *     console.log('Response time:', time, 'ms');
 *   }
 * });
 * 
 * element.addEventListener('touchstart', handler, { passive: false });
 * 
 * // Cleanup
 * cleanup();
 * ```
 */
export function createOptimizedTouchHandler(
  options: OptimizedTouchOptions
): {
  handler: TouchEventHandler;
  cleanup: () => void;
} {
  const {
    handler,
    preventDefault = true,
    measureResponseTime = false,
    onResponseTime
  } = options;
  
  // Android değilse, normal handler döndür
  if (!isAndroid()) {
    return {
      handler,
      cleanup: () => {}
    };
  }
  
  let touchStartTime = 0;
  
  const optimizedHandler: TouchEventHandler = (event: TouchEvent) => {
    // Touch başlangıç zamanını kaydet (response time ölçümü için)
    if (measureResponseTime) {
      touchStartTime = performance.now();
    }
    
    // preventDefault() çağrısını hemen yap (16ms içinde)
    // Bu, 300ms click delay'ini bypass eder
    if (preventDefault) {
      event.preventDefault();
    }
    
    // Orijinal handler'ı çağır
    try {
      handler(event);
    } catch (error) {
      console.error('[TouchOptimizer] Handler error:', error);
    }
    
    // Response time'ı ölç ve callback'i çağır
    if (measureResponseTime && onResponseTime) {
      const responseTime = performance.now() - touchStartTime;
      
      // Response time'ı bir sonraki frame'de callback et
      // (handler execution süresini dahil etmek için)
      requestAnimationFrame(() => {
        onResponseTime(responseTime);
      });
    }
  };
  
  return {
    handler: optimizedHandler,
    cleanup: () => {
      // Cleanup logic (şu an için boş, gelecekte gerekirse kullanılabilir)
    }
  };
}

/**
 * Element'e optimized touch event listener ekler
 * 
 * @param element - Target element
 * @param eventType - Touch event tipi ('touchstart', 'touchmove', 'touchend')
 * @param options - Optimization options
 * @returns Cleanup fonksiyonu
 * 
 * @example
 * ```typescript
 * const cleanup = addOptimizedTouchListener(
 *   canvasElement,
 *   'touchstart',
 *   {
 *     handler: (event) => {
 *       console.log('Touch started');
 *     },
 *     preventDefault: true
 *   }
 * );
 * 
 * // Cleanup
 * cleanup();
 * ```
 */
export function addOptimizedTouchListener(
  element: HTMLElement,
  eventType: 'touchstart' | 'touchmove' | 'touchend',
  options: OptimizedTouchOptions
): () => void {
  // Android değilse, normal listener ekle
  if (!isAndroid()) {
    const normalHandler = options.handler;
    element.addEventListener(eventType, normalHandler);
    
    return () => {
      element.removeEventListener(eventType, normalHandler);
    };
  }
  
  // Optimized handler oluştur
  const { handler: optimizedHandler, cleanup: handlerCleanup } = 
    createOptimizedTouchHandler(options);
  
  // passive: false flag ile listener ekle
  // Bu, preventDefault() çağrısına izin verir
  element.addEventListener(eventType, optimizedHandler, { passive: false });
  
  // Cleanup fonksiyonu
  return () => {
    element.removeEventListener(eventType, optimizedHandler);
    handlerCleanup();
  };
}

/**
 * Multiple touch event listener'larını optimize eder
 * 
 * @param element - Target element
 * @param handlers - Event type ve handler map'i
 * @returns Cleanup fonksiyonu
 * 
 * @example
 * ```typescript
 * const cleanup = addMultipleOptimizedTouchListeners(
 *   canvasElement,
 *   {
 *     touchstart: {
 *       handler: (event) => console.log('Touch started'),
 *       preventDefault: true
 *     },
 *     touchmove: {
 *       handler: (event) => console.log('Touch moved'),
 *       preventDefault: true
 *     },
 *     touchend: {
 *       handler: (event) => console.log('Touch ended'),
 *       preventDefault: false
 *     }
 *   }
 * );
 * 
 * // Cleanup
 * cleanup();
 * ```
 */
export function addMultipleOptimizedTouchListeners(
  element: HTMLElement,
  handlers: Partial<Record<'touchstart' | 'touchmove' | 'touchend', OptimizedTouchOptions>>
): () => void {
  const cleanupFunctions: Array<() => void> = [];
  
  // Her event type için listener ekle
  Object.entries(handlers).forEach(([eventType, options]) => {
    if (options) {
      const cleanup = addOptimizedTouchListener(
        element,
        eventType as 'touchstart' | 'touchmove' | 'touchend',
        options
      );
      cleanupFunctions.push(cleanup);
    }
  });
  
  // Tüm cleanup fonksiyonlarını çağıran tek bir fonksiyon döndür
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}
