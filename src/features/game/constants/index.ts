/**
 * Game feature constants
 */
import type { PieceShape, Milestone } from '../types';

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
  { id: 'diagonal_2', shape: [[1, 0], [0, 1]], color: '#f97316' }, // Orange - diagonal left-to-right
  { id: 'diagonal_2_rev', shape: [[0, 1], [1, 0]], color: '#ec4899' }, // Hot Pink - diagonal right-to-left
  { id: 'small_plus', shape: [[0, 1, 0], [1, 1, 1]], color: '#8b5cf6' }, // Purple - small plus
];

// Tier progression constants (rebalanced for smoother curve)
export const TIER_THRESHOLDS = [0, 5000, 15000, 30000, 55000, 90000, 140000] as const;
export const TIER_SCORE_MULTIPLIERS = [1.0, 1.2, 1.5, 1.8, 2.2, 2.6, 3.0] as const;

// Rescue mechanism thresholds (tier-based)
export const RESCUE_DENSITY_THRESHOLDS = {
  TIER_0_2: 0.75,   // Tier 0-2: rescue at 75% density
  TIER_3_4: 0.70,   // Tier 3-4: earlier rescue at 70%
  TIER_5_6: 0.65,   // Tier 5-6: much earlier rescue at 65%
} as const;

// Event duration constants
export const EVENT_DURATIONS = {
  ICE_STORM: 10,
  QUAKE: 8,
  MIRROR: 10,
  CHAOS: 12,
  VOID: 10,
} as const;

// Event cooldown (tier-based) - hamle sayısı event bitiminden sonra
export const EVENT_COOLDOWNS: Record<number, number> = {
  1: 5,  // tier 1'de 5 hamle cooldown
  2: 4,
  3: 3,
  4: 2,
  5: 1,
  6: 0,  // tier 6'da anında yeni event
} as const;

// Event trigger intervals (for CHAOS and VOID)
export const EVENT_TRIGGER_INTERVALS = {
  CHAOS: 4,
  VOID: 5,
} as const;

// Event score multipliers
export const EVENT_SCORE_MULTIPLIERS = {
  DEFAULT: 1.2,
  QUAKE: 1.3,
} as const;

// Mini-event system removed - all constants deprecated

// ICE_STORM spawn count
export const ICE_STORM_SPAWN_COUNT = 2;

// Milestone tanımları
export const MILESTONES: Milestone[] = [
  { id: 'milestone_10k', threshold: 10000, label: 'İlk 10K!', reached: false },
  { id: 'milestone_25k', threshold: 25000, label: 'Çeyrek Yol!', reached: false },
  { id: 'milestone_50k', threshold: 50000, label: 'Yarı Yol!', reached: false },
  { id: 'milestone_100k', threshold: 100000, label: '100K Efsane!', reached: false },
];

// Timed Mode milestone definitions for continuous difficulty scaling
export const TIMED_MODE_MILESTONES = [
  { id: 'timed_10k', threshold: 10000, label: 'İlk 10K! 🎯' },
  { id: 'timed_25k', threshold: 25000, label: 'Çeyrek Yol! 🔥' },
  { id: 'timed_50k', threshold: 50000, label: 'Yarı Yol! ⚡' },
  { id: 'timed_75k', threshold: 75000, label: 'Efsane Bölge! 💎' },
  { id: 'timed_100k', threshold: 100000, label: '100K Kulübü! 👑' },
] as const;

// Streak multiplier tablosu
export const STREAK_MULTIPLIERS = {
  0: 1.0,  // No streak
  1: 1.0,  // First clear
  2: 2.0,  // 2x
  3: 3.0,  // 3x
  4: 4.0,  // 4x (max)
} as const;

// ZEN_PALETTES removed - ZEN mode deprecated

export const POINTS = {
  BLOCK_PLACED: 15,
  LINE_CLEARED: 150,
  COMBO_MULTIPLIER: 75,
  COLOR_BONUS_MULTIPLIER: 1.5,
  BLITZ_TIME_BONUS: 100,
};

// TIMED Mode Constants
export const TIMED_MODE = {
  DURATION_SECONDS: 60,
  FINAL_SECONDS_THRESHOLD: 10,  // Seconds remaining for final bonus multiplier (1.5x)
  WARNING_THRESHOLD: 30,          // Seconds remaining for warning state
};

