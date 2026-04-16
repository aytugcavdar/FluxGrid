/**
 * Texture Atlas Utility
 * 
 * Combines multiple textures into a single atlas to reduce draw calls.
 * Requirements: 5.4
 * 
 * Note: Current game uses procedural geometry (Babylon.js meshes) without textures.
 * This utility is prepared for future texture-based rendering if needed.
 */

export interface AtlasRegion {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  // UV coordinates (0-1 range)
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

export interface TextureAtlas {
  canvas: HTMLCanvasElement;
  regions: Map<string, AtlasRegion>;
  width: number;
  height: number;
}

export interface AtlasConfig {
  maxWidth?: number;
  maxHeight?: number;
  padding?: number;
}

/**
 * Create a texture atlas from multiple image sources
 * @param images Map of image name to HTMLImageElement or ImageBitmap
 * @param config Atlas configuration
 * @returns TextureAtlas with combined texture and region data
 */
export async function createTextureAtlas(
  images: Map<string, HTMLImageElement | ImageBitmap>,
  config: AtlasConfig = {}
): Promise<TextureAtlas> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    padding = 2,
  } = config;

  // Sort images by height (tallest first) for better packing
  const sortedImages = Array.from(images.entries()).sort((a, b) => {
    const heightA = a[1] instanceof HTMLImageElement ? a[1].height : a[1].height;
    const heightB = b[1] instanceof HTMLImageElement ? b[1].height : b[1].height;
    return heightB - heightA;
  });

  // Simple shelf packing algorithm
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  const regions = new Map<string, AtlasRegion>();
  let currentX = padding;
  let currentY = padding;
  let rowHeight = 0;
  let atlasWidth = 0;
  let atlasHeight = 0;

  // First pass: calculate required size
  for (const [name, image] of sortedImages) {
    const imgWidth = image instanceof HTMLImageElement ? image.width : image.width;
    const imgHeight = image instanceof HTMLImageElement ? image.height : image.height;

    // Check if we need to move to next row
    if (currentX + imgWidth + padding > maxWidth) {
      currentX = padding;
      currentY += rowHeight + padding;
      rowHeight = 0;
    }

    // Check if we exceed max height
    if (currentY + imgHeight + padding > maxHeight) {
      throw new Error('Images do not fit in atlas with given dimensions');
    }

    rowHeight = Math.max(rowHeight, imgHeight);
    atlasWidth = Math.max(atlasWidth, currentX + imgWidth + padding);
    atlasHeight = Math.max(atlasHeight, currentY + imgHeight + padding);

    currentX += imgWidth + padding;
  }

  // Set canvas size to power of 2 for better GPU compatibility
  canvas.width = nextPowerOfTwo(atlasWidth);
  canvas.height = nextPowerOfTwo(atlasHeight);

  // Second pass: draw images and record regions
  currentX = padding;
  currentY = padding;
  rowHeight = 0;

  for (const [name, image] of sortedImages) {
    const imgWidth = image instanceof HTMLImageElement ? image.width : image.width;
    const imgHeight = image instanceof HTMLImageElement ? image.height : image.height;

    // Check if we need to move to next row
    if (currentX + imgWidth + padding > maxWidth) {
      currentX = padding;
      currentY += rowHeight + padding;
      rowHeight = 0;
    }

    // Draw image
    ctx.drawImage(image as any, currentX, currentY);

    // Record region with UV coordinates
    regions.set(name, {
      name,
      x: currentX,
      y: currentY,
      width: imgWidth,
      height: imgHeight,
      u0: currentX / canvas.width,
      v0: currentY / canvas.height,
      u1: (currentX + imgWidth) / canvas.width,
      v1: (currentY + imgHeight) / canvas.height,
    });

    rowHeight = Math.max(rowHeight, imgHeight);
    currentX += imgWidth + padding;
  }

  return {
    canvas,
    regions,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Get the next power of two for a given number
 */
function nextPowerOfTwo(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Load an image from URL
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Create a texture atlas from URLs
 */
export async function createTextureAtlasFromUrls(
  imageUrls: Map<string, string>,
  config?: AtlasConfig
): Promise<TextureAtlas> {
  const images = new Map<string, HTMLImageElement>();
  
  // Load all images
  const loadPromises = Array.from(imageUrls.entries()).map(async ([name, url]) => {
    const img = await loadImage(url);
    images.set(name, img);
  });
  
  await Promise.all(loadPromises);
  
  return createTextureAtlas(images, config);
}

/**
 * Example usage for game blocks (if textures are used in future)
 */
export async function createBlockTextureAtlas(): Promise<TextureAtlas> {
  // Example: Create colored block textures programmatically
  const blockColors = [
    { name: 'red', color: '#ef4444' },
    { name: 'blue', color: '#3b82f6' },
    { name: 'green', color: '#10b981' },
    { name: 'yellow', color: '#f59e0b' },
    { name: 'purple', color: '#a855f7' },
    { name: 'cyan', color: '#06b6d4' },
  ];

  const images = new Map<string, HTMLImageElement>();
  
  for (const { name, color } of blockColors) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    // Draw colored square
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    
    // Add border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 62, 62);
    
    // Convert to image
    const img = new Image();
    img.src = canvas.toDataURL();
    await new Promise(resolve => img.onload = resolve);
    images.set(name, img);
  }
  
  return createTextureAtlas(images, {
    maxWidth: 512,
    maxHeight: 512,
    padding: 2,
  });
}

/**
 * Performance metrics for texture atlasing
 */
export interface AtlasMetrics {
  drawCallsWithoutAtlas: number;
  drawCallsWithAtlas: number;
  drawCallReduction: number;
  atlasSize: number;
  textureCount: number;
}

/**
 * Calculate performance improvement from using texture atlas
 */
export function calculateAtlasMetrics(
  textureCount: number,
  atlasSize: number
): AtlasMetrics {
  // Without atlas: 1 draw call per texture
  const drawCallsWithoutAtlas = textureCount;
  
  // With atlas: 1 draw call for all textures (assuming same material)
  const drawCallsWithAtlas = 1;
  
  const drawCallReduction = ((drawCallsWithoutAtlas - drawCallsWithAtlas) / drawCallsWithoutAtlas) * 100;
  
  return {
    drawCallsWithoutAtlas,
    drawCallsWithAtlas,
    drawCallReduction,
    atlasSize,
    textureCount,
  };
}
