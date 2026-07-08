import { GRID_SIZE, type GridState, type Piece } from '../../types';

export interface BoardMetrics {
  padding: number;
  gap: number;
  cellSize: number;
  stride: number;
}

export interface GravityMove {
  id: string;
  x: number;
  fromY: number;
  toY: number;
  color: string;
  cellType?: GridState[number][number]['type'];
}

export interface ClearParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  radius: number;
  color: string;
}

export interface ClearEffectConfig {
  duration: number;
  maxParticles: number;
  staggerFraction: number;
  impactScale: number;
  crackBranches: number;
  accentColor: string | null;
}

export interface GridRenderProfile {
  targetFps: number;
  pixelRatioCap: number;
  particleMultiplier: number;
  effectLevel: 'minimal' | 'reduced' | 'full';
}

export function getGridRenderProfile(deviceTier: string, isAndroid: boolean): GridRenderProfile {
  switch (deviceTier) {
    case 'low':
      return { targetFps: 30, pixelRatioCap: 1, particleMultiplier: 0, effectLevel: 'minimal' };
    case 'low-mid':
    case 'mid-low':
      return { targetFps: 45, pixelRatioCap: isAndroid ? 1.1 : 1.25, particleMultiplier: 0.35, effectLevel: 'reduced' };
    case 'mid':
      return { targetFps: 60, pixelRatioCap: isAndroid ? 1.2 : 1.35, particleMultiplier: 0.65, effectLevel: 'reduced' };
    case 'mid-high':
      return { targetFps: 60, pixelRatioCap: isAndroid ? 1.25 : 1.5, particleMultiplier: 0.9, effectLevel: 'full' };
    case 'high':
      return { targetFps: 60, pixelRatioCap: isAndroid ? 1.25 : 1.5, particleMultiplier: 1, effectLevel: 'full' };
    default:
      return { targetFps: isAndroid ? 45 : 60, pixelRatioCap: isAndroid ? 1.1 : 1.35, particleMultiplier: isAndroid ? 0.45 : 0.75, effectLevel: isAndroid ? 'reduced' : 'full' };
  }
}

export function shouldRenderAnimationFrame(
  lastFrameTime: number,
  currentTime: number,
  targetFps = 60
): boolean {
  if (targetFps <= 0 || lastFrameTime <= 0) return true;
  return currentTime - lastFrameTime >= (1000 / targetFps) - 0.5;
}

interface ClearedCell {
  x: number;
  y: number;
  color: string;
}

interface MovedCell {
  id?: string;
  x: number;
  fromY: number;
  toY: number;
}

export function getClearEffectConfig(lines: number, combo: number): ClearEffectConfig {
  const isFourLineClear = lines >= 4;
  const isThreeLineClear = lines === 3;
  const isTwoLineClear = lines === 2;
  const isMultiLineClear = lines >= 2;
  const accentColor = combo >= 8
    ? '#f472b6'
    : combo >= 5
      ? '#fbbf24'
      : combo >= 2
        ? '#34d399'
        : null;

  return {
    duration: isFourLineClear ? 245 : isThreeLineClear ? 225 : isTwoLineClear ? 210 : combo >= 2 ? 195 : 165,
    maxParticles: isFourLineClear ? 24 : isMultiLineClear ? 20 : combo >= 2 ? 16 : 12,
    staggerFraction: isFourLineClear ? 0.2 : isThreeLineClear ? 0.18 : isTwoLineClear ? 0.16 : 0.1,
    impactScale: isFourLineClear ? 1.1 : isMultiLineClear || combo >= 2 ? 1.07 : 1.035,
    crackBranches: isFourLineClear ? 3 : isMultiLineClear || combo >= 2 ? 2 : 1,
    accentColor,
  };
}

export function getClearCellProgress(
  progress: number,
  distanceFromCenter: number,
  maxDistance: number,
  staggerFraction: number
): number {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const distanceRatio = maxDistance > 0
    ? Math.max(0, Math.min(1, distanceFromCenter / maxDistance))
    : 0;
  const delay = distanceRatio * Math.max(0, Math.min(0.45, staggerFraction));

  return Math.max(0, Math.min(1, (clampedProgress - delay) / (1 - delay)));
}