// COMBO Timer Constants
export const COMBO_TIMER = {
  DURATION: 10000, // 10 seconds in milliseconds
  WARNING_THRESHOLD: 4, // Show warning color when < 4 seconds
  CRITICAL_THRESHOLD: 2, // Show critical color when < 2 seconds
};

// Spawn rates for currently supported block types.
export const SPAWN_RATES = {
  NORMAL: 0.90,    // 90%
  ICE: 0.05,       // 5%
  BOMB: 0.05,      // 5%
} as const;

// Achievements
import type { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'score_10k',
    name: 'Üstün Skorcu',
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
  { id: 'score_1k', name: 'İlk Adım', description: 'Tek oyunda 1,000 puan', category: 'SCORE', targetValue: 1000, currentValue: 0, unlocked: false, hidden: false },
  { id: 'score_5k', name: 'Yükselen Yıldız', description: 'Tek oyunda 5,000 puan', category: 'SCORE', targetValue: 5000, currentValue: 0, unlocked: false, hidden: false },
  { id: 'score_10k', name: 'Yüksek Skorcu', description: 'Tek oyunda 10,000 puan', category: 'SCORE', targetValue: 10000, currentValue: 0, unlocked: false, hidden: false },
  { id: 'score_25k', name: 'Skor Avcısı', description: 'Tek oyunda 25,000 puan', category: 'SCORE', targetValue: 25000, currentValue: 0, unlocked: false, hidden: false },
  { id: 'score_50k', name: 'Skor Ustası', description: 'Tek oyunda 50,000 puan', category: 'SCORE', targetValue: 50000, currentValue: 0, unlocked: false, hidden: false },
  { id: 'score_75k', name: 'Skor Kralı', description: 'Tek oyunda 75,000 puan', category: 'SCORE', targetValue: 75000, currentValue: 0, unlocked: false, hidden: false },
  { id: 'score_100k', name: 'Efsane Skor', description: 'Tek oyunda 100,000 puan', category: 'SCORE', targetValue: 100000, currentValue: 0, unlocked: false, hidden: true },
  { id: 'score_250k', name: 'Skor Tanrısı', description: 'Tek oyunda 250,000 puan', category: 'SCORE', targetValue: 250000, currentValue: 0, unlocked: false, hidden: true },
  { id: 'score_500k', name: 'Skor Efsanesi', description: 'Tek oyunda 500,000 puan', category: 'SCORE', targetValue: 500000, currentValue: 0, unlocked: false, hidden: true },
  { id: 'score_1m', name: 'Milyon Kulübü', description: 'Tek oyunda 1,000,000 puan', category: 'SCORE', targetValue: 1000000, currentValue: 0, unlocked: false, hidden: true },
  // Combo achievements
  { id: 'combo_3', name: 'Kombo Başlangıcı', description: '3x kombo yap', category: 'COMBO', targetValue: 3, currentValue: 0, unlocked: false, hidden: false },
  { id: 'combo_5', name: 'Kombo Ustası', description: '5x kombo yap', category: 'COMBO', targetValue: 5, currentValue: 0, unlocked: false, hidden: false },
  { id: 'combo_10', name: 'Kombo Tanrısı', description: '10x kombo yap', category: 'COMBO', targetValue: 10, currentValue: 0, unlocked: false, hidden: false },
  { id: 'combo_15', name: 'Kombo Efsanesi', description: '15x kombo yap', category: 'COMBO', targetValue: 15, currentValue: 0, unlocked: false, hidden: true },
  { id: 'combo_20', name: 'Kombo Kralı', description: '20x kombo yap', category: 'COMBO', targetValue: 20, currentValue: 0, unlocked: false, hidden: true },
  { id: 'combo_25', name: 'Kombo İmparatoru', description: '25x kombo yap', category: 'COMBO', targetValue: 25, currentValue: 0, unlocked: false, hidden: true },
  { id: 'combo_30', name: 'Kombo Zirvesi', description: '30x kombo yap', category: 'COMBO', targetValue: 30, currentValue: 0, unlocked: false, hidden: true },
  { id: 'combo_streak', name: 'Kombo Zinciri', description: 'Toplam 5 kez 5x kombo eşiğine ulaş', category: 'COMBO', targetValue: 5, currentValue: 0, unlocked: false, hidden: false },
  // Special block achievements
  { id: 'bomb_5', name: 'Bomba Başlangıcı', description: '5 bomba patlat', category: 'SPECIAL_BLOCKS', targetValue: 5, currentValue: 0, unlocked: false, hidden: false },
  { id: 'bomb_10', name: 'Bomba Uzmanı', description: '10 bomba patlat', category: 'SPECIAL_BLOCKS', targetValue: 10, currentValue: 0, unlocked: false, hidden: false },
  { id: 'bomb_50', name: 'Bomba Ustası', description: '50 bomba patlat', category: 'SPECIAL_BLOCKS', targetValue: 50, currentValue: 0, unlocked: false, hidden: false },
  { id: 'bomb_100', name: 'Patlayıcı Usta', description: '100 bomba patlat', category: 'SPECIAL_BLOCKS', targetValue: 100, currentValue: 0, unlocked: false, hidden: true },
  { id: 'bomb_250', name: 'Bomba Efsanesi', description: '250 bomba patlat', category: 'SPECIAL_BLOCKS', targetValue: 250, currentValue: 0, unlocked: false, hidden: true },
  { id: 'ice_10', name: 'Buz Çözücü', description: '10 buz bloğu kır', category: 'SPECIAL_BLOCKS', targetValue: 10, currentValue: 0, unlocked: false, hidden: false },
  { id: 'ice_25', name: 'Buz Başlangıcı', description: '25 buz bloğu kır', category: 'SPECIAL_BLOCKS', targetValue: 25, currentValue: 0, unlocked: false, hidden: false },
  { id: 'ice_50', name: 'Buz Kırıcı', description: '50 buz bloğu kır', category: 'SPECIAL_BLOCKS', targetValue: 50, currentValue: 0, unlocked: false, hidden: false },
  { id: 'ice_100', name: 'Buz Ustası', description: '100 buz bloğu kır', category: 'SPECIAL_BLOCKS', targetValue: 100, currentValue: 0, unlocked: false, hidden: false },
  { id: 'ice_250', name: 'Buz Efsanesi', description: '250 buz bloğu kır', category: 'SPECIAL_BLOCKS', targetValue: 250, currentValue: 0, unlocked: false, hidden: true },
  // Progression achievements
  { id: 'games_1', name: 'İlk Oyun', description: 'İlk oyununu oyna', category: 'PROGRESSION', targetValue: 1, currentValue: 0, unlocked: false, hidden: false },
  { id: 'games_10', name: 'Yeni Başlayan', description: '10 oyun oyna', category: 'PROGRESSION', targetValue: 10, currentValue: 0, unlocked: false, hidden: false },
  { id: 'games_50', name: 'Düzenli Oyuncu', description: '50 oyun oyna', category: 'PROGRESSION', targetValue: 50, currentValue: 0, unlocked: false, hidden: false },
  { id: 'games_100', name: 'Bağımlı', description: '100 oyun oyna', category: 'PROGRESSION', targetValue: 100, currentValue: 0, unlocked: false, hidden: false },
  { id: 'games_500', name: 'Efsane Oyuncu', description: '500 oyun oyna', category: 'PROGRESSION', targetValue: 500, currentValue: 0, unlocked: false, hidden: true },
  { id: 'blocks_500', name: 'Blok Isınması', description: '500 blok yerleştir', category: 'PROGRESSION', targetValue: 500, currentValue: 0, unlocked: false, hidden: false },
  { id: 'blocks_1000', name: 'Blok Yerleştirici', description: '1000 blok yerleştir', category: 'PROGRESSION', targetValue: 1000, currentValue: 0, unlocked: false, hidden: false },
  { id: 'blocks_5000', name: 'Blok Ustası', description: '5000 blok yerleştir', category: 'PROGRESSION', targetValue: 5000, currentValue: 0, unlocked: false, hidden: false },
  { id: 'lines_100', name: 'Satır Temizleyici', description: '100 satır temizle', category: 'PROGRESSION', targetValue: 100, currentValue: 0, unlocked: false, hidden: false },
  { id: 'lines_500', name: 'Satır Ustası', description: '500 satır temizle', category: 'PROGRESSION', targetValue: 500, currentValue: 0, unlocked: false, hidden: false },
  // Speed achievements
  { id: 'timed_score_1k', name: 'Hızlı Başlangıç', description: 'Timed modda 1,000 puan', category: 'SPEED', targetValue: 1000, currentValue: 0, unlocked: false, hidden: false },
  { id: 'timed_score_5k', name: 'Hız Canavarı', description: 'Timed modda 5,000 puan', category: 'SPEED', targetValue: 5000, currentValue: 0, unlocked: false, hidden: false },
  { id: 'timed_score_10k', name: 'Zaman Ustası', description: 'Timed modda 10,000 puan', category: 'SPEED', targetValue: 10000, currentValue: 0, unlocked: false, hidden: false },
  { id: 'timed_score_25k', name: 'Sprint Oyuncusu', description: 'Timed modda 25,000 puan', category: 'SPEED', targetValue: 25000, currentValue: 0, unlocked: false, hidden: false },
  { id: 'timed_score_50k', name: '60 Saniye Efsanesi', description: 'Timed modda 50,000 puan', category: 'SPEED', targetValue: 50000, currentValue: 0, unlocked: false, hidden: true },
  { id: 'timed_combo_3', name: 'Hızlı Kombo', description: 'Timed modda 3x kombo yap', category: 'SPEED', targetValue: 3, currentValue: 0, unlocked: false, hidden: false },
  { id: 'timed_combo_5', name: 'Hızlı Zincir', description: 'Timed modda 5x kombo yap', category: 'SPEED', targetValue: 5, currentValue: 0, unlocked: false, hidden: false },
  { id: 'timed_lines_25', name: 'Dakika Temizliği', description: 'Timed modda toplam 25 satır temizle', category: 'SPEED', targetValue: 25, currentValue: 0, unlocked: false, hidden: false },
  { id: 'sprint_boost_1k', name: 'Final Atağı', description: 'Toplam 1,000 final sprint bonusu kazan', category: 'SPEED', targetValue: 1000, currentValue: 0, unlocked: false, hidden: false },
  { id: 'sprint_master', name: 'Sprint Ustası', description: 'Final sprint bonusu 5000+ puan', category: 'SPEED', targetValue: 5000, currentValue: 0, unlocked: false, hidden: true },
  // Mastery achievements
  { id: 'tier_1', name: 'Tier Başlangıcı', description: "Endless modda Tier 1'e ulaş", category: 'MASTERY', targetValue: 1, currentValue: 0, unlocked: false, hidden: false },
  { id: 'tier_3', name: 'Tier Tırmanışı', description: "Endless modda Tier 3'e ulaş", category: 'MASTERY', targetValue: 3, currentValue: 0, unlocked: false, hidden: false },
  { id: 'tier_master', name: 'Tier Ustası', description: "Tier 5'e ulaş", category: 'MASTERY', targetValue: 5, currentValue: 0, unlocked: false, hidden: false },
  { id: 'tier_6', name: 'VOID+', description: "Endless modda Tier 6'ya ulaş", category: 'MASTERY', targetValue: 6, currentValue: 0, unlocked: false, hidden: true },
  { id: 'event_1', name: 'İlk Event', description: 'İlk tier eventini yaşa', category: 'MASTERY', targetValue: 1, currentValue: 0, unlocked: false, hidden: false },
  { id: 'event_5', name: 'Event Avcısı', description: '5 tier eventi yaşa', category: 'MASTERY', targetValue: 5, currentValue: 0, unlocked: false, hidden: false },
  { id: 'event_master', name: 'Event Ustası', description: '10 tier eventi yaşa', category: 'MASTERY', targetValue: 10, currentValue: 0, unlocked: false, hidden: false },
  { id: 'perfect_clear', name: 'Mükemmel Temizlik', description: 'Tahtayı tamamen temizle', category: 'MASTERY', targetValue: 1, currentValue: 0, unlocked: false, hidden: false },
  { id: 'perfect_clear_5', name: 'Temizlik Serisi', description: '5 kez tahtayı tamamen temizle', category: 'MASTERY', targetValue: 5, currentValue: 0, unlocked: false, hidden: false },
  { id: 'perfect_clear_10', name: 'Temizlik Uzmanı', description: '10 kez tahtayı tamamen temizle', category: 'MASTERY', targetValue: 10, currentValue: 0, unlocked: false, hidden: true },
  { id: 'color_bonus_10', name: 'Renk Avcısı', description: '10 kez renk bonusu kazan', category: 'MASTERY', targetValue: 10, currentValue: 0, unlocked: false, hidden: false },
  { id: 'record_breaker', name: 'Rekor Kırıcı', description: '5 kez yeni rekor kır', category: 'MASTERY', targetValue: 5, currentValue: 0, unlocked: false, hidden: true },
];

