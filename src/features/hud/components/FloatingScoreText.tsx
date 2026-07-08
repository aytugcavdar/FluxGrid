import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { useGameStore } from '../../game/store/gameStore';
import { CellType } from '../../game/types';
import { getBoardMetrics } from '../../game/components/grid2d/grid2dHelpers';
import { usePerformanceStore } from '../../performance/store/performanceStore';
import { SCORE_IMPACT_EVENT, type ScoreImpactDetail } from './ScoreImpactValue';

type ScoreChipKind = 'normal' | 'ice' | 'bomb' | 'cluster';

interface ScoreSourceCell {
  x: number;
  y: number;
  id?: string;
  color: string;
  cellType?: CellType;
}

interface ScoreChip {
  id: string;
  value: number;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  size: number;
  color: string;
  delay: number;
  hold: number;
  kind: ScoreChipKind;
  glowColor: string;
  label: string;
}

interface ScoreBurst {
  id: string;
  total: number;
  x: number;
  y: number;
  color: string;
  combo: number;
  targetX: number;
  targetY: number;
  controlX: number;
  controlY: number;
  chips: ScoreChip[];
  reducedMotion: boolean;
  minimalMotion: boolean;
}

const SCORE_IMPACT_DELAY_MS = 930;
const BURST_REMOVE_DELAY_MS = 1080;

export const distributeScoreAcrossChips = (total: number, count: number): number[] => {
  const safeTotal = Math.max(0, Math.round(total));
  const safeCount = Math.min(Math.max(0, Math.floor(count)), safeTotal);
  if (safeCount === 0) return [];

  const baseValue = Math.floor(safeTotal / safeCount);
  const remainder = safeTotal % safeCount;

  return Array.from({ length: safeCount }, (_, index) => (
    baseValue + (index >= safeCount - remainder ? 1 : 0)
  ));
};

const getClearAccentColor = (lines: number, combo: number): string => {
  if (combo >= 8) return '#f472b6';
  if (combo >= 5) return '#fbbf24';
  if (lines >= 4) return '#f59e0b';
  if (lines === 3) return '#a855f7';
  if (lines === 2) return '#38bdf8';
  return '#34d399';
};

export const getScoreChipCount = (
  lines: number,
  cellCount: number,
  reducedMotion: boolean,
  minimalMotion: boolean
): number => {
  if (minimalMotion || cellCount <= 0) return 0;
  if (reducedMotion) return Math.min(cellCount, lines >= 2 ? 2 : 1);
  if (lines >= 4) return Math.min(cellCount, 4);
  if (lines >= 2) return Math.min(cellCount, 3);
  return Math.min(cellCount, 2);
};

const getCellKey = (cell: ScoreSourceCell) => `${cell.x},${cell.y},${cell.id ?? ''}`;

const selectScoreSourceCells = (cells: ScoreSourceCell[], count: number): ScoreSourceCell[] => {
  if (count <= 0) return [];
  if (cells.length <= count) return cells;

  const picked: ScoreSourceCell[] = [];
  const used = new Set<string>();
  const addCell = (cell: ScoreSourceCell | undefined) => {
    if (!cell || picked.length >= count) return;
    const key = getCellKey(cell);
    if (used.has(key)) return;
    used.add(key);
    picked.push(cell);
  };

  cells.filter(cell => cell.cellType === CellType.BOMB).forEach(addCell);
  cells.filter(cell => cell.cellType === CellType.ICE).forEach(addCell);

  const remaining = cells.filter(cell => !used.has(getCellKey(cell)));
  const stride = Math.max(1, Math.floor(remaining.length / Math.max(1, count - picked.length)));
  for (let i = 0; picked.length < count && i < remaining.length; i += stride) {
    addCell(remaining[i]);
  }
  for (let i = 0; picked.length < count && i < remaining.length; i++) {
    addCell(remaining[i]);
  }

  return picked;
};

const getChipKind = (cell: ScoreSourceCell, lines: number): ScoreChipKind => {
  if (cell.cellType === CellType.BOMB) return 'bomb';
  if (cell.cellType === CellType.ICE) return 'ice';
  if (lines >= 3) return 'cluster';
  return 'normal';
};

