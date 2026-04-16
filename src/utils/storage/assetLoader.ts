/**
 * Asset Loader with Lazy Loading Support
 * 
 * Loads assets on-demand to reduce initial load time and memory usage.
 * Requirements: 5.7
 */

export type AssetType = 'image' | 'audio' | 'json' | 'font';

export interface AssetConfig {
  id: string;
  type: AssetType;
  url: string;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  preload?: boolean;
}

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentAsset?: string;
}

export type ProgressCallback = (progress: LoadProgress) => void;

export class AssetLoader {
  private assets: Map<string, any> = new Map();
  private loading: Map<string, Promise<any>> = new Map();
  private config: Map<string, AssetConfig> = new Map();
  private loadedCount: number = 0;
  private totalCount: number = 0;
  private progressCallbacks: ProgressCallback[] = [];
  
  /**
   * Register assets for lazy loading
   * @param configs Array of asset configurations
   */
  register(configs: AssetConfig[]): void {
    configs.forEach(config => {
      this.config.set(config.id, config);
      this.totalCount++;
    });
  }
  
  /**
   * Preload critical assets
   * @returns Promise that resolves when all critical assets are loaded
   */
  async preloadCritical(): Promise<void> {
    const criticalAssets = Array.from(this.config.values())
      .filter(config => config.priority === 'critical' || config.preload === true);
    
    await Promise.all(
      criticalAssets.map(config => this.load(config.id))
    );
  }
  
  /**
   * Load an asset by ID
   * @param id Asset ID
   * @returns Promise that resolves with the loaded asset
   */
  async load(id: string): Promise<any> {
    // Return cached asset if already loaded
    if (this.assets.has(id)) {
      return this.assets.get(id);
    }
    
    // Return existing loading promise if already loading
    if (this.loading.has(id)) {
      return this.loading.get(id);
    }
    
    // Get asset config
    const config = this.config.get(id);
    if (!config) {
      throw new Error(`Asset not registered: ${id}`);
    }
    
    // Start loading
    const loadPromise = this.loadAsset(config);
    this.loading.set(id, loadPromise);
    
    try {
      const asset = await loadPromise;
      this.assets.set(id, asset);
      this.loading.delete(id);
      this.loadedCount++;
      this.notifyProgress(id);
      return asset;
    } catch (error) {
      this.loading.delete(id);
      throw error;
    }
  }
  
  /**
   * Load multiple assets
   * @param ids Array of asset IDs
   * @returns Promise that resolves when all assets are loaded
   */
  async loadMultiple(ids: string[]): Promise<any[]> {
    return Promise.all(ids.map(id => this.load(id)));
  }
  
  /**
   * Load assets by priority
   * @param priority Priority level
   * @returns Promise that resolves when all assets of given priority are loaded
   */
  async loadByPriority(priority: 'critical' | 'high' | 'normal' | 'low'): Promise<void> {
    const assets = Array.from(this.config.values())
      .filter(config => config.priority === priority);
    
    await Promise.all(
      assets.map(config => this.load(config.id))
    );
  }
  
  /**
   * Load asset based on type
   */
  private async loadAsset(config: AssetConfig): Promise<any> {
    switch (config.type) {
      case 'image':
        return this.loadImage(config.url);
      case 'audio':
        return this.loadAudio(config.url);
      case 'json':
        return this.loadJSON(config.url);
      case 'font':
        return this.loadFont(config.url);
      default:
        throw new Error(`Unsupported asset type: ${config.type}`);
    }
  }
  
