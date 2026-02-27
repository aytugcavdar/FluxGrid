import { PieceShape } from './types';

// Modern Soft Palette — muted, warm tones
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
  UNDO: 30
};

export const POINTS = {
  BLOCK_PLACED: 15,
  LINE_CLEARED: 150,
  COMBO_MULTIPLIER: 75,
  COLOR_BONUS_MULTIPLIER: 1.5, // %50 bonus for single-color line clear
  SURGE_MULTIPLIER: 2.0,       // x2 during Surge mode
};

import { ObjectiveType, LevelDef, Achievement } from './types';

export const LEVELS: LevelDef[] = [
  {
    index: 1,
    name: "Başlangıç",
    objectives: [
      { type: ObjectiveType.SCORE, target: 1000, current: 0 },
      { type: ObjectiveType.CLEAR_LINES, target: 5, current: 0 }
    ],
    movesLimit: 20,
    rewardFlux: 30
  },
  {
    index: 2,
    name: "Buz Kıran",
    objectives: [
      { type: ObjectiveType.BREAK_ICE, target: 3, current: 0 },
      { type: ObjectiveType.SCORE, target: 2500, current: 0 }
    ],
    movesLimit: 25,
    rewardFlux: 40
  },
  {
    index: 3,
    name: "Zincir Reaksiyonu",
    objectives: [
      { type: ObjectiveType.CHAIN_REACTION, target: 2, current: 0 },
      { type: ObjectiveType.CLEAR_LINES, target: 10, current: 0 }
    ],
    movesLimit: 30,
    rewardFlux: 50
  }
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'score_10k',
    name: 'Yüksek Skorcu',
    description: 'Tek bir oyunda 10,000 puana ulaş.',
    unlocked: false,
    targetValue: 10000,
    currentValue: 0
  },
  {
    id: 'combo_5',
    name: 'Kombo Ustası',
    description: '5x kombo yap.',
    unlocked: false,
    targetValue: 5,
    currentValue: 0
  },
  {
    id: 'bomb_expert',
    name: 'Bomba Uzmanı',
    description: '10 adet bomba bloğu patlat.',
    unlocked: false,
    targetValue: 10,
    currentValue: 0
  }
];

// Ability Unlock Conditions
import { ActiveAbilityType, PassiveAbilityType, AbilityUnlock } from './types';

export const ABILITY_UNLOCKS: AbilityUnlock[] = [
  { ability: ActiveAbilityType.ROTATE, condition: { type: 'LEVEL', value: 5 } },
  { ability: ActiveAbilityType.SWAP, condition: { type: 'LEVEL', value: 10 } },
  { ability: ActiveAbilityType.FREEZE, condition: { type: 'LEVEL', value: 15 } },
  { ability: ActiveAbilityType.MAGNET, condition: { type: 'ACHIEVEMENT_COUNT', value: 10 } },
  { ability: ActiveAbilityType.UNDO, condition: { type: 'TOTAL_SCORE', value: 50000 } },
  { ability: PassiveAbilityType.FLUX_BOOST, condition: { type: 'LEVEL', value: 3 } },
  { ability: PassiveAbilityType.SCORE_MULTIPLIER, condition: { type: 'LEVEL', value: 7 } },
  { ability: PassiveAbilityType.LUCKY_PIECES, condition: { type: 'LEVEL', value: 12 } },
  { ability: PassiveAbilityType.COMBO_MASTER, condition: { type: 'ACHIEVEMENT_COUNT', value: 5 } },
  { ability: PassiveAbilityType.ICE_BREAKER, condition: { type: 'TOTAL_SCORE', value: 25000 } }
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
  { id: 'all_unlocked', name: 'Tam Donanımlı', description: 'Tüm yetenekleri kilitle', category: 'PROGRESSION', targetValue: 1, currentValue: 0, unlocked: false, hidden: true, fluxReward: 250 }
];

// Touch Gesture Thresholds
export const GESTURE_THRESHOLDS = {
  TAP_MAX_DURATION: 300,
  LONG_PRESS_DURATION: 500,
  DRAG_MIN_DISTANCE: 10,
  PINCH_MIN_SCALE_CHANGE: 0.1,
  SWIPE_MIN_VELOCITY: 0.5,
  DOUBLE_TAP_MAX_INTERVAL: 300,
  MIN_TOUCH_TARGET_SIZE: 44
};

// Responsive Breakpoints
export const RESPONSIVE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440
};

// Performance Settings
export const PERFORMANCE_SETTINGS = {
  TARGET_FPS: 60,
  MIN_FPS: 30,
  MOBILE_PARTICLE_LIMIT: 50,
  DESKTOP_PARTICLE_LIMIT: 200,
  MEMORY_WARNING_THRESHOLD: 0.8,
  MEMORY_CRITICAL_THRESHOLD: 0.9
};

// Persistence Settings
export const PERSISTENCE_SETTINGS = {
  SCHEMA_VERSION: 1,
  BACKUP_INTERVAL: 600000, // 10 minutes
  MAX_BACKUPS: 5,
  SAVE_DEBOUNCE: 1000 // 1 second
};