const getChipColor = (kind: ScoreChipKind, cellColor: string, accentColor: string, combo: number): string => {
  if (kind === 'bomb') return '#fb7185';
  if (kind === 'ice') return '#67e8f9';
  if (combo >= 8) return '#f472b6';
  if (combo >= 5) return '#fbbf24';
  return cellColor || accentColor;
};

const getChipLabel = (kind: ScoreChipKind): string => {
  if (kind === 'bomb') return 'BOMB';
  if (kind === 'ice') return 'ICE';
  if (kind === 'cluster') return 'CLEAR';
  return '';
};

const getChipDrift = (cellX: number, cellY: number, index: number, size: number, kind: ScoreChipKind) => {
  const direction = ((cellX + cellY + index) % 2 === 0) ? 1 : -1;
  const kindBoost = kind === 'bomb' ? 0.16 : kind === 'ice' ? 0.08 : 0;
  const strength = 0.24 + kindBoost + (((cellX * 3) + (cellY * 5) + index) % 3) * 0.07;

  return {
    x: direction * size * strength,
    y: -size * ((kind === 'bomb' ? 0.3 : 0.2) + ((index % 2) * 0.08)),
  };
};

const getChipSurfaceOffset = (cell: ScoreSourceCell, index: number, size: number) => {
  const side = ((cell.x * 7 + cell.y * 11 + index) % 3) - 1;
  const surface = ((cell.x + index) % 2 === 0) ? -1 : 1;

  return {
    x: side * size * 0.16,
    y: surface * size * 0.16 - size * 0.18,
  };
};

const getCellScreenMetrics = (
  gridRect: DOMRect,
  cellX: number,
  cellY: number
): { x: number; y: number; size: number } => {
  const size = Math.min(gridRect.width, gridRect.height);
  const offsetX = gridRect.left + ((gridRect.width - size) / 2);
  const offsetY = gridRect.top + ((gridRect.height - size) / 2);
  const metrics = getBoardMetrics(size);

  return {
    x: offsetX + metrics.padding + (cellX * metrics.stride) + (metrics.cellSize / 2),
    y: offsetY + metrics.padding + (cellY * metrics.stride) + (metrics.cellSize / 2),
    size: metrics.cellSize,
  };
};

