import { describe, expect, it, vi } from 'vitest';
import { MeshPool } from '@features/game/components/grid/helpers/meshPoolHelpers';
import { CellType } from '@features/game/types';

const createPooledMesh = () => {
  const child = {
    isVisible: false,
    visibility: 0,
  };

  const material = {
    alpha: 0.15,
    wireframe: true,
    specularPower: 12,
  };

  return {
    isVisible: true,
    visibility: 0.25,
    material,
    position: { set: vi.fn() },
    rotation: { set: vi.fn() },
    scaling: { set: vi.fn() },
    enableEdgesRendering: vi.fn(),
    getChildMeshes: vi.fn(() => [child]),
    dispose: vi.fn(),
    edgesWidth: 0,
    edgesColor: null,
    __child: child,
  } as any;
};

describe('MeshPool', () => {
  it('reused normal block meshes restore their base opacity and color', () => {
    const pool = new MeshPool();
    const mesh = createPooledMesh();

    pool.returnMesh(mesh, '#22c55e', CellType.NORMAL, undefined);
    mesh.material.alpha = 0.2;
    mesh.material.wireframe = true;
    mesh.__child.isVisible = false;
    mesh.__child.visibility = 0;

    const reused = pool.getMesh('#22c55e', CellType.NORMAL, undefined, () => {
      throw new Error('expected pooled mesh');
    }) as any;

    expect(reused).toBe(mesh);
    expect(reused.isVisible).toBe(true);
    expect(reused.visibility).toBe(1);
    expect(reused.material.alpha).toBe(0.95);
    expect(reused.material.wireframe).toBe(false);
    expect(reused.material.diffuseColor.toHexString()).toBe('#22C55E');
    expect(reused.__child.isVisible).toBe(true);
    expect(reused.__child.visibility).toBe(1);
  });

  it('reused bomb meshes restore full opacity', () => {
    const pool = new MeshPool();
    const mesh = createPooledMesh();

    pool.returnMesh(mesh, '#ef4444', CellType.BOMB, undefined);
    mesh.material.alpha = 0.1;

    const reused = pool.getMesh('#ef4444', CellType.BOMB, undefined, () => {
      throw new Error('expected pooled mesh');
    }) as any;

    expect(reused.material.alpha).toBe(1);
    expect(reused.material.diffuseColor.toHexString()).toBe('#1C1917');
  });
});
