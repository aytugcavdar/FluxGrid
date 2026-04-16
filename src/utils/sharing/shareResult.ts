/**
 * Share result utilities for Daily Challenge mode
 * Generates Wordle-style emoji grids for sharing
 */

import { GameMode } from '@shared/types';

const EMOJI_MAP = {
  line_clear: '⚡',
  combo: '🔥',
  surge: '✨',
  normal: '🟦',
  empty: '⬛',
};

/**
 * Generate shareable text with emoji grid
 * @param score Final score
 * @param mode Game mode
 * @param combo Max combo achieved
 * @param isSurgeUsed Whether surge mode was used
 * @param dailyClearHistory Array of clear patterns (true = cleared cell)
 */
export const generateShareText = (
  score: number,
  mode: GameMode,
  combo: number,
  isSurgeUsed: boolean,
  dailyClearHistory: boolean[][]
): string => {
  const today = new Date();
  const dayNumber = Math.floor((today.getTime() - new Date('2025-01-01').getTime()) / (1000 * 60 * 60 * 24));

  const modeLabel = {
    [GameMode.DAILY_CHALLENGE]: 'Günlük Bulmaca',
    [GameMode.ENDLESS]: 'Sonsuz Mod',
    [GameMode.TIMED]: 'Quantum Rush',
    [GameMode.ZEN]: 'Zen',
  }[mode] ?? mode;

  // Emoji grid oluştur (6 satır x 4 sütun)
  const grid = dailyClearHistory
    .slice(0, 6)
    .map(row =>
      row
        .slice(0, 4)
        .map(cleared => (cleared ? '🟦' : '⬛'))
        .join('')
    )
    .join('\n');

  const comboStr = combo >= 5 ? '🔥'.repeat(Math.min(combo, 5)) : '';
  const surgeStr = isSurgeUsed ? ' ✨' : '';

  const lines = [
    `FluxGrid ${mode === GameMode.DAILY_CHALLENGE ? `#${dayNumber}` : modeLabel}`,
    `${score.toLocaleString()} puan${surgeStr}${comboStr ? ' ' + comboStr : ''}`,
    '',
    grid || '⬛⬛⬛⬛',
    '',
    '🎮 fluxgrid.app',
  ];

  return lines.join('\n');
};

/**
 * Share result using native share API or clipboard fallback
 * @param text Text to share
 * @returns 'shared' if native share used, 'copied' if clipboard used, 'failed' on error
 */
export const shareResult = async (text: string): Promise<'shared' | 'copied' | 'failed'> => {
  // Native share API (mobil)
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (e) {
      // Kullanıcı iptal ettiyse sessizce geç
    }
  }

  // Fallback: clipboard
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (e) {
    return 'failed';
  }
};
