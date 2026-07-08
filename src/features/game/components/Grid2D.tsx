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
  if (type === CellType.ICE) return '#7dd3fc';
  if (type === CellType.BOMB) return '#1c1917';
  if (type === CellType.STONE) return '#475569';
  if (type === CellType.VOID) return '#170d28';
  return color || '#a855f7';
};

const getEffectColor = (cell: ClearAnimationCell, accentColor: string | null): string => {
  if (accentColor) return accentColor;
  if (cell.cellType === CellType.ICE) return '#67e8f9';
  if (cell.cellType === CellType.BOMB) return '#f97316';
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

const drawBlock = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  type?: CellType,
  alpha = 1,
  health?: number
) => {
  const inset = Math.max(1, size * 0.045);
  const blockX = x + inset;
  const blockY = y + inset;
  const blockSize = size - (inset * 2);

  ctx.save();
  ctx.globalAlpha = alpha;
  roundRect(ctx, blockX, blockY, blockSize, blockSize, size * 0.14);
  ctx.fillStyle = getCellColor(color, type);
  ctx.fill();

  roundRect(
    ctx,
    blockX + (blockSize * 0.08),
    blockY + (blockSize * 0.08),
    blockSize * 0.84,
    blockSize * 0.18,
    size * 0.07
  );
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fill();

  if (type === CellType.BOMB) {
    roundRect(ctx, blockX, blockY, blockSize, blockSize, size * 0.14);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = Math.max(1.5, size * 0.055);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + (size * 0.48), y + (size * 0.56), size * 0.235, 0, Math.PI * 2);
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = Math.max(1.5, size * 0.055);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + (size * 0.41), y + (size * 0.49), size * 0.055, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + (size * 0.59), y + (size * 0.36));
    ctx.quadraticCurveTo(
      x + (size * 0.68), y + (size * 0.19),
      x + (size * 0.77), y + (size * 0.28)
    );
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = Math.max(1.5, size * 0.06);
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + (size * 0.75), y + (size * 0.20), size * 0.075, size * 0.075);
  } else if (type === CellType.ICE) {
    const isCracked = health === 1;

    const iceGradient = ctx.createLinearGradient(
      blockX,
      blockY,
      blockX + blockSize,
      blockY + blockSize
    );
    if (isCracked) {
      iceGradient.addColorStop(0, '#c7edf7');
      iceGradient.addColorStop(0.5, '#4aa9cb');
      iceGradient.addColorStop(1, '#0c5f83');
    } else {
      iceGradient.addColorStop(0, '#e6f8ff');
      iceGradient.addColorStop(0.52, '#83d7ef');
      iceGradient.addColorStop(1, '#1686b1');
    }

    roundRect(ctx, blockX, blockY, blockSize, blockSize, size * 0.14);
    ctx.fillStyle = iceGradient;
    ctx.fill();

    // Two broad facets read as ice without turning every cell into an icon.
    ctx.beginPath();
    ctx.moveTo(blockX + (blockSize * 0.08), blockY + (blockSize * 0.08));
    ctx.lineTo(blockX + (blockSize * 0.72), blockY + (blockSize * 0.08));
    ctx.lineTo(blockX + (blockSize * 0.42), blockY + (blockSize * 0.48));
    ctx.lineTo(blockX + (blockSize * 0.08), blockY + (blockSize * 0.62));
    ctx.closePath();
    ctx.fillStyle = isCracked ? 'rgba(240,249,255,0.18)' : 'rgba(255,255,255,0.34)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(blockX + (blockSize * 0.42), blockY + (blockSize * 0.48));
    ctx.lineTo(blockX + (blockSize * 0.92), blockY + (blockSize * 0.22));
    ctx.lineTo(blockX + (blockSize * 0.92), blockY + (blockSize * 0.92));
    ctx.lineTo(blockX + (blockSize * 0.56), blockY + (blockSize * 0.92));
    ctx.closePath();
    ctx.fillStyle = isCracked ? 'rgba(3,65,92,0.2)' : 'rgba(3,105,161,0.14)';
    ctx.fill();

    roundRect(ctx, blockX, blockY, blockSize, blockSize, size * 0.14);
    ctx.strokeStyle = isCracked ? 'rgba(186,230,253,0.78)' : 'rgba(240,249,255,0.86)';
    ctx.lineWidth = Math.max(1.2, size * 0.04);
    ctx.stroke();

    roundRect(
      ctx,
      blockX + (size * 0.055),
      blockY + (size * 0.055),
      blockSize - (size * 0.11),
      blockSize - (size * 0.11),
      size * 0.1
    );
    ctx.strokeStyle = isCracked ? 'rgba(7,89,133,0.44)' : 'rgba(14,116,144,0.32)';
    ctx.lineWidth = Math.max(0.8, size * 0.018);
    ctx.stroke();

    if (isCracked) {
      ctx.beginPath();
      ctx.moveTo(x + (size * 0.46), y + (size * 0.12));
      ctx.lineTo(x + (size * 0.52), y + (size * 0.38));
      ctx.lineTo(x + (size * 0.38), y + (size * 0.55));
      ctx.lineTo(x + (size * 0.27), y + (size * 0.76));
      ctx.moveTo(x + (size * 0.52), y + (size * 0.38));
      ctx.lineTo(x + (size * 0.68), y + (size * 0.51));
      ctx.lineTo(x + (size * 0.78), y + (size * 0.67));
      ctx.moveTo(x + (size * 0.38), y + (size * 0.55));
      ctx.lineTo(x + (size * 0.53), y + (size * 0.68));
      ctx.lineTo(x + (size * 0.49), y + (size * 0.84));
      ctx.strokeStyle = 'rgba(3,50,72,0.72)';
      ctx.lineWidth = Math.max(1.2, size * 0.042);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.strokeStyle = 'rgba(224,242,254,0.68)';
      ctx.lineWidth = Math.max(0.7, size * 0.014);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x + (size * 0.22), y + (size * 0.3));
      ctx.lineTo(x + (size * 0.42), y + (size * 0.2));
      ctx.strokeStyle = 'rgba(255,255,255,0.72)';
      ctx.lineWidth = Math.max(1.2, size * 0.04);
      ctx.lineCap = 'round';
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
  const gravityAnimationRef = useRef<GravityAnimation | null>(null);
  const placementAnimationRef = useRef<PlacementAnimation | null>(null);
  const clearAnimationRef = useRef<ClearAnimation | null>(null);
  const gravityImpactPlayedRef = useRef(false);
  const lastAnimationDrawAtRef = useRef(0);
  const lastGravityActionRef = useRef<unknown>(null);
  const lastPlacementActionRef = useRef<unknown>(null);
  const lastHoverHapticRef = useRef(0);
  const draggedPiece = useGameStore(state => state.draggedPiece);
  const canPlacePiece = useGameStore(state => state.canPlacePiece);
  const lastAction = useGameStore(state => state.lastAction);
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
    const minimalEffects = renderProfile.effectLevel === 'minimal';
    const reducedEffects = renderProfile.effectLevel !== 'full';

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
          drawBlock(ctx, px, py, metrics.cellSize, cell.color, cell.type, 1, cell.health);
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

    const hover = hoverRef.current;
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
  }, [draggedPiece, ghostBlockEnabled, grid, renderProfile.effectLevel, renderProfile.pixelRatioCap, themeColors]);

  const scheduleDraw = useCallback(() => {
    if (document.hidden) return;
    if (drawFrameRef.current !== null) return;
    drawFrameRef.current = requestAnimationFrame(() => {
      drawFrameRef.current = null;
      draw();
    });
  }, [draw]);

  const updateHover = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !draggedPiece) {
      const hadHover = hoverRef.current !== null;
      hoverRef.current = null;
      setSharedHoverCoord(null);
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

    if (!previous || previous.x !== position.x || previous.y !== position.y) {
      const now = performance.now();
      if (now - lastHoverHapticRef.current >= 80) {
        gameFeelEvents.dragHover();
        lastHoverHapticRef.current = now;
      }
    }

    scheduleDraw();
  }, [canPlacePiece, draggedPiece, grid, scheduleDraw]);

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
        drawFrameRef.current = null;
        gravityFrameRef.current = null;
        placementFrameRef.current = null;
        gravityAnimationRef.current = null;
        placementAnimationRef.current = null;
        clearAnimationRef.current = null;
        lastAnimationDrawAtRef.current = 0;
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
      scheduleDraw();
    }
  }, [draggedPiece, scheduleDraw, updateHover]);

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
    placementAnimationRef.current = null;
    clearAnimationRef.current = null;
    lastAnimationDrawAtRef.current = 0;
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