export function getGravityMoves(grid: GridState, movedCells: MovedCell[]): GravityMove[] {
  const firstPositionById = new Map<string, { x: number; fromY: number }>();

  movedCells.forEach((movement) => {
    if (!movement.id || firstPositionById.has(movement.id)) return;
    firstPositionById.set(movement.id, { x: movement.x, fromY: movement.fromY });
  });

  const moves: GravityMove[] = [];
  grid.forEach((row, toY) => {
    row.forEach((cell, x) => {
      if (!cell.filled || !cell.id) return;
      const start = firstPositionById.get(cell.id);
      if (!start || start.fromY === toY) return;
      moves.push({
        id: cell.id,
        x,
        fromY: start.fromY,
        toY,
        color: cell.color,
        cellType: cell.type,
      });
    });
  });

  return moves;
}

export function getGravityFrame(progress: number): {
  positionProgress: number;
  bounceOffset: number;
  scaleX: number;
  scaleY: number;
} {
  const clamped = Math.max(0, Math.min(1, progress));
  const fallEnd = 0.78;

  if (clamped === 1) {
    return {
      positionProgress: 1,
      bounceOffset: 0,
      scaleX: 1,
      scaleY: 1,
    };
  }

  if (clamped < fallEnd) {
    const fallProgress = clamped / fallEnd;
    const stretch = Math.sin(fallProgress * Math.PI) * 0.042;
    return {
      positionProgress: fallProgress * fallProgress,
      bounceOffset: 0,
      scaleX: 1 - stretch,
      scaleY: 1 + stretch,
    };
  }

  const settleProgress = (clamped - fallEnd) / (1 - fallEnd);
  const squash = Math.sin(settleProgress * Math.PI);
  return {
    positionProgress: 1,
    bounceOffset: -squash * 0.045,
    scaleX: 1 + (squash * 0.08),
    scaleY: 1 - (squash * 0.08),
  };
}

export function createClearParticles(cells: ClearedCell[], maxParticles = 24): ClearParticle[] {
  if (cells.length === 0 || maxParticles <= 0) return [];

  const particlesPerCell = Math.max(1, Math.min(2, Math.floor(maxParticles / cells.length)));
  const particles: ClearParticle[] = [];

  cells.slice(0, maxParticles).forEach((cell, cellIndex) => {
    for (let index = 0; index < particlesPerCell && particles.length < maxParticles; index++) {
      const direction = (cellIndex + index) % 2 === 0 ? -1 : 1;
      const spread = 0.16 + (((cellIndex * 7) + (index * 3)) % 5) * 0.035;
      particles.push({
        x: cell.x + 0.5,
        y: cell.y + 0.5,
        velocityX: direction * spread,
        velocityY: -0.24 - (((cellIndex + index) % 4) * 0.045),
        radius: 0.055 + (((cellIndex + index) % 3) * 0.012),
        color: cell.color || '#ffffff',
      });
    }
  });

  return particles;
}

export function getBoardMetrics(size: number): BoardMetrics {
  const padding = Math.max(4, size * 0.018);
  const gap = Math.max(1, size * 0.006);
  const cellSize = (size - (padding * 2) - (gap * (GRID_SIZE - 1))) / GRID_SIZE;

  return {
    padding,
    gap,
    cellSize,
    stride: cellSize + gap,
  };
}

export function pointerToPieceOrigin(
  localX: number,
  localY: number,
  boardSize: number,
  piece: Piece
): { x: number; y: number } {
  const metrics = getBoardMetrics(boardSize);
  const cellX = Math.round(
    (localX - metrics.padding - (metrics.cellSize / 2)) / metrics.stride
  );
  const cellY = Math.round(
    (localY - metrics.padding - (metrics.cellSize / 2)) / metrics.stride
  );

  return {
    x: cellX - Math.floor((piece.shape[0].length - 1) / 2),
    y: cellY - Math.floor((piece.shape.length - 1) / 2),
  };
}

export function pieceOriginToPointerLocal(
  originX: number,
  originY: number,
  boardSize: number,
  piece: Piece
): { x: number; y: number } {
  const metrics = getBoardMetrics(boardSize);
  const anchorX = originX + Math.floor((piece.shape[0].length - 1) / 2);
  const anchorY = originY + Math.floor((piece.shape.length - 1) / 2);

  return {
    x: metrics.padding + (anchorX * metrics.stride) + (metrics.cellSize / 2),
    y: metrics.padding + (anchorY * metrics.stride) + (metrics.cellSize / 2),
  };
}
