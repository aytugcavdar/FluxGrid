import React, { useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useSettingsStore } from '@core/state/settingsStore';
import { useThemeStore } from '../../../shared/store/themeStore';
import { usePerformanceStore } from '../../performance/store/performanceStore';
import { gameFeelEvents, playGravityLand } from '../../../utils/audio';
import { getDragYOffset, setCanvasRect } from '../../../utils/responsive/responsive';
import { useGameStore } from '../store/gameStore';
import { CellType, GRID_SIZE, type GridState } from '../types';
import {
  findBestPlacement,
  getActiveDragPointerId,
  getSharedPointerPosition,
  recordPointerSample,
  setSharedHoverCoord,
} from '../utils/placementHelper';
import {
  createClearParticles,
  getBoardMetrics,
  getClearCellProgress,
  getClearEffectConfig,
  getClearPreviewLines,
  getGravityFrame,
  getGravityMoves,
  getGridRenderProfile,
  pointerToPieceOrigin,
  shouldRenderAnimationFrame,
  type ClearParticle,
  type ClearEffectConfig,
  type GravityMove,
} from './grid2d/grid2dHelpers';

interface GridProps {
  grid: GridState;
}

interface HoverState {
  x: number;
  y: number;
  valid: boolean;
}

interface GravityAnimation {
  moves: GravityMove[];
  startedAt: number;
  duration: number;
}

interface PlacementAnimation {
  cellIds: string[];
  startedAt: number;
  duration: number;
}

interface ClearAnimationCell {
  x: number;
  y: number;
  color: string;
  cellType?: CellType;
}

interface ClearAnimation {
  cells: ClearAnimationCell[];
  particles: ClearParticle[];
  startedAt: number;
  duration: number;
  clearDuration: number;
  centerX: number;
  centerY: number;
  maxDistance: number;
  lineCount: number;
  effect: ClearEffectConfig;
  damagedIceCells: Array<{ x: number; y: number }>;
  bombCells: Array<{ x: number; y: number }>;
}

type FireFeedbackKind = 'spawn' | 'spread' | 'damage';

interface FireFeedbackCell {
  x: number;
  y: number;
  color: string;
  kind: FireFeedbackKind;
  sourceX?: number;
  sourceY?: number;
}

interface FireFeedbackAnimation {
  cells: FireFeedbackCell[];
  startedAt: number;
  duration: number;
}

interface ClearColorAnimation {
  key: string;
  startedAt: number;
  duration: number;
}

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
};

const getCellColor = (color: string, type?: CellType): string => {
  if (type === CellType.ICE) return color || '#7dd3fc';
  if (type === CellType.BOMB) return '#b91c1c';
  if (type === CellType.FIRE) return color || '#7c3aed';
  if (type === CellType.STONE) return '#475569';
  if (type === CellType.VOID) return '#170d28';
  return color || '#a855f7';
};

const mixHexColors = (fromColor: string, toColor: string, progress: number): string => {
  const normalize = (color: string): string | null => {
    if (/^#[0-9a-f]{6}$/i.test(color)) return color.slice(1);
    if (/^#[0-9a-f]{3}$/i.test(color)) {
      return color.slice(1).split('').map(character => character.repeat(2)).join('');
    }
    return null;
  };
  const from = normalize(fromColor);
  const to = normalize(toColor);
  if (!from || !to) return progress >= 0.5 ? toColor : fromColor;

  const amount = Math.max(0, Math.min(1, progress));
  const channel = (offset: number) => Math.round(
    parseInt(from.slice(offset, offset + 2), 16)
    + ((parseInt(to.slice(offset, offset + 2), 16) - parseInt(from.slice(offset, offset + 2), 16)) * amount)
  ).toString(16).padStart(2, '0');

  return `#${channel(0)}${channel(2)}${channel(4)}`;
};

const getEffectColor = (cell: ClearAnimationCell, accentColor: string | null): string => {
  if (accentColor) return accentColor;
  if (cell.cellType === CellType.ICE) return '#67e8f9';
  if (cell.cellType === CellType.BOMB) return '#ff453a';
  if (cell.cellType === CellType.FIRE) return '#c084fc';
  if (cell.cellType === CellType.STONE) return '#cbd5e1';
  if (cell.cellType === CellType.VOID) return '#8b5cf6';
  return cell.color || '#a855f7';
};

const getLineClearColor = (lineCount: number): string => {
  if (lineCount >= 4) return '#f59e0b';
  if (lineCount === 3) return '#a855f7';
  if (lineCount === 2) return '#38bdf8';
  return '#94a3b8';
};

const virusSprites: {
  healthy: HTMLImageElement | null;
  damaged: HTMLImageElement | null;
} = {
  healthy: null,
  damaged: null,
};

const iceSprites: {
  healthy: HTMLImageElement | null;
  cracked: HTMLImageElement | null;
} = {
  healthy: null,
  cracked: null,
};

let bombSprite: HTMLImageElement | null = null;

const preloadVirusSprites = () => {
  if (typeof Image === 'undefined' || virusSprites.healthy) return;
  const basePath = import.meta.env.BASE_URL || '/';

  virusSprites.healthy = new Image();
  virusSprites.healthy.decoding = 'async';
  virusSprites.healthy.src = `${basePath}assets/virus/virus-healthy-v2.png`;

  virusSprites.damaged = new Image();
  virusSprites.damaged.decoding = 'async';
  virusSprites.damaged.src = `${basePath}assets/virus/virus-damaged-v2.png`;
};

const getVirusSprite = (health?: number): HTMLImageElement | null => {
  preloadVirusSprites();
  const sprite = health === 1 ? virusSprites.damaged : virusSprites.healthy;
  return sprite?.complete && sprite.naturalWidth > 0 ? sprite : null;
};

const preloadIceSprites = () => {
  if (typeof Image === 'undefined' || iceSprites.healthy) return;
  const basePath = import.meta.env.BASE_URL || '/';

  iceSprites.healthy = new Image();
  iceSprites.healthy.decoding = 'async';
  iceSprites.healthy.src = `${basePath}assets/ice/ice-healthy-v2.png`;

  iceSprites.cracked = new Image();
  iceSprites.cracked.decoding = 'async';
  iceSprites.cracked.src = `${basePath}assets/ice/ice-cracked-v3.png`;
};

const getIceSprite = (health?: number): HTMLImageElement | null => {
  preloadIceSprites();
  const sprite = health === 1 ? iceSprites.cracked : iceSprites.healthy;
  return sprite?.complete && sprite.naturalWidth > 0 ? sprite : null;
};

const preloadBombSprite = () => {
  if (typeof Image === 'undefined' || bombSprite) return;
  const basePath = import.meta.env.BASE_URL || '/';
  bombSprite = new Image();
  bombSprite.decoding = 'async';
  bombSprite.src = `${basePath}assets/bomb/bomb-v1.png`;
};

const getBombSprite = (): HTMLImageElement | null => {
  preloadBombSprite();
  return bombSprite?.complete && bombSprite.naturalWidth > 0 ? bombSprite : null;
};

const drawVirusSpriteAt = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  spriteSize: number,
  alpha = 1,
  health = 2
) => {
  const sprite = getVirusSprite(health);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (sprite) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      sprite,
      centerX - (spriteSize / 2),
      centerY - (spriteSize / 2),
      spriteSize,
      spriteSize
    );
  } else {
    ctx.beginPath();
    ctx.arc(centerX, centerY, spriteSize * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = '#7c3aed';
    ctx.fill();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = Math.max(1, spriteSize * 0.035);
    ctx.stroke();
  }
  ctx.restore();
};

preloadVirusSprites();
preloadIceSprites();
preloadBombSprite();

