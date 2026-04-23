# Texture Atlas Implementation Guide

## Overview

Texture atlasing combines multiple textures into a single texture to reduce draw calls and improve rendering performance. This is particularly beneficial for games with many small textures.

## Current Implementation Status

**Note**: The current FluxGrid game uses procedural geometry (Babylon.js meshes with StandardMaterial) without texture mapping. The texture atlas utility (`textureAtlas.ts`) is prepared for future use if the rendering approach changes to texture-based rendering.

## Performance Benefits

- **Reduced Draw Calls**: Instead of 1 draw call per texture, use 1 draw call for all textures in the atlas
- **Better GPU Cache Utilization**: Single texture stays in GPU memory
- **Reduced State Changes**: Fewer texture bindings during rendering
- **Lower Memory Overhead**: Single texture header instead of multiple

## Example Metrics

For a game with 100 different block textures:
- Without Atlas: 100 draw calls
- With Atlas: 1 draw call
- **Reduction: 99%**

## Usage Example

### 1. Create Atlas from URLs

```typescript
import { createTextureAtlasFromUrls } from '@utils/textureAtlas';

const imageUrls = new Map([
  ['block_red', '/assets/blocks/red.png'],
  ['block_blue', '/assets/blocks/blue.png'],
  ['block_green', '/assets/blocks/green.png'],
]);

const atlas = await createTextureAtlasFromUrls(imageUrls, {
  maxWidth: 2048,
  maxHeight: 2048,
  padding: 2,
});

// Use atlas.canvas as texture source
// Use atlas.regions to get UV coordinates for each sprite
```

### 2. Create Atlas from Images

```typescript
import { createTextureAtlas, loadImage } from '@utils/textureAtlas';

const images = new Map();
images.set('sprite1', await loadImage('/sprite1.png'));
images.set('sprite2', await loadImage('/sprite2.png'));

const atlas = await createTextureAtlas(images);
```

### 3. Use with Babylon.js

```typescript
import * as BABYLON from 'babylonjs';

// Create texture from atlas
const texture = new BABYLON.Texture(atlas.canvas.toDataURL(), scene);

// Create material with atlas texture
const material = new BABYLON.StandardMaterial('atlasMat', scene);
material.diffuseTexture = texture;

// Get UV coordinates for a specific sprite
const region = atlas.regions.get('block_red');
if (region) {
  // Apply UV coordinates to mesh
  // mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, [
  //   region.u0, region.v0,
  //   region.u1, region.v0,
  //   region.u1, region.v1,
  //   region.u0, region.v1,
  // ]);
}
```

### 4. Programmatic Block Textures

```typescript
import { createBlockTextureAtlas } from '@utils/textureAtlas';

// Create atlas with colored block textures
const blockAtlas = await createBlockTextureAtlas();

// Use in game rendering
console.log('Atlas size:', blockAtlas.width, 'x', blockAtlas.height);
console.log('Regions:', Array.from(blockAtlas.regions.keys()));
```

## Integration with Current Game

To integrate texture atlasing with the current Babylon.js implementation:

1. **Replace StandardMaterial with Textured Material**:
   ```typescript
   // Instead of:
   const mat = new BABYLON.StandardMaterial('blockMat', scene);
   mat.diffuseColor = BABYLON.Color3.FromHexString(color);
   
   // Use:
   const mat = new BABYLON.StandardMaterial('blockMat', scene);
   mat.diffuseTexture = atlasTexture;
   // Set UV coordinates based on atlas region
   ```

2. **Update Mesh Creation**:
   - Create meshes with UV coordinates
   - Map each block type to its atlas region
   - Apply UV offsets for correct texture sampling

3. **Batch Rendering**:
   - Group blocks by material (all use same atlas)
   - Reduce to single draw call per material

## Performance Monitoring

```typescript
import { calculateAtlasMetrics } from '@utils/textureAtlas';

const metrics = calculateAtlasMetrics(
  100, // number of textures
  2048 * 2048 // atlas size in pixels
);

console.log('Draw call reduction:', metrics.drawCallReduction + '%');
console.log('Before:', metrics.drawCallsWithoutAtlas, 'draw calls');
console.log('After:', metrics.drawCallsWithAtlas, 'draw calls');
```

## Best Practices

1. **Power of Two Sizes**: Atlas dimensions are automatically rounded to power of 2 (512, 1024, 2048, etc.) for GPU compatibility
2. **Padding**: Add 2px padding between sprites to prevent texture bleeding
3. **Max Size**: Keep atlas under 2048x2048 for mobile compatibility
4. **Sorting**: Images are sorted by height for optimal packing
5. **Compression**: Use compressed texture formats (DXT, ETC, ASTC) for production

## Future Improvements

- [ ] Support for multiple atlases (when single atlas exceeds max size)
- [ ] Advanced packing algorithms (MaxRects, Guillotine)
- [ ] Automatic mipmap generation
- [ ] Runtime atlas updates (add/remove sprites)
- [ ] Compressed texture format support

## References

- [Babylon.js Texture Documentation](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction)
- [Texture Atlas Best Practices](https://developer.mozilla.org/en-US/docs/Games/Techniques/Textures_from_code)
- [GPU Performance Optimization](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
