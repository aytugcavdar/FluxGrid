import * as BABYLON from 'babylonjs';
import { describe, expect, it } from 'vitest';
import { CellType, type GridState } from '../../../types';
import { startLineClearAnimation } from './lineClearHelpers';

const createGrid = (): GridState => Array.from({ length: 10 }, () =>
  Array.from({ length: 10 }, () => ({ filled: false, color: '' }))
);

describe('startLineClearAnimation gravity behavior', () => {
  it('does not create fake falling blocks when gravity is disabled', () => {
    const grid = createGrid();
    grid[8][0] = {
      filled: true,
      color: '#ffffff',
      id: 'survivor',
      type: CellType.NORMAL,
    };

    const meshMap = new Map<string, BABYLON.Mesh>([
      ['survivor', { position: new BABYLON.Vector3(0, 0, 0) } as BABYLON.Mesh],
    ]);
    const animationRef = { current: null as any };

    startLineClearAnimation(
      [9],
      [],
      grid,
      meshMap,
      animationRef,
      Array.from({ length: 10 }, (_, x) => ({
        x,
        y: 9,
        color: '#ffffff',
        cellType: CellType.NORMAL,
      })),
      [],
      false
    );

    expect(animationRef.current.affectedBlocks.size).toBe(0);
  });
});
