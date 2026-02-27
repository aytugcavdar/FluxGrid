import { LayoutConfig } from '../types';
import { RESPONSIVE_BREAKPOINTS } from '../constants';

class ResponsiveManager {
  private currentBreakpoint: 'MOBILE' | 'TABLET' | 'DESKTOP' = 'DESKTOP';
  private currentOrientation: 'PORTRAIT' | 'LANDSCAPE' = 'LANDSCAPE';
  private listeners: Set<(config: LayoutConfig) => void> = new Set();
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.detectBreakpoint();
    this.detectOrientation();
    this.setupListeners();
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;

    // Listen for resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Listen for orientation change
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    // Modern orientation API
    if (screen.orientation) {
      screen.orientation.addEventListener('change', this.handleOrientationChange.bind(this));
    }
  }

  private handleResize() {
    const oldBreakpoint = this.currentBreakpoint;
    this.detectBreakpoint();
    
    if (oldBreakpoint !== this.currentBreakpoint) {
      this.notifyListeners();
    }
  }

  private handleOrientationChange() {
    const oldOrientation = this.currentOrientation;
    this.detectOrientation();
    
    if (oldOrientation !== this.currentOrientation) {
      this.notifyListeners();
    }
  }

  private detectBreakpoint() {
    const width = window.innerWidth;
    
    if (width < RESPONSIVE_BREAKPOINTS.MOBILE) {
      this.currentBreakpoint = 'MOBILE';
    } else if (width < RESPONSIVE_BREAKPOINTS.TABLET) {
      this.currentBreakpoint = 'TABLET';
    } else {
      this.currentBreakpoint = 'DESKTOP';
    }
  }

  private detectOrientation() {
    if (window.innerWidth > window.innerHeight) {
      this.currentOrientation = 'LANDSCAPE';
    } else {
      this.currentOrientation = 'PORTRAIT';
    }
  }

  private notifyListeners() {
    const config = this.getLayoutConfig();
    this.listeners.forEach(listener => listener(config));
  }

  getLayoutConfig(): LayoutConfig {
    const isMobile = this.currentBreakpoint === 'MOBILE';
    const isPortrait = this.currentOrientation === 'PORTRAIT';
    
    // Calculate optimal sizes
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let gridSize: number;
    let pieceSize: number;
    let spacing: number;
    
    if (isMobile) {
      // Mobile layout
      if (isPortrait) {
        gridSize = Math.min(viewportWidth * 0.9, 400);
        pieceSize = gridSize / 10;
        spacing = 8;
      } else {
        gridSize = Math.min(viewportHeight * 0.7, 400);
        pieceSize = gridSize / 10;
        spacing = 6;
      }
    } else {
      // Desktop/Tablet layout
      gridSize = Math.min(viewportWidth * 0.5, viewportHeight * 0.7, 500);
      pieceSize = gridSize / 10;
      spacing = 12;
    }
    
    return {
      gridSize,
      pieceSize,
      spacing,
      orientation: this.currentOrientation
    };
  }

  isMobile(): boolean {
    return this.currentBreakpoint === 'MOBILE';
  }

  isTablet(): boolean {
    return this.currentBreakpoint === 'TABLET';
  }

  isDesktop(): boolean {
    return this.currentBreakpoint === 'DESKTOP';
  }

  isPortrait(): boolean {
    return this.currentOrientation === 'PORTRAIT';
  }

  isLandscape(): boolean {
    return this.currentOrientation === 'LANDSCAPE';
  }

  getBreakpoint(): 'MOBILE' | 'TABLET' | 'DESKTOP' {
    return this.currentBreakpoint;
  }

  getOrientation(): 'PORTRAIT' | 'LANDSCAPE' {
    return this.currentOrientation;
  }

  // Subscribe to layout changes
  subscribe(callback: (config: LayoutConfig) => void) {
    this.listeners.add(callback);
    // Immediately call with current config
    callback(this.getLayoutConfig());
  }

  unsubscribe(callback: (config: LayoutConfig) => void) {
    this.listeners.delete(callback);
  }

  // Calculate if element should be hidden on small screens
  shouldHideElement(elementType: 'secondary' | 'tertiary'): boolean {
    if (this.currentBreakpoint === 'MOBILE') {
      return true; // Hide all non-essential elements on mobile
    }
    if (this.currentBreakpoint === 'TABLET' && elementType === 'tertiary') {
      return true; // Hide tertiary elements on tablet
    }
    return false;
  }

  // Get CSS classes for responsive behavior
  getResponsiveClasses(): string[] {
    const classes: string[] = [];
    
    classes.push(`breakpoint-${this.currentBreakpoint.toLowerCase()}`);
    classes.push(`orientation-${this.currentOrientation.toLowerCase()}`);
    
    if (this.isMobile()) {
      classes.push('is-mobile');
    }
    
    return classes;
  }

  // Calculate grid scale to fit viewport
  calculateGridScale(): number {
    const config = this.getLayoutConfig();
    const maxSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.8);
    const baseSize = 500; // Base grid size
    
    return Math.min(1, maxSize / baseSize);
  }

  // Get safe area insets (for notched devices)
  getSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
    const style = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(style.getPropertyValue('--sat') || '0'),
      right: parseInt(style.getPropertyValue('--sar') || '0'),
      bottom: parseInt(style.getPropertyValue('--sab') || '0'),
      left: parseInt(style.getPropertyValue('--sal') || '0')
    };
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize.bind(this));
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    if (screen.orientation) {
      screen.orientation.removeEventListener('change', this.handleOrientationChange.bind(this));
    }
    
    this.listeners.clear();
  }
}

// Singleton instance
let responsiveInstance: ResponsiveManager | null = null;

export function getResponsiveManager(): ResponsiveManager {
  if (!responsiveInstance) {
    responsiveInstance = new ResponsiveManager();
  }
  return responsiveInstance;
}

export function destroyResponsiveManager() {
  if (responsiveInstance) {
    responsiveInstance.destroy();
    responsiveInstance = null;
  }
}