  /**
   * Load an image
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }
  
  /**
   * Load an audio file
   */
  private async loadAudio(url: string): Promise<AudioBuffer> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      
      // Use Web Audio API to decode
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      throw new Error(`Failed to load audio: ${url}`);
    }
  }
  
  /**
   * Load a JSON file
   */
  private async loadJSON(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to load JSON: ${url}`);
    }
  }
  
  /**
   * Load a font
   */
  private async loadFont(url: string): Promise<FontFace> {
    try {
      const fontName = url.split('/').pop()?.split('.')[0] || 'CustomFont';
      const fontFace = new FontFace(fontName, `url(${url})`);
      const loadedFont = await fontFace.load();
      document.fonts.add(loadedFont);
      return loadedFont;
    } catch (error) {
      throw new Error(`Failed to load font: ${url}`);
    }
  }
  
  /**
   * Get a loaded asset
   * @param id Asset ID
   * @returns Loaded asset or undefined
   */
  get(id: string): any | undefined {
    return this.assets.get(id);
  }
  
  /**
   * Check if an asset is loaded
   * @param id Asset ID
   * @returns True if loaded
   */
  isLoaded(id: string): boolean {
    return this.assets.has(id);
  }
  
  /**
   * Check if an asset is loading
   * @param id Asset ID
   * @returns True if loading
   */
  isLoading(id: string): boolean {
    return this.loading.has(id);
  }
  
  /**
   * Unload an asset to free memory
   * @param id Asset ID
   */
  unload(id: string): void {
    this.assets.delete(id);
    // Note: Actual memory cleanup depends on garbage collection
  }
  
  /**
   * Unload multiple assets
   * @param ids Array of asset IDs
   */
  unloadMultiple(ids: string[]): void {
    ids.forEach(id => this.unload(id));
  }
  
  /**
   * Get loading progress
   * @returns Progress information
   */
  getProgress(): LoadProgress {
    return {
      loaded: this.loadedCount,
      total: this.totalCount,
      percentage: this.totalCount > 0 ? (this.loadedCount / this.totalCount) * 100 : 0,
    };
  }
  
  /**
   * Add progress callback
   * @param callback Progress callback function
   */
  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }
  
  /**
   * Notify progress callbacks
   */
  private notifyProgress(currentAsset?: string): void {
    const progress: LoadProgress = {
      ...this.getProgress(),
      currentAsset,
    };
    
    this.progressCallbacks.forEach(callback => callback(progress));
  }
  
  /**
   * Clear all loaded assets
   */
  clear(): void {
    this.assets.clear();
    this.loading.clear();
    this.loadedCount = 0;
  }
  
  /**
   * Get memory usage estimate (in bytes)
   */
  getMemoryUsage(): number {
    let totalBytes = 0;
    
    this.assets.forEach((asset, id) => {
      const config = this.config.get(id);
      if (!config) return;
      
      switch (config.type) {
        case 'image':
          const img = asset as HTMLImageElement;
          totalBytes += img.width * img.height * 4; // RGBA
          break;
        case 'audio':
          const buffer = asset as AudioBuffer;
          totalBytes += buffer.length * buffer.numberOfChannels * 4; // Float32
          break;
        case 'json':
          totalBytes += JSON.stringify(asset).length * 2; // UTF-16
          break;
      }
    });
    
    return totalBytes;
  }
}

// Global asset loader instance
let globalAssetLoader: AssetLoader | null = null;

/**
 * Get or create the global asset loader
 */
export function getAssetLoader(): AssetLoader {
  if (!globalAssetLoader) {
    globalAssetLoader = new AssetLoader();
  }
  return globalAssetLoader;
}

/**
 * Reset the global asset loader
 */
export function resetAssetLoader(): void {
  if (globalAssetLoader) {
    globalAssetLoader.clear();
  }
  globalAssetLoader = null;
}

/**
 * Preload critical game assets
 */
export async function preloadGameAssets(): Promise<void> {
  const loader = getAssetLoader();
  
  // Register game assets
  loader.register([
    // Critical assets (loaded immediately)
    {
      id: 'game-logo',
      type: 'image',
      url: '/assets/logo.png',
      priority: 'critical',
      preload: true,
    },
    
    // High priority assets (loaded on game start)
    {
      id: 'block-texture',
      type: 'image',
      url: '/assets/blocks/texture.png',
      priority: 'high',
    },
    
    // Normal priority assets (loaded on demand)
    {
      id: 'particle-texture',
      type: 'image',
      url: '/assets/particles/particle.png',
      priority: 'normal',
    },
    
    // Low priority assets (loaded when idle)
    {
      id: 'background-music',
      type: 'audio',
      url: '/assets/audio/music.mp3',
      priority: 'low',
    },
  ]);
  
  // Preload critical assets
  await loader.preloadCritical();
}