const drawBlock = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  type?: CellType,
  alpha = 1,
  health?: number,
  bodyColorOverride?: string,
  clearSurfaceColor?: string,
  clearSurfaceProgress = 1
) => {
  const inset = Math.max(1, size * 0.045);
  const blockX = x + inset;
  const blockY = y + inset;
  const blockSize = size - (inset * 2);

  ctx.save();
  ctx.globalAlpha = alpha;
  roundRect(ctx, blockX, blockY, blockSize, blockSize, size * 0.14);
  ctx.fillStyle = bodyColorOverride ?? getCellColor(color, type);
  ctx.fill();

  if (clearSurfaceColor) {
    const innerShade = mixHexColors(clearSurfaceColor, '#020617', 0.16);
    const middleShade = mixHexColors(clearSurfaceColor, '#020617', 0.07);
    const centerX = blockX + (blockSize * 0.46);
    const centerY = blockY + (blockSize * 0.44);
    const surfaceGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      blockSize * 0.04,
      centerX,
      centerY,
      blockSize * 0.66
    );
    surfaceGradient.addColorStop(0, innerShade);
    surfaceGradient.addColorStop(0.46, middleShade);
    surfaceGradient.addColorStop(1, clearSurfaceColor);

    ctx.save();
    roundRect(ctx, blockX, blockY, blockSize, blockSize, size * 0.14);
    ctx.clip();
    ctx.globalAlpha = alpha * Math.max(0, Math.min(1, clearSurfaceProgress));
    ctx.fillStyle = surfaceGradient;
    ctx.fillRect(blockX, blockY, blockSize, blockSize);
    ctx.restore();
  }

  roundRect(
    ctx,
    blockX + (blockSize * 0.08),
    blockY + (blockSize * 0.08),
    blockSize * 0.84,
    blockSize * 0.18,
    size * 0.07
  );
  ctx.fillStyle = clearSurfaceColor
    ? 'rgba(255,255,255,0.12)'
    : 'rgba(255,255,255,0.18)';
  ctx.fill();

  if (type === CellType.BOMB) {
    const sprite = getBombSprite();
    if (sprite) {
      const spriteSize = blockSize * 1.8;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        sprite,
        blockX + ((blockSize - spriteSize) / 2),
        blockY + ((blockSize - spriteSize) / 2),
        spriteSize,
        spriteSize
      );
    } else {
      ctx.beginPath();
      ctx.arc(x + (size * 0.5), y + (size * 0.56), size * 0.23, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.strokeStyle = '#ff6b61';
      ctx.lineWidth = Math.max(1.4, size * 0.05);
      ctx.stroke();
    }
  } else if (type === CellType.FIRE) {
    const isWeak = health === 1;
    const sprite = getVirusSprite(health);

    if (sprite) {
      const spriteSize = blockSize * 1.28;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        sprite,
        blockX + ((blockSize - spriteSize) / 2),
        blockY + ((blockSize - spriteSize) / 2),
        spriteSize,
        spriteSize
      );
    } else {
      const coreSize = blockSize * 0.5;
      const coreX = blockX + ((blockSize - coreSize) / 2);
      const coreY = blockY + ((blockSize - coreSize) / 2);
      ctx.fillStyle = isWeak ? 'rgba(30,27,75,0.72)' : 'rgba(15,23,42,0.9)';
      ctx.fillRect(coreX, coreY, coreSize, coreSize);
      ctx.strokeStyle = isWeak ? '#8b5cf6' : '#c084fc';
      ctx.lineWidth = Math.max(1, size * 0.04);
      ctx.strokeRect(coreX, coreY, coreSize, coreSize);
    }
  } else if (type === CellType.ICE) {
    const isCracked = health === 1;
    const sprite = getIceSprite(health);

    roundRect(ctx, blockX, blockY, blockSize, blockSize, size * 0.14);
    ctx.fillStyle = isCracked ? 'rgba(14,116,144,0.14)' : 'rgba(125,211,252,0.12)';
    ctx.fill();

    if (sprite) {
      const spriteSize = blockSize * 1.22;
      ctx.save();
      roundRect(ctx, blockX, blockY, blockSize, blockSize, size * 0.14);
      ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        sprite,
        blockX + ((blockSize - spriteSize) / 2),
        blockY + ((blockSize - spriteSize) / 2),
        spriteSize,
        spriteSize
      );
      ctx.restore();
    } else {
      roundRect(ctx, blockX, blockY, blockSize, blockSize, size * 0.14);
      ctx.strokeStyle = isCracked ? '#38bdf8' : '#bae6fd';
      ctx.lineWidth = Math.max(1.4, size * 0.055);
      ctx.stroke();
    }
  } else if (type === CellType.VOID) {
    const voidGradient = ctx.createRadialGradient(
      x + (size * 0.5),
      y + (size * 0.5),
      size * 0.06,
      x + (size * 0.5),
      y + (size * 0.5),
      size * 0.48
    );
    voidGradient.addColorStop(0, '#030207');
    voidGradient.addColorStop(0.55, '#0d0717');
    voidGradient.addColorStop(1, '#2b1745');

    roundRect(ctx, blockX, blockY, blockSize, blockSize, size * 0.14);
    ctx.fillStyle = voidGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(139,92,246,0.72)';
    ctx.lineWidth = Math.max(1.2, size * 0.04);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + (size * 0.5), y + (size * 0.5), size * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#020104';
    ctx.fill();
    ctx.strokeStyle = 'rgba(196,181,253,0.35)';
    ctx.lineWidth = Math.max(0.8, size * 0.022);
    ctx.stroke();
  } else if (type === CellType.STONE) {
    roundRect(ctx, blockX, blockY, blockSize, blockSize, size * 0.14);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = Math.max(1.5, size * 0.05);
    ctx.stroke();

    const lockX = x + (size * 0.31);
    const lockY = y + (size * 0.45);
    const lockWidth = size * 0.38;
    const lockHeight = size * 0.31;
    ctx.beginPath();
    ctx.arc(x + (size * 0.5), y + (size * 0.43), size * 0.16, Math.PI, 0);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.max(1.5, size * 0.075);
    ctx.stroke();
    roundRect(ctx, lockX, lockY, lockWidth, lockHeight, size * 0.07);
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + (size * 0.5), y + (size * 0.58), size * 0.045, 0, Math.PI * 2);
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.fillRect(x + (size * 0.48), y + (size * 0.59), size * 0.04, size * 0.09);
  }

  ctx.restore();
};

