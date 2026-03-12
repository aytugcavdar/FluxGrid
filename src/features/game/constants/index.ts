/**
 * Game feature constants
 */
import type { PieceShape } from '../types';

// Modern Soft Palette
export const COLORS = [
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#a78bfa', // Lavender
  '#10b981', // Teal Green
  '#f472b6', // Pink
  '#6366f1', // Indigo
];

// 1010! style shapes
export const SHAPES: PieceShape[] = [
  { id: 'dot', shape: [[1]], color: COLORS[0] },
  { id: 'h2', shape: [[1, 1]], color: COLORS[1] },
  { id: 'v2', shape: [[1], [1]], color: COLORS[1] },
  { id: 'h3', shape: [[1, 1, 1]], color: COLORS[2] },
  { id: 'v3', shape: [[1], [1], [1]], color: COLORS[2] },
  { id: 'h4', shape: [[1, 1, 1, 1]], color: COLORS[3] },
  { id: 'v4', shape: [[1], [1], [1], [1]], color: COLORS[3] },
  { id: 'square', shape: [[1, 1], [1, 1]], color: COLORS[0] },
  { id: 'l_shape', shape: [[1, 0], [1, 0], [1, 1]], color: COLORS[4] },
  { id: 'j_shape', shape: [[0, 1], [0, 1], [1, 1]], color: COLORS[4] },
  { id: 't_shape', shape: [[1, 1, 1], [0, 1, 0]], color: COLORS[5] },
  { id: 'cross', shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: COLORS[2] },
  { id: 'z_shape', shape: [[1, 1, 0], [0, 1, 1]], color: COLORS[3] },
  { id: 's_shape', shape: [[0, 1, 1], [1, 1, 0]], color: COLORS[1] },
  { id: 'corner', shape: [[1, 1], [1, 0]], color: COLORS[5] },
];

export const FLUX_COST = {
  REROLL: 20,
  SHATTER: 40,
  BOMB: 75,
  ROTATE: 15,
  SWAP: 25,
  FREEZE: 50,
  MAGNET: 60,
  UNDO: 30,
};

export const POINTS = {
  BLOCK_PLACED: 15,
  LINE_CLEARED: 150,
  COMBO_MULTIPLIER: 75,
  COLOR_BONUS_MULTIPLIER: 1.5,
  SURGE_MULTIPLIER: 2.0,
  BLITZ_TIME_BONUS: 100,
};

// SURVIVAL Mode Stone Block
export const STONE_BLOCK = {
  color: '#4b5563',
  type: 'STONE' as const,
  clearable: true,
  appearance: 'matte' as const,
};

// Achievements
import type { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'score_10k',
    name: 'Yüksek Skorcu',
    description: 'Tek bir oyunda 10,000 puana ulaş.',
    unlocked: false,
    targetValue: 10000,
    currentValue: 0,
  },
  {
    id: 'combo_5',
    name: 'Kombo Ustası',
    description: '5x kombo yap.',
    unlocked: false,
    targetValue: 5,
    currentValue: 0,
  },
  {
    id: 'bomb_expert',
    name: 'Bomba Uzmanı',
    description: '10 adet bomba bloğu patlat.',
    unlocked: false,
    targetValue: 10,
    currentValue: 0,
  },
];