export const FloatingScoreText: React.FC = React.memo(() => {
  const { score, lastAction, isGameOver } = useGameStore();
  const deviceTier = usePerformanceStore(state => state.deviceTier);
  const [bursts, setBursts] = useState<ScoreBurst[]>([]);
  const [prevScore, setPrevScore] = useState(0);
  const isNativeApp = Capacitor.isNativePlatform();
  const minimalMotion = deviceTier === 'low';
  const reducedMotion = minimalMotion || isNativeApp || deviceTier === 'low-mid' || deviceTier === 'mid-low' || deviceTier === 'mid';

  useEffect(() => {
    if (score === 0 || isGameOver) {
      setPrevScore(0);
      setBursts([]);
    }
  }, [score, isGameOver]);

  useEffect(() => {
    if (score <= prevScore) {
      setPrevScore(score);
      return;
    }

    const scoreDiff = score - prevScore;
    if (scoreDiff < 1) {
      setPrevScore(score);
      return;
    }

    if (lastAction?.type !== 'CLEAR' || !lastAction.clearedCells?.length) {
      setPrevScore(score);
      return;
    }

    const gridElement = document.querySelector('[data-grid-container]');
    const gridRect = gridElement?.getBoundingClientRect();
    if (!gridRect || gridRect.width <= 0 || gridRect.height <= 0) {
      setPrevScore(score);
      return;
    }

    const cells = lastAction.clearedCells;
    const centerCell = {
      x: cells.reduce((sum, cell) => sum + cell.x, 0) / cells.length,
      y: cells.reduce((sum, cell) => sum + cell.y, 0) / cells.length,
    };
    const center = getCellScreenMetrics(gridRect, centerCell.x, centerCell.y);
    const scoreTarget = document.querySelector('[data-score-target]');
    const scoreTargetRect = scoreTarget?.getBoundingClientRect();
    const targetX = scoreTargetRect && scoreTargetRect.width > 0
      ? scoreTargetRect.left + (scoreTargetRect.width / 2)
      : center.x;
    const targetY = scoreTargetRect && scoreTargetRect.height > 0
      ? scoreTargetRect.top + (scoreTargetRect.height / 2)
      : center.y - 38;
    const lines = lastAction.lines ?? 1;
    const combo = lastAction.combo ?? 1;
    const accentColor = getClearAccentColor(lines, combo);
    const requestedChipCount = getScoreChipCount(lines, cells.length, reducedMotion, minimalMotion);
    const chipValues = distributeScoreAcrossChips(
      scoreDiff,
      requestedChipCount
    );
    const sourceCells = selectScoreSourceCells(cells, chipValues.length);
    const chips = sourceCells.map((cell, index) => {
      const pos = getCellScreenMetrics(gridRect, cell.x, cell.y);
      const kind = getChipKind(cell, lines);
      const color = getChipColor(kind, cell.color, accentColor, combo);
      const surfaceOffset = getChipSurfaceOffset(cell, index, pos.size);
      const drift = getChipDrift(cell.x, cell.y, index, pos.size, kind);
      return {
        id: `${Date.now()}-chip-${index}`,
        value: chipValues[index],
        x: pos.x + surfaceOffset.x,
        y: pos.y + surfaceOffset.y,
        driftX: drift.x,
        driftY: drift.y,
        size: pos.size,
        color,
        delay: index * (reducedMotion ? 0.02 : 0.035),
        hold: kind === 'bomb' ? 0.3 : lines >= 3 ? 0.28 : 0.24,
        kind,
        glowColor: color,
        label: getChipLabel(kind),
      };
    });
    const curveDirection = ((Math.round(centerCell.x) + Math.round(centerCell.y)) % 2 === 0)
      ? 1
      : -1;
    const curveOffset = Math.min(30, Math.max(18, Math.abs(targetY - center.y) * 0.08));

    const burst: ScoreBurst = {
      id: `${Date.now()}-${scoreDiff}`,
      total: scoreDiff,
      x: center.x,
      y: center.y,
      color: accentColor,
      combo,
      targetX,
      targetY,
      controlX: center.x + ((targetX - center.x) * 0.48) + (curveDirection * curveOffset),
      controlY: center.y + ((targetY - center.y) * 0.42) - 24,
      chips,
      reducedMotion,
      minimalMotion,
    };

    setBursts(prev => [...prev.slice(-1), burst]);
    window.setTimeout(() => {
      setBursts(prev => prev.filter(item => item.id !== burst.id));
    }, minimalMotion ? 620 : reducedMotion ? 820 : BURST_REMOVE_DELAY_MS);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent<ScoreImpactDetail>(SCORE_IMPACT_EVENT, {
        detail: {
          score,
          delta: scoreDiff,
          combo,
          color: accentColor,
        },
      }));
    }, minimalMotion ? 180 : reducedMotion ? 520 : SCORE_IMPACT_DELAY_MS);
    setPrevScore(score);
  }, [deviceTier, isNativeApp, minimalMotion, reducedMotion, score, lastAction, prevScore]);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 42 }}>
      <AnimatePresence>
        {bursts.map((burst) => (
          <React.Fragment key={burst.id}>
            {burst.chips.map((chip) => (
              <React.Fragment key={chip.id}>
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.74,
                    x: chip.x,
                    y: chip.y + (chip.size * 0.18),
                  }}
                  animate={{
                    opacity: [0, 0.66, 0.42, 0],
                    scale: [0.74, 1.04, 1.02, 0.92],
                    y: [
                      chip.y + (chip.size * 0.18),
                      chip.y + (chip.size * 0.06),
                      chip.y + (chip.size * 0.06),
                      chip.y - (chip.size * 0.02),
                    ],
                  }}
                  transition={{
                    duration: burst.reducedMotion ? 0.34 : 0.48,
                    delay: chip.delay,
                    ease: 'easeOut',
                  }}
                  style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: Math.max(16, chip.size * (chip.kind === 'bomb' ? 0.72 : 0.62)),
                    height: Math.max(8, chip.size * (chip.kind === 'ice' ? 0.16 : 0.22)),
                    transform: 'translate(-50%, -50%)',
                    borderRadius: chip.kind === 'ice' ? 3 : 999,
                    background: chip.kind === 'bomb'
                      ? `radial-gradient(circle, ${chip.color}66 0%, ${chip.color}22 45%, transparent 72%)`
                      : chip.kind === 'ice'
                        ? `linear-gradient(120deg, transparent 0%, ${chip.color}66 42%, rgba(255,255,255,0.75) 50%, ${chip.color}33 58%, transparent 100%)`
                        : `linear-gradient(90deg, transparent, ${chip.color}55, transparent)`,
                    filter: burst.reducedMotion ? 'none' : `drop-shadow(0 0 6px ${chip.glowColor}44)`,
                  }}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.72, x: chip.x, y: chip.y }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0.72, 1.12, 1, 0.86],
                    x: [chip.x, chip.x + (chip.driftX * 0.55), chip.x + chip.driftX, burst.x],
                    y: [chip.y, chip.y - 10, chip.y + chip.driftY, burst.y],
                  }}
                  transition={{
                    duration: burst.reducedMotion ? 0.42 : 0.58,
                    delay: chip.delay,
                    times: [0, chip.hold, 0.62, 1],
                    ease: 'easeOut',
                  }}
                  style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    transform: 'translate(-50%, -50%)',
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: chip.kind === 'bomb'
                      ? 'rgba(35,12,16,0.8)'
                      : chip.kind === 'ice'
                        ? 'rgba(8,22,32,0.78)'
                        : 'rgba(8,12,20,0.72)',
                    border: `1px solid ${chip.color}${chip.kind === 'cluster' ? '88' : '66'}`,
                    color: '#f8fafc',
                    fontSize: Math.max(9, Math.min(chip.kind === 'cluster' ? 12 : 11, chip.size * 0.22)),
                    fontWeight: 900,
                    lineHeight: 1,
                    textShadow: `0 0 6px ${chip.color}`,
                    boxShadow: burst.reducedMotion
                      ? `0 2px 6px rgba(0,0,0,0.18)`
                      : `0 2px 8px rgba(0,0,0,0.22), 0 0 9px ${chip.color}2f`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {chip.label && !burst.reducedMotion && (
                    <span
                      style={{
                        marginRight: 4,
                        color: chip.color,
                        fontSize: 7,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {chip.label}
                    </span>
                  )}
                  +{chip.value}
                </motion.div>
              </React.Fragment>
            ))}

            <motion.div
              initial={{ opacity: 0, scale: 0.84, x: burst.x, y: burst.y }}
              animate={{
                opacity: [0, 0, 1, 1, 1, 1, 0],
                scale: [0.84, 0.84, 1.08, 1, 0.9, 0.76, 0.7],
                x: [
                  burst.x,
                  burst.x,
                  burst.x,
                  burst.x,
                  burst.controlX,
                  burst.targetX,
                  burst.targetX,
                ],
                y: [
                  burst.y,
                  burst.y,
                  burst.y - 10,
                  burst.y - 10,
                  burst.controlY,
                  burst.targetY,
                  burst.targetY,
                ],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: burst.minimalMotion ? 0.42 : burst.reducedMotion ? 0.72 : 0.98,
                times: [0, 0.48, 0.56, 0.64, 0.8, 0.95, 1],
                ease: 'easeInOut',
              }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 9px',
                borderRadius: 999,
                background: 'rgba(8,12,20,0.82)',
                border: `1px solid ${burst.color}77`,
                color: burst.color,
                boxShadow: burst.reducedMotion
                  ? `0 4px 12px rgba(0,0,0,0.18), 0 0 6px ${burst.color}22`
                  : `0 8px 22px rgba(0,0,0,0.24), 0 0 12px ${burst.color}30`,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 950, lineHeight: 1 }}>
                +{burst.total.toLocaleString()}
              </span>
              {burst.combo > 1 && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 900,
                    lineHeight: 1,
                    padding: '3px 5px',
                    borderRadius: 999,
                    color: '#0f172a',
                    background: burst.color,
                  }}
                >
                  x{burst.combo}
                </span>
              )}
            </motion.div>
          </React.Fragment>
        ))}
      </AnimatePresence>
    </div>
  );
});