const Grid2DComponent: React.FC<GridProps> = ({ grid }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<HoverState | null>(null);
  const drawFrameRef = useRef<number | null>(null);
  const gravityFrameRef = useRef<number | null>(null);
  const placementFrameRef = useRef<number | null>(null);
  const fireFeedbackFrameRef = useRef<number | null>(null);
  const clearColorFrameRef = useRef<number | null>(null);
  const gravityAnimationRef = useRef<GravityAnimation | null>(null);
  const placementAnimationRef = useRef<PlacementAnimation | null>(null);
  const clearAnimationRef = useRef<ClearAnimation | null>(null);
  const fireFeedbackAnimationRef = useRef<FireFeedbackAnimation | null>(null);
  const clearColorAnimationRef = useRef<ClearColorAnimation | null>(null);
  const gravityImpactPlayedRef = useRef(false);
  const lastAnimationDrawAtRef = useRef(0);
  const lastFireFeedbackDrawAtRef = useRef(0);
  const lastClearColorDrawAtRef = useRef(0);
  const lastGravityActionRef = useRef<unknown>(null);
  const lastPlacementActionRef = useRef<unknown>(null);
  const lastFireFeedbackActionRef = useRef<unknown>(null);
  const lastHoverHapticRef = useRef(0);
  const draggedPiece = useGameStore(state => state.draggedPiece);
  const canPlacePiece = useGameStore(state => state.canPlacePiece);
  const lastAction = useGameStore(state => state.lastAction);
  const pendingCorruption = useGameStore(state => state.pendingCorruption);
  const ghostBlockEnabled = useSettingsStore(state => state.ghostBlockEnabled);
  const themeColors = useThemeStore(state => state.getThemeColors());
  const deviceTier = usePerformanceStore(state => state.deviceTier);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const renderProfile = getGridRenderProfile(deviceTier, isAndroid);
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    if (size <= 0) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, renderProfile.pixelRatioCap);
    const targetWidth = Math.max(1, Math.round(rect.width * pixelRatio));
    const targetHeight = Math.max(1, Math.round(rect.height * pixelRatio));
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const metrics = getBoardMetrics(size);
    const boardRadius = Math.max(8, size * 0.035);
    const gravityAnimation = gravityAnimationRef.current;
    const gravityElapsed = gravityAnimation
      ? performance.now() - gravityAnimation.startedAt
      : 0;
    const gravityProgress = gravityAnimation
      ? Math.max(0, Math.min(1, gravityElapsed / gravityAnimation.duration))
      : 1;
    const movingIds = gravityAnimation && gravityProgress < 1
      ? new Set(gravityAnimation.moves.map(move => move.id))
      : null;
    const placementAnimation = placementAnimationRef.current;
    const placementElapsed = placementAnimation
      ? performance.now() - placementAnimation.startedAt
      : 0;
    const placementProgress = placementAnimation
      ? Math.max(0, Math.min(1, placementElapsed / placementAnimation.duration))
      : 1;
    const placedIds = placementAnimation && placementProgress < 1
      ? new Set(placementAnimation.cellIds)
      : null;
    const clearAnimation = clearAnimationRef.current;
    const clearElapsed = clearAnimation
      ? performance.now() - clearAnimation.startedAt
      : 0;
    const clearProgress = clearAnimation
      ? Math.max(0, Math.min(1, clearElapsed / clearAnimation.clearDuration))
      : 1;
    const fireFeedbackAnimation = fireFeedbackAnimationRef.current;
    const fireFeedbackElapsed = fireFeedbackAnimation
      ? performance.now() - fireFeedbackAnimation.startedAt
      : 0;
    const fireFeedbackProgress = fireFeedbackAnimation
      ? Math.max(0, Math.min(1, fireFeedbackElapsed / fireFeedbackAnimation.duration))
      : 1;
    const minimalEffects = renderProfile.effectLevel === 'minimal';
    const reducedEffects = renderProfile.effectLevel !== 'full';
    const hover = hoverRef.current;
    const clearPreviewLines = draggedPiece && hover?.valid
      ? getClearPreviewLines(grid, draggedPiece, hover.x, hover.y)
      : { rows: [], cols: [] };
    const clearPreviewRows = new Set(clearPreviewLines.rows);
    const clearPreviewCols = new Set(clearPreviewLines.cols);
    const clearPreviewKey = hover
      ? `${hover.x},${hover.y}:${clearPreviewLines.rows.join('.')}:${clearPreviewLines.cols.join('.')}`
      : '';
    const clearColorAnimation = clearColorAnimationRef.current;
    const clearColorProgress = clearColorAnimation?.key === clearPreviewKey
      ? Math.max(0, Math.min(1, (performance.now() - clearColorAnimation.startedAt) / clearColorAnimation.duration))
      : 1;

    roundRect(ctx, 0, 0, size, size, boardRadius);
    ctx.fillStyle = themeColors.gridBase;
    ctx.fill();
    ctx.strokeStyle = 'rgba(129,140,248,0.25)';
    ctx.lineWidth = Math.max(1, size * 0.004);
    ctx.stroke();

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const px = metrics.padding + (x * metrics.stride);
        const py = metrics.padding + (y * metrics.stride);
        roundRect(ctx, px, py, metrics.cellSize, metrics.cellSize, metrics.cellSize * 0.12);
        ctx.fillStyle = themeColors.gridSlot;
        ctx.fill();
        ctx.strokeStyle = themeColors.gridEdge;
        ctx.lineWidth = 1;
        ctx.stroke();

        const cell = grid[y]?.[x];
        if (cell?.filled && (!cell.id || (!movingIds?.has(cell.id) && !placedIds?.has(cell.id)))) {
          const usesClearColor = clearPreviewRows.has(y) || clearPreviewCols.has(x);
          const bodyColor = usesClearColor && draggedPiece
            ? mixHexColors(getCellColor(cell.color, cell.type), draggedPiece.color, clearColorProgress)
            : undefined;
          drawBlock(
            ctx,
            px,
            py,
            metrics.cellSize,
            cell.color,
            cell.type,
            1,
            cell.health,
            bodyColor,
            usesClearColor && draggedPiece ? draggedPiece.color : undefined,
            clearColorProgress
          );
        }
      }
    }

    if (placementAnimation && placementProgress < 1) {
      const settle = 1 - Math.pow(1 - placementProgress, 3);
      const bounce = Math.sin(placementProgress * Math.PI) * 0.035;
      const blockScale = 0.92 + (settle * 0.08) + bounce;
      const ringAlpha = Math.sin(placementProgress * Math.PI) * (reducedEffects ? 0.18 : 0.26);

      placementAnimation.cellIds.forEach((cellId) => {
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            const cell = grid[y]?.[x];
            if (!cell?.filled || cell.id !== cellId) continue;

            const px = metrics.padding + (x * metrics.stride);
            const py = metrics.padding + (y * metrics.stride);

            ctx.save();
            ctx.translate(px + (metrics.cellSize / 2), py + (metrics.cellSize / 2));
            ctx.scale(blockScale, blockScale);
            drawBlock(
              ctx,
              -(metrics.cellSize / 2),
              -(metrics.cellSize / 2),
              metrics.cellSize,
              cell.color,
              cell.type,
              1,
              cell.health
            );
            ctx.restore();

            if (ringAlpha > 0) {
              ctx.save();
              ctx.globalAlpha = ringAlpha;
              roundRect(
                ctx,
                px + (metrics.cellSize * 0.05),
                py + (metrics.cellSize * 0.05),
                metrics.cellSize * 0.9,
                metrics.cellSize * 0.9,
                metrics.cellSize * 0.12
              );
              ctx.strokeStyle = 'rgba(255,255,255,0.58)';
              ctx.lineWidth = Math.max(1, metrics.cellSize * 0.025);
              ctx.stroke();
              ctx.restore();
            }
            return;
          }
        }
      });
    }

    if (gravityAnimation && gravityProgress < 1) {
      const frame = getGravityFrame(gravityProgress);
      gravityAnimation.moves.forEach((move) => {
        const animatedY = move.fromY
          + ((move.toY - move.fromY) * frame.positionProgress)
          + frame.bounceOffset;
        const px = metrics.padding + (move.x * metrics.stride);
        const py = metrics.padding + (animatedY * metrics.stride);

        ctx.save();
        ctx.translate(px + (metrics.cellSize / 2), py + (metrics.cellSize / 2));
        ctx.scale(frame.scaleX, frame.scaleY);
        drawBlock(
          ctx,
          -(metrics.cellSize / 2),
          -(metrics.cellSize / 2),
          metrics.cellSize,
          move.color,
          move.cellType
        );
        ctx.restore();
      });

      if (gravityProgress >= 0.78) {
        const landingProgress = Math.min(1, (gravityProgress - 0.78) / 0.22);
        const bottomMoveByColumn = new Map<number, GravityMove>();
        gravityAnimation.moves.forEach((move) => {
          const current = bottomMoveByColumn.get(move.x);
          if (!current || move.toY > current.toY) bottomMoveByColumn.set(move.x, move);
        });

        bottomMoveByColumn.forEach((move) => {
          const centerX = metrics.padding + (move.x * metrics.stride) + (metrics.cellSize / 2);
          const centerY = metrics.padding + (move.toY * metrics.stride) + (metrics.cellSize * 0.9);
          ctx.save();
          ctx.globalAlpha = Math.sin(landingProgress * Math.PI) * 0.42;
          ctx.beginPath();
          ctx.ellipse(
            centerX,
            centerY,
            metrics.cellSize * (0.18 + (landingProgress * 0.34)),
            metrics.cellSize * (0.05 + (landingProgress * 0.07)),
            0,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = move.cellType === CellType.ICE ? '#67e8f9' : '#e2e8f0';
          ctx.lineWidth = Math.max(1, metrics.cellSize * 0.025 * (1 - (landingProgress * 0.35)));
          ctx.stroke();
          ctx.restore();
        });
      }
    }

    if (clearAnimation && clearElapsed < clearAnimation.duration) {
      clearAnimation.cells.forEach((cell) => {
        const px = metrics.padding + (cell.x * metrics.stride);
        const py = metrics.padding + (cell.y * metrics.stride);
        const distance = Math.abs(cell.x - clearAnimation.centerX)
          + Math.abs(cell.y - clearAnimation.centerY);
        const cellProgress = getClearCellProgress(
          clearProgress,
          distance,
          clearAnimation.maxDistance,
          clearAnimation.effect.staggerFraction
        );
        const impactProgress = Math.min(1, cellProgress / 0.28);
        const collapseProgress = Math.max(0, (cellProgress - 0.2) / 0.8);
        const impactBump = Math.sin(impactProgress * Math.PI)
          * (clearAnimation.effect.impactScale - 1);
        const blockScale = Math.max(0.04, 1 + impactBump - Math.pow(collapseProgress, 1.25));
        const effectColor = getEffectColor(cell, clearAnimation.effect.accentColor);
        const lineAccentColor = getLineClearColor(clearAnimation.lineCount);

        ctx.save();
        ctx.translate(px + (metrics.cellSize / 2), py + (metrics.cellSize / 2));
        ctx.scale(blockScale, blockScale);
        drawBlock(
          ctx,
          -(metrics.cellSize / 2),
          -(metrics.cellSize / 2),
          metrics.cellSize,
          cell.color,
          cell.cellType,
          Math.max(0, 1 - Math.pow(cellProgress, 1.6)),
          cell.cellType === CellType.ICE ? 1 : undefined
        );
        ctx.restore();

        if (!minimalEffects && clearAnimation.lineCount >= 2 && cellProgress > 0.03 && cellProgress < 0.7) {
          const accentProgress = Math.min(1, cellProgress / 0.36);
          ctx.save();
          ctx.globalAlpha = Math.sin(accentProgress * Math.PI) * 0.82;
          roundRect(
            ctx,
            px + (metrics.cellSize * 0.16),
            py + (metrics.cellSize * 0.18),
            metrics.cellSize * 0.68,
            Math.max(2, metrics.cellSize * 0.09),
            metrics.cellSize * 0.04
          );
          ctx.fillStyle = lineAccentColor;
          ctx.fill();
          ctx.restore();
        }

        if (
          !reducedEffects &&
          clearAnimation.lineCount >= 2 &&
          cellProgress > 0.08 &&
          cellProgress < 0.64 &&
          distance <= Math.max(0.72, clearAnimation.maxDistance * 0.11)
        ) {
          const badgeProgress = Math.min(1, (cellProgress - 0.08) / 0.28);
          const badgeWidth = metrics.cellSize * 0.48;
          const badgeHeight = metrics.cellSize * 0.28;
          ctx.save();
          ctx.globalAlpha = Math.sin(badgeProgress * Math.PI) * 0.92;
          ctx.translate(px + (metrics.cellSize / 2), py + (metrics.cellSize / 2));
          ctx.scale(0.9 + (badgeProgress * 0.1), 0.9 + (badgeProgress * 0.1));
          roundRect(ctx, -badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight, badgeHeight / 2);
          ctx.fillStyle = 'rgba(8,12,20,0.78)';
          ctx.fill();
          ctx.strokeStyle = `${lineAccentColor}aa`;
          ctx.lineWidth = Math.max(1, metrics.cellSize * 0.03);
          ctx.stroke();
          ctx.fillStyle = lineAccentColor;
          ctx.font = `900 ${Math.max(9, metrics.cellSize * 0.22)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${Math.min(clearAnimation.lineCount, 4)}x`, 0, 0);
          ctx.restore();
        }

        if (!minimalEffects && cellProgress > 0 && cellProgress < 0.72) {
          const ringProgress = Math.min(1, cellProgress / 0.58);
          ctx.save();
          ctx.globalAlpha = Math.sin(ringProgress * Math.PI) * 0.58;
          ctx.beginPath();
          ctx.arc(
            px + (metrics.cellSize / 2),
            py + (metrics.cellSize / 2),
            metrics.cellSize * (0.12 + (ringProgress * 0.26)),
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = effectColor;
          ctx.lineWidth = Math.max(1, metrics.cellSize * 0.04 * (1 - (ringProgress * 0.25)));
          ctx.stroke();
          ctx.restore();
        }

        if (!reducedEffects && cellProgress > 0.1 && cellProgress < 0.5) {
          const crackProgress = Math.min(1, (cellProgress - 0.1) / 0.28);
          const centerX = px + (metrics.cellSize / 2);
          const centerY = py + (metrics.cellSize / 2);
          ctx.save();
          ctx.globalAlpha = Math.min(1, crackProgress * 1.2) * (1 - cellProgress) * 0.72;
          ctx.strokeStyle = effectColor;
          ctx.lineWidth = Math.max(1, metrics.cellSize * 0.028);
          ctx.lineCap = 'round';
          ctx.beginPath();
          for (let branch = 0; branch < clearAnimation.effect.crackBranches; branch++) {
            const angle = ((cell.x * 3) + (cell.y * 5) + branch)
              * ((Math.PI * 2) / clearAnimation.effect.crackBranches);
            const length = metrics.cellSize * (0.18 + (branch * 0.035)) * crackProgress;
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
              centerX + (Math.cos(angle) * length),
              centerY + (Math.sin(angle) * length)
            );
          }
          ctx.stroke();
          ctx.restore();
        }
      });

      const particleProgress = Math.max(0, (clearProgress - 0.18) / 0.82);
      clearAnimation.particles.forEach((particle) => {
        const particleX = metrics.padding
          + ((particle.x + (particle.velocityX * particleProgress)) * metrics.stride);
        const particleY = metrics.padding
          + ((particle.y + (particle.velocityY * particleProgress) + (0.28 * particleProgress * particleProgress)) * metrics.stride);
        const particleSize = Math.max(
          1.6,
          particle.radius * metrics.cellSize * 1.7 * (1 - (particleProgress * 0.45))
        );
        ctx.save();
        ctx.translate(particleX, particleY);
        ctx.rotate((particleProgress * 3.2) + particle.velocityX);
        ctx.globalAlpha = Math.max(0, 1 - particleProgress);
        ctx.fillStyle = clearAnimation.effect.accentColor || particle.color;
        ctx.fillRect(-particleSize / 2, -particleSize / 2, particleSize, particleSize);
        ctx.restore();
      });

      if (!minimalEffects) clearAnimation.damagedIceCells.forEach((cell, index) => {
        const hitProgress = Math.max(0, Math.min(1, (clearElapsed - (index * 18)) / 280));
        if (hitProgress <= 0 || hitProgress >= 1) return;

        const centerX = metrics.padding + (cell.x * metrics.stride) + (metrics.cellSize / 2);
        const centerY = metrics.padding + (cell.y * metrics.stride) + (metrics.cellSize / 2);
        const pulse = Math.sin(hitProgress * Math.PI);

        ctx.save();
        ctx.globalAlpha = pulse * 0.72;
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          metrics.cellSize * (0.24 + (hitProgress * 0.32)),
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = Math.max(1, metrics.cellSize * 0.035 * (1 - (hitProgress * 0.4)));
        ctx.stroke();

        ctx.strokeStyle = '#f0f9ff';
        ctx.lineWidth = Math.max(1, metrics.cellSize * 0.028);
        ctx.lineCap = 'round';
        for (let branch = 0; branch < 3; branch++) {
          const angle = ((cell.x * 2) + cell.y + branch) * (Math.PI * 2 / 3);
          const length = metrics.cellSize * (0.08 + (hitProgress * 0.22));
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(
            centerX + (Math.cos(angle) * length),
            centerY + (Math.sin(angle) * length)
          );
          ctx.stroke();
        }

        for (let shard = 0; shard < 2; shard++) {
          const direction = shard === 0 ? -1 : 1;
          const shardX = centerX + (direction * metrics.cellSize * 0.3 * hitProgress);
          const shardY = centerY - (metrics.cellSize * 0.18 * hitProgress)
            + (metrics.cellSize * 0.16 * hitProgress * hitProgress);
          const shardSize = metrics.cellSize * 0.075 * (1 - (hitProgress * 0.35));
          ctx.save();
          ctx.translate(shardX, shardY);
          ctx.rotate(direction * hitProgress * 2.4);
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(-shardSize / 2, -shardSize / 2, shardSize, shardSize);
          ctx.restore();
        }
        ctx.restore();
      });

      if (!minimalEffects) clearAnimation.bombCells.forEach((cell, index) => {
        const bombProgress = Math.max(0, Math.min(1, (clearElapsed - (index * 60)) / 300));
        if (bombProgress <= 0 || bombProgress >= 1) return;

        const centerX = metrics.padding + (cell.x * metrics.stride) + (metrics.cellSize / 2);
        const centerY = metrics.padding + (cell.y * metrics.stride) + (metrics.cellSize / 2);
        const pulse = Math.sin(bombProgress * Math.PI);

        ctx.save();
        ctx.globalAlpha = pulse * 0.78;
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          metrics.cellSize * (0.18 + (bombProgress * 0.58)),
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = index % 2 === 0 ? '#fb923c' : '#facc15';
        ctx.lineWidth = Math.max(1.5, metrics.cellSize * 0.055 * (1 - (bombProgress * 0.45)));
        ctx.stroke();

        for (let spark = 0; spark < 6; spark++) {
          const angle = (spark / 6) * Math.PI * 2 + (index * 0.4);
          const distance = metrics.cellSize * (0.14 + (bombProgress * 0.46));
          const sparkSize = metrics.cellSize * 0.065 * (1 - (bombProgress * 0.4));
          ctx.save();
          ctx.translate(
            centerX + (Math.cos(angle) * distance),
            centerY + (Math.sin(angle) * distance)
          );
          ctx.rotate(angle + (bombProgress * 1.8));
          ctx.fillStyle = spark % 2 === 0 ? '#fde047' : '#f97316';
          ctx.fillRect(-sparkSize / 2, -sparkSize / 2, sparkSize, sparkSize);
          ctx.restore();
        }
        ctx.restore();
      });
    }

    if (pendingCorruption) {
      pendingCorruption.plans.forEach(plan => {
        const source = grid[plan.sourceY]?.[plan.sourceX];
        const target = grid[plan.y]?.[plan.x];
        if (source?.type !== CellType.FIRE || !target?.filled || target.type === CellType.FIRE) return;

        const directionX = Math.sign(plan.x - plan.sourceX);
        const directionY = Math.sign(plan.y - plan.sourceY);
        const stage = Math.max(0, Math.min(2, 2 - pendingCorruption.turnsRemaining));
        const sourceCenterX = metrics.padding + (plan.sourceX * metrics.stride) + (metrics.cellSize / 2);
        const sourceCenterY = metrics.padding + (plan.sourceY * metrics.stride) + (metrics.cellSize / 2);
        const offset = stage === 0 ? 0.17 : stage === 1 ? 0.29 : 0.4;
        const budCenterX = sourceCenterX + (directionX * metrics.cellSize * offset);
        const budCenterY = sourceCenterY + (directionY * metrics.cellSize * offset);

        if (stage === 0) {
          const nucleusSize = metrics.cellSize * 0.075;
          ctx.fillStyle = 'rgba(15,23,42,0.9)';
          ctx.fillRect(
            budCenterX - (nucleusSize * 0.72),
            budCenterY - (nucleusSize * 0.72),
            nucleusSize * 1.44,
            nucleusSize * 1.44
          );
          ctx.fillStyle = '#67e8f9';
          ctx.fillRect(
            budCenterX - (nucleusSize / 2),
            budCenterY - (nucleusSize / 2),
            nucleusSize,
            nucleusSize
          );
        } else {
          drawVirusSpriteAt(
            ctx,
            budCenterX,
            budCenterY,
            metrics.cellSize * (stage === 1 ? 0.42 : 0.5),
            stage === 1 ? 0.72 : 0.9
          );
        }
      });
    }

    if (fireFeedbackAnimation && fireFeedbackProgress < 1) {
      fireFeedbackAnimation.cells.forEach((cell, index) => {
        const px = metrics.padding + (cell.x * metrics.stride);
        const py = metrics.padding + (cell.y * metrics.stride);
        const centerX = px + (metrics.cellSize / 2);
        const centerY = py + (metrics.cellSize / 2);
        const delay = cell.kind === 'spread'
          ? Math.min(0.16, index * 0.16)
          : Math.min(0.22, index * 0.11);
        const localProgress = Math.max(0, Math.min(1, (fireFeedbackProgress - delay) / (1 - delay)));
        if (localProgress >= 1 || (localProgress <= 0 && cell.kind !== 'spread')) return;

        const isDamage = cell.kind === 'damage';
        const isSpread = cell.kind === 'spread';

        if (isSpread && cell.sourceX !== undefined && cell.sourceY !== undefined) {
          const sourceX = metrics.padding + (cell.sourceX * metrics.stride) + (metrics.cellSize / 2);
          const sourceY = metrics.padding + (cell.sourceY * metrics.stride) + (metrics.cellSize / 2);
          const directionX = Math.sign(cell.x - cell.sourceX);
          const directionY = Math.sign(cell.y - cell.sourceY);
          const launchProgress = Math.max(0, Math.min(1, (localProgress - 0.06) / 0.58));
          const landingProgress = Math.max(0, Math.min(1, (localProgress - 0.62) / 0.38));
          const startX = sourceX + (directionX * metrics.cellSize * 0.2);
          const startY = sourceY + (directionY * metrics.cellSize * 0.2);
          const perpendicularX = -directionY;
          const perpendicularY = directionX;
          const arcDirection = index % 2 === 0 ? 1 : -1;
          const arcOffset = Math.sin(launchProgress * Math.PI) * metrics.cellSize * 0.18 * arcDirection;
          const movingX = startX + ((centerX - startX) * launchProgress) + (perpendicularX * arcOffset);
          const movingY = startY + ((centerY - startY) * launchProgress) + (perpendicularY * arcOffset);

          // Hide the already-mutated target until the travelling virus reaches it.
          drawBlock(ctx, px, py, metrics.cellSize, cell.color);

          if (localProgress < 0.2) {
            const squeeze = Math.sin((localProgress / 0.2) * Math.PI);
            const nucleusSize = metrics.cellSize * (0.055 + (squeeze * 0.035));
            ctx.fillStyle = '#67e8f9';
            ctx.fillRect(
              sourceX - (nucleusSize / 2),
              sourceY - (nucleusSize / 2),
              nucleusSize,
              nucleusSize
            );
          }

          if (landingProgress < 0.18) {
            drawVirusSpriteAt(
              ctx,
              movingX,
              movingY,
              metrics.cellSize * (0.48 + (Math.sin(launchProgress * Math.PI) * 0.08)),
              1 - (landingProgress / 0.18)
            );
          }

          if (landingProgress > 0) {
            const easedLanding = 1 - Math.pow(1 - landingProgress, 3);
            drawVirusSpriteAt(
              ctx,
              centerX,
              centerY,
              metrics.cellSize * (0.34 + (easedLanding * 0.94)),
              Math.min(1, landingProgress * 2.4)
            );
          }

          return;
        }

        const targetProgress = isSpread
          ? Math.max(0, Math.min(1, (localProgress - 0.36) / 0.64))
          : localProgress;
        const normalHold = minimalEffects ? 0.52 : 0.34;
        const corruptionProgress = isSpread
          ? Math.max(0, Math.min(1, (targetProgress - normalHold) / (1 - normalHold)))
          : targetProgress;
        const localPulse = Math.sin(corruptionProgress * Math.PI);
        const strokeColor = isDamage ? '#c4b5fd' : isSpread ? '#67e8f9' : '#c084fc';
        const fillColor = isDamage ? '#312e81' : '#7c3aed';

        if (isSpread && cell.sourceX !== undefined && cell.sourceY !== undefined) {
          const sourceX = metrics.padding + (cell.sourceX * metrics.stride) + (metrics.cellSize / 2);
          const sourceY = metrics.padding + (cell.sourceY * metrics.stride) + (metrics.cellSize / 2);
          const sourceProgress = Math.min(1, localProgress / 0.42);
          const sourcePulse = Math.sin(sourceProgress * Math.PI);

          ctx.save();
          ctx.globalAlpha = sourcePulse * 0.76;
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(
            sourceX - (metrics.cellSize * 0.24),
            sourceY - (metrics.cellSize * 0.24),
            metrics.cellSize * (0.2 + (sourceProgress * 0.16)),
            metrics.cellSize * 0.08
          );
          ctx.fillStyle = '#67e8f9';
          ctx.fillRect(
            sourceX + (metrics.cellSize * 0.05),
            sourceY + (metrics.cellSize * 0.11),
            metrics.cellSize * 0.16,
            metrics.cellSize * 0.08
          );
          ctx.restore();

        }

        if (targetProgress <= 0) return;

        if (isSpread && cell.sourceX !== undefined && cell.sourceY !== undefined) {
          // The original block remains readable briefly while corruption enters from the source edge.
          const originalAlpha = 1 - corruptionProgress;
          if (originalAlpha > 0) {
            drawBlock(ctx, px, py, metrics.cellSize, cell.color, undefined, originalAlpha);
          }

          const entryProgress = Math.max(0, Math.min(1, targetProgress / (normalHold + 0.28)));
          const directionX = Math.sign(cell.x - cell.sourceX);
          const directionY = Math.sign(cell.y - cell.sourceY);
          const entryOffset = metrics.cellSize * (0.06 + (entryProgress * 0.53));
          const pixelSize = metrics.cellSize * 0.07;

          for (let pixel = 0; pixel < (reducedEffects ? 2 : 3); pixel++) {
            const crossOffset = metrics.cellSize * ((pixel - 1) * 0.13);
            const pixelX = directionX !== 0
              ? centerX - (directionX * (metrics.cellSize * 0.42 - entryOffset))
              : centerX + crossOffset;
            const pixelY = directionY !== 0
              ? centerY - (directionY * (metrics.cellSize * 0.42 - entryOffset))
              : centerY + crossOffset;

            ctx.save();
            ctx.globalAlpha = Math.min(1, 0.55 + (entryProgress * 0.45));
            ctx.fillStyle = pixel === 1 ? '#67e8f9' : '#c084fc';
            ctx.fillRect(
              pixelX - (pixelSize / 2),
              pixelY - (pixelSize / 2),
              pixelSize,
              pixelSize
            );
            ctx.restore();
          }
        }

        if (corruptionProgress <= 0) return;

        ctx.save();
        ctx.globalAlpha = localPulse * (isDamage ? 0.68 : 0.76);
        roundRect(
          ctx,
          px + (metrics.cellSize * (0.08 - (corruptionProgress * 0.03))),
          py + (metrics.cellSize * (0.08 - (corruptionProgress * 0.03))),
          metrics.cellSize * (0.84 + (corruptionProgress * 0.06)),
          metrics.cellSize * (0.84 + (corruptionProgress * 0.06)),
          metrics.cellSize * 0.14
        );
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(1, metrics.cellSize * (isDamage ? 0.035 : 0.045) * (1 - (corruptionProgress * 0.35)));
        ctx.stroke();

        if (!minimalEffects) {
          for (let pixel = 0; pixel < (reducedEffects ? 2 : 3); pixel++) {
            const pixelSize = metrics.cellSize * (0.065 - (corruptionProgress * 0.015));
            const offset = metrics.cellSize * (0.13 + (pixel * 0.14));
            ctx.save();
            ctx.globalAlpha = localPulse * (pixel === 1 ? 0.72 : 0.9);
            ctx.fillStyle = pixel === 1 ? '#67e8f9' : fillColor;
            ctx.fillRect(
              centerX - offset,
              centerY + ((pixel - 1) * metrics.cellSize * 0.11),
              pixelSize,
              pixelSize
            );
            ctx.restore();
          }
        }
        ctx.restore();
      });
    }

    if (draggedPiece && hover && ghostBlockEnabled) {
      draggedPiece.shape.forEach((row, dy) => {
        row.forEach((filled, dx) => {
          if (!filled) return;
          const gridX = hover.x + dx;
          const gridY = hover.y + dy;
          if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) return;

          const px = metrics.padding + (gridX * metrics.stride);
          const py = metrics.padding + (gridY * metrics.stride);
          drawBlock(
            ctx,
            px,
            py,
            metrics.cellSize,
            hover.valid ? draggedPiece.color : '#94a3b8',
            hover.valid ? draggedPiece.type : undefined,
            hover.valid ? 0.58 : 0.42
          );
        });
      });
    }
  }, [draggedPiece, ghostBlockEnabled, grid, pendingCorruption, renderProfile.effectLevel, renderProfile.pixelRatioCap, themeColors]);

  const scheduleDraw = useCallback(() => {
    if (document.hidden) return;
    if (drawFrameRef.current !== null) return;
    drawFrameRef.current = requestAnimationFrame(() => {
      drawFrameRef.current = null;
      draw();
    });
  }, [draw]);

  const stopClearColorTransition = useCallback((keepFinalColor = false) => {
    if (clearColorFrameRef.current !== null) {
      cancelAnimationFrame(clearColorFrameRef.current);
      clearColorFrameRef.current = null;
    }
    lastClearColorDrawAtRef.current = 0;
    if (!keepFinalColor) clearColorAnimationRef.current = null;
  }, []);

  const startClearColorTransition = useCallback((key: string) => {
    if (clearColorAnimationRef.current?.key === key) return;
    stopClearColorTransition();

    clearColorAnimationRef.current = {
      key,
      startedAt: performance.now(),
      duration: 80,
    };

    const animate = (currentTime: number) => {
      const animation = clearColorAnimationRef.current;
      if (!animation || document.hidden) {
        clearColorFrameRef.current = null;
        return;
      }

      if (shouldRenderAnimationFrame(lastClearColorDrawAtRef.current, currentTime, renderProfile.targetFps)) {
        draw();
        lastClearColorDrawAtRef.current = currentTime;
      }

      if (currentTime - animation.startedAt < animation.duration) {
        clearColorFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      clearColorFrameRef.current = null;
      lastClearColorDrawAtRef.current = 0;
      draw();
    };

    clearColorFrameRef.current = requestAnimationFrame(animate);
  }, [draw, renderProfile.targetFps, stopClearColorTransition]);

  const updateHover = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !draggedPiece) {
      const hadHover = hoverRef.current !== null;
      hoverRef.current = null;
      setSharedHoverCoord(null);
      stopClearColorTransition();
      if (hadHover) scheduleDraw();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const raw = pointerToPieceOrigin(
      clientX - rect.left,
      clientY + getDragYOffset() - rect.top,
      size,
      draggedPiece
    );
    const snapped = findBestPlacement(grid, draggedPiece, raw.x, raw.y, 1);
    const position = snapped ?? raw;
    const valid = canPlacePiece(grid, draggedPiece, position.x, position.y);
    const previous = hoverRef.current;
    const hoverChanged = !previous
      || previous.x !== position.x
      || previous.y !== position.y
      || previous.valid !== valid;

    if (!hoverChanged) return;

    hoverRef.current = { ...position, valid };
    setSharedHoverCoord(position);

    const previewLines = valid
      ? getClearPreviewLines(grid, draggedPiece, position.x, position.y)
      : { rows: [], cols: [] };
    if (previewLines.rows.length > 0 || previewLines.cols.length > 0) {
      startClearColorTransition(
        `${position.x},${position.y}:${previewLines.rows.join('.')}:${previewLines.cols.join('.')}`
      );
    } else {
      stopClearColorTransition();
    }

    if (!previous || previous.x !== position.x || previous.y !== position.y) {
      const now = performance.now();
      if (now - lastHoverHapticRef.current >= 80) {
        gameFeelEvents.dragHover();
        lastHoverHapticRef.current = now;
      }
    }

    scheduleDraw();
  }, [canPlacePiece, draggedPiece, grid, scheduleDraw, startClearColorTransition, stopClearColorTransition]);

  useEffect(() => {
    if (!draggedPiece) return;

    const handlePointerMove = (event: PointerEvent) => {
      const activePointerId = getActiveDragPointerId();
      if (activePointerId !== null && event.pointerId !== activePointerId) return;
      if (draggedPiece) recordPointerSample(event.clientX, event.clientY);
      updateHover(event.clientX, event.clientY);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true, capture: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove, true);
    };
  }, [draggedPiece, updateHover]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (drawFrameRef.current !== null) cancelAnimationFrame(drawFrameRef.current);
        if (gravityFrameRef.current !== null) cancelAnimationFrame(gravityFrameRef.current);
        if (placementFrameRef.current !== null) cancelAnimationFrame(placementFrameRef.current);
        if (fireFeedbackFrameRef.current !== null) cancelAnimationFrame(fireFeedbackFrameRef.current);
        if (clearColorFrameRef.current !== null) cancelAnimationFrame(clearColorFrameRef.current);
        drawFrameRef.current = null;
        gravityFrameRef.current = null;
        placementFrameRef.current = null;
        fireFeedbackFrameRef.current = null;
        clearColorFrameRef.current = null;
        gravityAnimationRef.current = null;
        placementAnimationRef.current = null;
        clearAnimationRef.current = null;
        fireFeedbackAnimationRef.current = null;
        clearColorAnimationRef.current = null;
        lastAnimationDrawAtRef.current = 0;
        lastFireFeedbackDrawAtRef.current = 0;
        lastClearColorDrawAtRef.current = 0;
        return;
      }

      scheduleDraw();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [scheduleDraw]);

  useEffect(() => {
    if (draggedPiece) {
      const pointer = getSharedPointerPosition();
      if (pointer) updateHover(pointer.x, pointer.y);
    } else {
      hoverRef.current = null;
      setSharedHoverCoord(null);
      stopClearColorTransition();
      scheduleDraw();
    }
  }, [draggedPiece, scheduleDraw, stopClearColorTransition, updateHover]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      setCanvasRect(rect);
      scheduleDraw();
    };
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateSize)
      : null;

    observer?.observe(canvas as unknown as Element);
    window.addEventListener('resize', updateSize);
    updateSize();

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [scheduleDraw]);

  useEffect(() => {
    scheduleDraw();
  }, [grid, ghostBlockEnabled, scheduleDraw, themeColors]);

  useEffect(() => {
    if (
      lastAction === lastPlacementActionRef.current ||
      lastAction?.type !== 'PLACE' ||
      !lastAction.cellIds?.length
    ) {
      return;
    }

    lastPlacementActionRef.current = lastAction;
    placementAnimationRef.current = {
      cellIds: lastAction.cellIds,
      startedAt: performance.now(),
      duration: renderProfile.effectLevel === 'minimal' ? 80 : 110,
    };

    if (document.hidden) {
      placementAnimationRef.current = null;
      return;
    }

    if (placementFrameRef.current !== null) {
      cancelAnimationFrame(placementFrameRef.current);
      placementFrameRef.current = null;
    }

    const animatePlacement = () => {
      if (document.hidden) {
        placementFrameRef.current = null;
        placementAnimationRef.current = null;
        return;
      }

      draw();

      const animation = placementAnimationRef.current;
      if (animation && performance.now() - animation.startedAt < animation.duration) {
        placementFrameRef.current = requestAnimationFrame(animatePlacement);
        return;
      }

      placementAnimationRef.current = null;
      placementFrameRef.current = null;
      draw();
    };

    placementFrameRef.current = requestAnimationFrame(animatePlacement);

    return () => {
      if (placementFrameRef.current !== null) cancelAnimationFrame(placementFrameRef.current);
      placementFrameRef.current = null;
      placementAnimationRef.current = null;
    };
  }, [draw, lastAction, renderProfile.effectLevel]);

  useEffect(() => {
    if (lastAction === lastFireFeedbackActionRef.current || !lastAction) return;

    const maxCells = renderProfile.effectLevel === 'full' ? 8 : 4;
    const cells: FireFeedbackCell[] = [
      ...(lastAction.fireSpawnedCells ?? []).map(cell => ({ ...cell, kind: 'spawn' as const })),
      ...(lastAction.fireSpreadCells ?? []).map(cell => ({ ...cell, kind: 'spread' as const })),
      ...(lastAction.damagedFireCells ?? []).map(cell => ({ ...cell, kind: 'damage' as const })),
    ].slice(0, maxCells);

    if (cells.length === 0) return;

    lastFireFeedbackActionRef.current = lastAction;
    fireFeedbackAnimationRef.current = {
      cells,
      startedAt: performance.now(),
      duration: renderProfile.effectLevel === 'minimal' ? 220 : 420,
    };

    if (document.hidden) {
      fireFeedbackAnimationRef.current = null;
      return;
    }

    if (fireFeedbackFrameRef.current !== null) {
      cancelAnimationFrame(fireFeedbackFrameRef.current);
      fireFeedbackFrameRef.current = null;
    }

    lastFireFeedbackDrawAtRef.current = 0;
    const animateFireFeedback = (currentTime: number) => {
      if (document.hidden) {
        fireFeedbackFrameRef.current = null;
        fireFeedbackAnimationRef.current = null;
        lastFireFeedbackDrawAtRef.current = 0;
        return;
      }

      if (shouldRenderAnimationFrame(lastFireFeedbackDrawAtRef.current, currentTime, renderProfile.targetFps)) {
        draw();
        lastFireFeedbackDrawAtRef.current = currentTime;
      }

      const animation = fireFeedbackAnimationRef.current;
      if (animation && currentTime - animation.startedAt < animation.duration) {
        fireFeedbackFrameRef.current = requestAnimationFrame(animateFireFeedback);
        return;
      }

      fireFeedbackAnimationRef.current = null;
      fireFeedbackFrameRef.current = null;
      lastFireFeedbackDrawAtRef.current = 0;
      draw();
    };

    fireFeedbackFrameRef.current = requestAnimationFrame(animateFireFeedback);

    return () => {
      if (fireFeedbackFrameRef.current !== null) cancelAnimationFrame(fireFeedbackFrameRef.current);
      fireFeedbackFrameRef.current = null;
      fireFeedbackAnimationRef.current = null;
      lastFireFeedbackDrawAtRef.current = 0;
    };
  }, [draw, lastAction, renderProfile.effectLevel, renderProfile.targetFps]);

  useEffect(() => {
    if (
      lastAction === lastGravityActionRef.current ||
      lastAction?.type !== 'CLEAR' ||
      (!lastAction.clearedCells?.length && !lastAction.movedCells?.length)
    ) {
      return;
    }

    lastGravityActionRef.current = lastAction;
    const clearedCells = lastAction.clearedCells ?? [];
    const moves = getGravityMoves(grid, lastAction.movedCells ?? []);
    const minimalEffects = renderProfile.effectLevel === 'minimal';
    const reducedEffects = renderProfile.effectLevel !== 'full';
    const damagedIceCells = minimalEffects
      ? []
      : (lastAction.damagedIceCells ?? []).slice(0, reducedEffects ? 3 : 6);
    const bombCells = minimalEffects
      ? []
      : (lastAction.bombCells ?? []).slice(0, reducedEffects ? 2 : 5);
    const now = performance.now();
    const effect = getClearEffectConfig(lastAction.lines ?? 1, lastAction.combo ?? 1);
    const centerX = clearedCells.reduce((sum, cell) => sum + cell.x, 0) / Math.max(1, clearedCells.length);
    const centerY = clearedCells.reduce((sum, cell) => sum + cell.y, 0) / Math.max(1, clearedCells.length);
    const maxDistance = clearedCells.reduce((maximum, cell) => Math.max(
      maximum,
      Math.abs(cell.x - centerX) + Math.abs(cell.y - centerY)
    ), 0);

    const animationDurationScale = minimalEffects ? 0.72 : reducedEffects ? 0.86 : 1;
    clearAnimationRef.current = {
      cells: clearedCells,
      particles: createClearParticles(
        clearedCells.map(cell => ({
          ...cell,
          color: cell.cellType === CellType.ICE ? '#67e8f9' : cell.color,
        })),
        Math.round(effect.maxParticles * renderProfile.particleMultiplier)
      ),
      startedAt: now,
      duration: Math.round(Math.max(
        effect.duration,
        damagedIceCells.length > 0 ? 280 + ((damagedIceCells.length - 1) * 18) : 0,
        bombCells.length > 0 ? 300 + ((bombCells.length - 1) * 60) : 0
      ) * animationDurationScale),
      clearDuration: Math.round(effect.duration * animationDurationScale),
      centerX,
      centerY,
      maxDistance,
      lineCount: lastAction.lines ?? 1,
      effect,
      damagedIceCells,
      bombCells,
    };

    if (moves.length > 0) {
      const longestDrop = Math.max(...moves.map(move => move.toY - move.fromY));
      const bombDelay = bombCells.length > 0 ? 180 + ((bombCells.length - 1) * 60) : 90;
      gravityAnimationRef.current = {
        moves,
        startedAt: now + bombDelay,
        duration: Math.min(340, 210 + (longestDrop * 18)),
      };
      gravityImpactPlayedRef.current = false;
    }

    if (document.hidden) {
      gravityAnimationRef.current = null;
      clearAnimationRef.current = null;
      return;
    }

    lastAnimationDrawAtRef.current = 0;
    const animateGravity = (currentTime: number) => {
      if (document.hidden) {
        gravityFrameRef.current = null;
        gravityAnimationRef.current = null;
        clearAnimationRef.current = null;
        lastAnimationDrawAtRef.current = 0;
        return;
      }

      if (shouldRenderAnimationFrame(lastAnimationDrawAtRef.current, currentTime, renderProfile.targetFps)) {
        draw();
        lastAnimationDrawAtRef.current = currentTime;
      }

      const gravityAnimation = gravityAnimationRef.current;
      const clearAnimation = clearAnimationRef.current;
      const gravityActive = !!gravityAnimation &&
        currentTime - gravityAnimation.startedAt < gravityAnimation.duration;
      const clearActive = !!clearAnimation &&
        currentTime - clearAnimation.startedAt < clearAnimation.duration;
      const gravityJustLanded = !!gravityAnimation &&
        currentTime >= gravityAnimation.startedAt + gravityAnimation.duration;

      if (gravityJustLanded && !gravityImpactPlayedRef.current) {
        gravityImpactPlayedRef.current = true;
        const longestDrop = Math.max(...gravityAnimation.moves.map(move => move.toY - move.fromY));
        const strength = Math.min(1.2, 0.72 + (longestDrop * 0.07));
        playGravityLand(strength);
        gameFeelEvents.gravityLand(strength);
      }

      if (gravityActive || clearActive) {
        gravityFrameRef.current = requestAnimationFrame(animateGravity);
        return;
      }

      gravityAnimationRef.current = null;
      clearAnimationRef.current = null;
      gravityFrameRef.current = null;
      lastAnimationDrawAtRef.current = 0;
      draw();
    };

    gravityFrameRef.current = requestAnimationFrame(animateGravity);
    return () => {
      if (gravityFrameRef.current !== null) cancelAnimationFrame(gravityFrameRef.current);
      gravityFrameRef.current = null;
      gravityAnimationRef.current = null;
      clearAnimationRef.current = null;
      lastAnimationDrawAtRef.current = 0;
    };
  }, [draw, grid, lastAction, renderProfile.effectLevel, renderProfile.particleMultiplier, renderProfile.targetFps]);

  useEffect(() => () => {
    if (drawFrameRef.current !== null) cancelAnimationFrame(drawFrameRef.current);
    if (gravityFrameRef.current !== null) cancelAnimationFrame(gravityFrameRef.current);
    if (placementFrameRef.current !== null) cancelAnimationFrame(placementFrameRef.current);
    if (fireFeedbackFrameRef.current !== null) cancelAnimationFrame(fireFeedbackFrameRef.current);
    if (clearColorFrameRef.current !== null) cancelAnimationFrame(clearColorFrameRef.current);
    placementAnimationRef.current = null;
    clearAnimationRef.current = null;
    fireFeedbackAnimationRef.current = null;
    clearColorAnimationRef.current = null;
    lastAnimationDrawAtRef.current = 0;
    lastFireFeedbackDrawAtRef.current = 0;
    lastClearColorDrawAtRef.current = 0;
    setSharedHoverCoord(null);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        data-grid-container
        data-renderer="canvas-2d"
        className={clsx(
          'w-full h-full touch-none outline-none block',
          'grid-container interactive-element'
        )}
      />
    </div>
  );
};

export const Grid2D = React.memo(Grid2DComponent, (previous, next) => (
  previous.grid === next.grid
));