// Expanded Achievement Definitions
export const EXPANDED_ACHIEVEMENTS: Achievement[] = [
  // Score achievements
  { id: 'score_10k', name: 'Yüksek Skorcu', description: 'Tek oyunda 10,000 puan', category: 'SCORE', targetValue: 10000, currentValue: 0, unlocked: false, hidden: false, fluxReward: 50 },
  { id: 'score_50k', name: 'Skor Ustası', description: 'Tek oyunda 50,000 puan', category: 'SCORE', targetValue: 50000, currentValue: 0, unlocked: false, hidden: false, fluxReward: 100 },
  { id: 'score_100k', name: 'Efsane Skor', description: 'Tek oyunda 100,000 puan', category: 'SCORE', targetValue: 100000, currentValue: 0, unlocked: false, hidden: true, fluxReward: 200 },
  
  // Combo achievements
  { id: 'combo_5', name: 'Kombo Ustası', description: '5x kombo yap', category: 'COMBO', targetValue: 5, currentValue: 0, unlocked: false, hidden: false, fluxReward: 30 },
  { id: 'combo_10', name: 'Kombo Tanrısı', description: '10x kombo yap', category: 'COMBO', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 75 },
  { id: 'combo_15', name: 'Kombo Efsanesi', description: '15x kombo yap', category: 'COMBO', targetValue: 15, currentValue: 0, unlocked: false, hidden: true, fluxReward: 150 },
  
  // Special block achievements
  { id: 'bomb_10', name: 'Bomba Uzmanı', description: '10 bomba patlat', category: 'SPECIAL_BLOCKS', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 40 },
  { id: 'ice_50', name: 'Buz Kırıcı', description: '50 buz bloğu kır', category: 'SPECIAL_BLOCKS', targetValue: 50, currentValue: 0, unlocked: false, hidden: false, fluxReward: 60 },
  { id: 'rainbow_5', name: 'Gökkuşağı Avcısı', description: '5 gökkuşağı bloğu temizle', category: 'SPECIAL_BLOCKS', targetValue: 5, currentValue: 0, unlocked: false, hidden: false, fluxReward: 50 },
  { id: 'lock_10', name: 'Kilit Kırıcı', description: '10 kilit bloğu kır', category: 'SPECIAL_BLOCKS', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 70 },
  { id: 'portal_5', name: 'Portal Gezgini', description: '5 portal bloğu kullan', category: 'SPECIAL_BLOCKS', targetValue: 5, currentValue: 0, unlocked: false, hidden: false, fluxReward: 55 },
  
  // Ability achievements
  { id: 'ability_master', name: 'Yetenek Ustası', description: 'Her yeteneği en az 10 kez kullan', category: 'ABILITIES', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 100 },
  { id: 'no_abilities', name: 'Saf Beceri', description: 'Yetenek kullanmadan 5000 puan', category: 'ABILITIES', targetValue: 5000, currentValue: 0, unlocked: false, hidden: true, fluxReward: 150 },
  { id: 'rotate_master', name: 'Döndürme Ustası', description: 'Rotate yeteneğini 50 kez kullan', category: 'ABILITIES', targetValue: 50, currentValue: 0, unlocked: false, hidden: false, fluxReward: 45 },
  { id: 'undo_saver', name: 'Zaman Yolcusu', description: 'Undo ile 20 hamle geri al', category: 'ABILITIES', targetValue: 20, currentValue: 0, unlocked: false, hidden: false, fluxReward: 60 },
  
  // Progression achievements
  { id: 'level_10', name: 'Yolculuk Başlıyor', description: 'Seviye 10\'a ulaş', category: 'PROGRESSION', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 50 },
  { id: 'level_25', name: 'Deneyimli Oyuncu', description: 'Seviye 25\'e ulaş', category: 'PROGRESSION', targetValue: 25, currentValue: 0, unlocked: false, hidden: false, fluxReward: 100 },
  { id: 'level_50', name: 'Usta Oyuncu', description: 'Seviye 50\'ye ulaş', category: 'PROGRESSION', targetValue: 50, currentValue: 0, unlocked: false, hidden: true, fluxReward: 200 },
  { id: 'perfect_level', name: 'Mükemmel Seviye', description: 'Bir seviyeyi 3 yıldızla tamamla', category: 'PROGRESSION', targetValue: 1, currentValue: 0, unlocked: false, hidden: false, fluxReward: 75 },
  { id: 'perfect_10', name: 'Mükemmellik Peşinde', description: '10 seviyeyi 3 yıldızla tamamla', category: 'PROGRESSION', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 150 },
  { id: 'all_unlocked', name: 'Tam Donanımlı', description: 'Tüm yetenekleri kilitle', category: 'PROGRESSION', targetValue: 1, currentValue: 0, unlocked: false, hidden: true, fluxReward: 250 },
];
