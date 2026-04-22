/**
 * Asset Loader
 * 
 * Manages lazy loading of assets with prioritization
 */

interface AssetManifest {
  critical: AssetDefinition[];
  nonCritical: AssetDefinition[];
}

interface AssetDefinition {
  id: string;
  type: 'texture' | 'mesh' | 'sound' | 'font';
  url: string;
  priority: number;
}

interface LoadingState {
  total: number;
  loaded: number;
  failed: number;
  inProgress: boolean;
}

export class AssetLoader {
  private manifest: AssetManifest;
  private loadedAssets: Map<string, any>;
  private state: LoadingState;
  
  constructor() {
    this.manifest = {
      critical: [],
      nonCritical: []
    };
    this.loadedAssets = new Map();
    this.state = {
      total: 0,
      loaded: 0,
      failed: 0,
      inProgress: false
    };
  }
  
  /**
   * Set asset manifest
   */
  setManifest(manifest: AssetManifest): void {
    this.manifest = manifest;
    this.state.total = manifest.critical.length + manifest.nonCritical.length;
    console.log(`[AssetLoader] Manifest set: ${this.state.total} assets`);
  }
  
  /**
   * Load critical assets (blocking)
   */
  async loadCritical(): Promise<void> {
    if (this.state.inProgress) {
      console.warn('[AssetLoader] Loading already in progress');
      return;
    }
    
    this.state.inProgress = true;
    console.log(`[AssetLoader] Loading ${this.manifest.critical.length} critical assets...`);
    
    const promises = this.manifest.critical.map(asset => this.loadAsset(asset));
    
    try {
      await Promise.all(promises);
      console.log('[AssetLoader] Critical assets loaded');
    } catch (error) {
      console.error('[AssetLoader] Failed to load critical assets:', error);
      throw error;
    }
  }
  
  /**
   * Load non-critical assets (non-blocking, prioritized)
   */
  async loadNonCritical(): Promise<void> {
    console.log(`[AssetLoader] Loading ${this.manifest.nonCritical.length} non-critical assets...`);
    
    // Sort by priority (higher priority first)
    const sorted = [...this.manifest.nonCritical].sort((a, b) => b.priority - a.priority);
    
    // Load assets in batches to avoid blocking
    const batchSize = 3;
    for (let i = 0; i < sorted.length; i += batchSize) {
      const batch = sorted.slice(i, i + batchSize);
      const promises = batch.map(asset => this.loadAsset(asset));
      
      try {
        await Promise.all(promises);
      } catch (error) {
        console.warn('[AssetLoader] Failed to load some non-critical assets:', error);
      }
      
      // Yield to main thread
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    this.state.inProgress = false;
    console.log('[AssetLoader] Non-critical assets loaded');
  }
  
  /**
   * Load a single asset
   */
  private async loadAsset(asset: AssetDefinition): Promise<void> {
    try {
      let loadedAsset: any;
      
      switch (asset.type) {
        case 'texture':
          loadedAsset = await this.loadTexture(asset.url);
          break;
        case 'mesh':
          loadedAsset = await this.loadMesh(asset.url);
          break;
        case 'sound':
          loadedAsset = await this.loadSound(asset.url);
          break;
        case 'font':
          loadedAsset = await this.loadFont(asset.url);
          break;
        default:
          throw new Error(`Unknown asset type: ${asset.type}`);
      }
      
      this.loadedAssets.set(asset.id, loadedAsset);
      this.state.loaded++;
      
      console.log(`[AssetLoader] Loaded ${asset.id} (${this.state.loaded}/${this.state.total})`);
    } catch (error) {
      console.error(`[AssetLoader] Failed to load ${asset.id}:`, error);
      this.state.failed++;
      
      // Use fallback
      this.loadedAssets.set(asset.id, this.getFallback(asset.type));
    }
  }
  
  /**
   * Load texture
   */
  private async loadTexture(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
  
  /**
   * Load mesh
   */
  private async loadMesh(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load mesh: ${response.statusText}`);
    return response.json();
  }
  
  /**
   * Load sound
   */
  private async loadSound(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load sound: ${response.statusText}`);
    return response.arrayBuffer();
  }
  
  /**
   * Load font
   */
  private async loadFont(url: string): Promise<any> {
    const font = new FontFace('CustomFont', `url(${url})`);
    await font.load();
    document.fonts.add(font);
    return font;
  }
  
  /**
   * Get fallback asset
   */
  private getFallback(type: string): any {
    switch (type) {
      case 'texture':
        // Return 1x1 transparent pixel
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas;
      case 'mesh':
        return { vertices: [], indices: [] };
      case 'sound':
        return new ArrayBuffer(0);
      case 'font':
        return null;
      default:
        return null;
    }
  }
  
  /**
   * Get loaded asset
   */
  getAsset(id: string): any | null {
    return this.loadedAssets.get(id) || null;
  }
  
  /**
   * Get loading state
   */
  getState(): LoadingState {
    return { ...this.state };
  }
  
  /**
   * Get loading progress (0-1)
   */
  getProgress(): number {
    if (this.state.total === 0) return 1;
    return this.state.loaded / this.state.total;
  }
}

// Singleton instance
export const assetLoader = new AssetLoader();
