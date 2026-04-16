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

// Tier progression constants (rebalanced for smoother curve)
export const TIER_THRESHOLDS = [0, 5000, 12000, 25000, 45000, 75000, 120000] as const;
export const TIER_SCORE_MULTIPLIERS = [1.0, 1.15, 1.35, 1.6, 2.0, 2.5, 3.0] as const;
export const TIER_FLUX_MULTIPLIERS = [1.0, 1.1, 1.2, 1.3, 1.5, 1.7, 2.0] as const;

// Rescue mechanism thresholds (tier-based)
export const RESCUE_DENSITY_THRESHOLDS = {
  TIER_0_2: 0.75,   // Tier 0-2: rescue at 75% density
  TIER_3_4: 0.70,   // Tier 3-4: earlier rescue at 70%
  TIER_5_6: 0.65,   // Tier 5-6: much earlier rescue at 65%
} as const;

// Event duration constants
export const EVENT_DURATIONS = {
  ICE_STORM: 10,
  GRAVITY_RUSH: 10,
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

// Tier bazlı mini-event intervalleri
export const MINI_EVENT_INTERVALS = {
  // Tier 0-2
  TIER_0_2: {
    FLUX_SURGE: 50,
    SCORE_RUSH: 100,
    CLEAR_BONUS: 150,
    COMBO_SHIELD: 200,
    PIECE_BLESSING: 250,
  },
  // Tier 3-4
  TIER_3_4: {
    FLUX_SURGE: 40,
    SCORE_RUSH: 80,
    CLEAR_BONUS: 120,
    COMBO_SHIELD: 160,
    PIECE_BLESSING: 200,
  },
  // Tier 5-6
  TIER_5_6: {
    FLUX_SURGE: 30,
    SCORE_RUSH: 60,
    CLEAR_BONUS: 90,
    COMBO_SHIELD: 120,
    PIECE_BLESSING: 150,
  },
} as const;

// Mini-event multiplier'lar (değişmedi)
export const MINI_EVENT_MULTIPLIERS = {
  FLUX_SURGE: 2.0,
  SCORE_RUSH: 1.5,
  CLEAR_BONUS: 3.0,
} as const;

// Mini-event süreleri
export const MINI_EVENT_DURATIONS = {
  FLUX_SURGE: 10,
  SCORE_RUSH: 10,
  CLEAR_BONUS: 1,      // Single-use
  COMBO_SHIELD: 1,     // Single-use
  PIECE_BLESSING: 5,   // 5 hamle
} as const;

// ICE_STORM spawn count
export const ICE_STORM_SPAWN_COUNT = 2;

// Milestone tanımları
export const MILESTONES: Milestone[] = [
  { id: 'milestone_10k', threshold: 10000, label: 'İlk 10K!', reached: false },
  { id: 'milestone_25k', threshold: 25000, label: 'Çeyrek Yol!', reached: false },
  { id: 'milestone_50k', threshold: 50000, label: 'Yarı Yol!', reached: false },
  { id: 'milestone_100k', threshold: 100000, label: '100K Efsane!', reached: false },
];

// Streak multiplier tablosu
export const STREAK_MULTIPLIERS = {
  0: 1.0,  // No streak
  1: 1.0,  // First clear
  2: 2.0,  // 2x
  3: 3.0,  // 3x
  4: 4.0,  // 4x (max)
} as const;

export const ZEN_PALETTES = [
  ['#f59e0b', '#3b82f6', '#a78bfa', '#10b981', '#f472b6', '#6366f1'],  // default warm
  ['#06b6d4', '#0ea5e9', '#38bdf8', '#7dd3fc', '#67e8f9', '#22d3ee'],  // ocean cool
  ['#e879f9', '#a78bfa', '#818cf8', '#c084fc', '#f472b6', '#e879f9'],  // neon purple
  ['#34d399', '#6ee7b7', '#a7f3d0', '#10b981', '#059669', '#047857'],  // forest green
];

export const POINTS = {
  BLOCK_PLACED: 15,
  LINE_CLEARED: 150,
  COMBO_MULTIPLIER: 75,
  COLOR_BONUS_MULTIPLIER: 1.5,
  SURGE_MULTIPLIER: 2.0,
  BLITZ_TIME_BONUS: 100,
};

// TIMED Mode Constants
export const TIMED_MODE = {
  FINAL_SECONDS_THRESHOLD: 10,  // Seconds remaining for final bonus multiplier (1.5x)
  WARNING_THRESHOLD: 30,          // Seconds remaining for warning state
};

// COMBO Timer Constants
export const COMBO_TIMER = {
  DURATION: 10000, // 10 seconds in milliseconds
  WARNING_THRESHOLD: 4, // Show warning color when < 4 seconds
  CRITICAL_THRESHOLD: 2, // Show critical color when < 2 seconds
};

// CHRONO Block (Timed Mode)
export const CHRONO_BLOCK = {
  color: '#fde68a',  // Golden yellow
  icon: '⏱',         // Clock emoji
  glowColor: '#fbbf24',  // Golden glow
  type: 'CHRONO' as const,
  bonusSeconds: 5,
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
  // Score achievements (10 total)
  { id: 'score_1k', name: 'İlk Adım', description: 'Tek oyunda 1,000 puan', category: 'SCORE', targetValue: 1000, currentValue: 0, unlocked: false, hidden: false, fluxReward: 20 },
  { id: 'score_5k', name: 'Yükselen Yıldız', description: 'Tek oyunda 5,000 puan', category: 'SCORE', targetValue: 5000, currentValue: 0, unlocked: false, hidden: false, fluxReward: 35 },
  { id: 'score_10k', name: 'Yüksek Skorcu', description: 'Tek oyunda 10,000 puan', category: 'SCORE', targetValue: 10000, currentValue: 0, unlocked: false, hidden: false, fluxReward: 50 },
  { id: 'score_25k', name: 'Skor Avcısı', description: 'Tek oyunda 25,000 puan', category: 'SCORE', targetValue: 25000, currentValue: 0, unlocked: false, hidden: false, fluxReward: 75 },
  { id: 'score_50k', name: 'Skor Ustası', description: 'Tek oyunda 50,000 puan', category: 'SCORE', targetValue: 50000, currentValue: 0, unlocked: false, hidden: false, fluxReward: 100 },
  { id: 'score_75k', name: 'Skor Kralı', description: 'Tek oyunda 75,000 puan', category: 'SCORE', targetValue: 75000, currentValue: 0, unlocked: false, hidden: false, fluxReward: 150 },
  { id: 'score_100k', name: 'Efsane Skor', description: 'Tek oyunda 100,000 puan', category: 'SCORE', targetValue: 100000, currentValue: 0, unlocked: false, hidden: true, fluxReward: 200 },
  { id: 'score_250k', name: 'Skor Tanrısı', description: 'Tek oyunda 250,000 puan', category: 'SCORE', targetValue: 250000, currentValue: 0, unlocked: false, hidden: true, fluxReward: 300 },
  { id: 'score_500k', name: 'Skor Efsanesi', description: 'Tek oyunda 500,000 puan', category: 'SCORE', targetValue: 500000, currentValue: 0, unlocked: false, hidden: true, fluxReward: 500 },
  { id: 'score_1m', name: 'Milyon Kulübü', description: 'Tek oyunda 1,000,000 puan', category: 'SCORE', targetValue: 1000000, currentValue: 0, unlocked: false, hidden: true, fluxReward: 1000 },
  
  // Combo achievements (8 total)
  { id: 'combo_3', name: 'Kombo Başlangıcı', description: '3x kombo yap', category: 'COMBO', targetValue: 3, currentValue: 0, unlocked: false, hidden: false, fluxReward: 15 },
  { id: 'combo_5', name: 'Kombo Ustası', description: '5x kombo yap', category: 'COMBO', targetValue: 5, currentValue: 0, unlocked: false, hidden: false, fluxReward: 30 },
  { id: 'combo_10', name: 'Kombo Tanrısı', description: '10x kombo yap', category: 'COMBO', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 75 },
  { id: 'combo_15', name: 'Kombo Efsanesi', description: '15x kombo yap', category: 'COMBO', targetValue: 15, currentValue: 0, unlocked: false, hidden: true, fluxReward: 150 },
  { id: 'combo_20', name: 'Kombo Kralı', description: '20x kombo yap', category: 'COMBO', targetValue: 20, currentValue: 0, unlocked: false, hidden: true, fluxReward: 250 },
  { id: 'combo_25', name: 'Kombo İmparatoru', description: '25x kombo yap', category: 'COMBO', targetValue: 25, currentValue: 0, unlocked: false, hidden: true, fluxReward: 400 },
  { id: 'combo_30', name: 'Kombo Efsanesi', description: '30x kombo yap', category: 'COMBO', targetValue: 30, currentValue: 0, unlocked: false, hidden: true, fluxReward: 600 },
  { id: 'combo_streak', name: 'Kombo Zinciri', description: 'Bir oyunda 5 kez 5x kombo yap', category: 'COMBO', targetValue: 5, currentValue: 0, unlocked: false, hidden: false, fluxReward: 100 },
  
  // Special block achievements (10 total)
  { id: 'bomb_5', name: 'Bomba Başlangıcı', description: '5 bomba patlat', category: 'SPECIAL_BLOCKS', targetValue: 5, currentValue: 0, unlocked: false, hidden: false, fluxReward: 25 },
  { id: 'bomb_10', name: 'Bomba Uzmanı', description: '10 bomba patlat', category: 'SPECIAL_BLOCKS', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 40 },
  { id: 'bomb_50', name: 'Bomba Ustası', description: '50 bomba patlat', category: 'SPECIAL_BLOCKS', targetValue: 50, currentValue: 0, unlocked: false, hidden: false, fluxReward: 100 },
  { id: 'ice_25', name: 'Buz Başlangıcı', description: '25 buz bloğu kır', category: 'SPECIAL_BLOCKS', targetValue: 25, currentValue: 0, unlocked: false, hidden: false, fluxReward: 35 },
  { id: 'ice_50', name: 'Buz Kırıcı', description: '50 buz bloğu kır', category: 'SPECIAL_BLOCKS', targetValue: 50, currentValue: 0, unlocked: false, hidden: false, fluxReward: 60 },
  { id: 'ice_100', name: 'Buz Ustası', description: '100 buz bloğu kır', category: 'SPECIAL_BLOCKS', targetValue: 100, currentValue: 0, unlocked: false, hidden: false, fluxReward: 120 },
  { id: 'rainbow_5', name: 'Gökkuşağı Avcısı', description: '5 gökkuşağı bloğu temizle', category: 'SPECIAL_BLOCKS', targetValue: 5, currentValue: 0, unlocked: false, hidden: false, fluxReward: 50 },
  { id: 'lock_10', name: 'Kilit Kırıcı', description: '10 kilit bloğu kır', category: 'SPECIAL_BLOCKS', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 70 },
  { id: 'portal_5', name: 'Portal Gezgini', description: '5 portal bloğu kullan', category: 'SPECIAL_BLOCKS', targetValue: 5, currentValue: 0, unlocked: false, hidden: false, fluxReward: 55 },
  { id: 'special_master', name: 'Özel Blok Ustası', description: 'Her özel bloktan 10\'ar kullan', category: 'SPECIAL_BLOCKS', targetValue: 10, currentValue: 0, unlocked: false, hidden: true, fluxReward: 200 },
  
  // Ability achievements (8 total)
  { id: 'ability_first', name: 'İlk Yetenek', description: 'İlk yeteneğini kullan', category: 'ABILITIES', targetValue: 1, currentValue: 0, unlocked: false, hidden: false, fluxReward: 10 },
  { id: 'ability_10', name: 'Yetenek Kullanıcısı', description: '10 yetenek kullan', category: 'ABILITIES', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 30 },
  { id: 'ability_50', name: 'Yetenek Uzmanı', description: '50 yetenek kullan', category: 'ABILITIES', targetValue: 50, currentValue: 0, unlocked: false, hidden: false, fluxReward: 75 },
  { id: 'ability_master', name: 'Yetenek Ustası', description: 'Her yeteneği en az 10 kez kullan', category: 'ABILITIES', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 100 },
  { id: 'no_abilities', name: 'Saf Beceri', description: 'Yetenek kullanmadan 5000 puan', category: 'ABILITIES', targetValue: 5000, currentValue: 0, unlocked: false, hidden: true, fluxReward: 150 },
  { id: 'rotate_master', name: 'Döndürme Ustası', description: 'Rotate yeteneğini 50 kez kullan', category: 'ABILITIES', targetValue: 50, currentValue: 0, unlocked: false, hidden: false, fluxReward: 45 },
  { id: 'undo_saver', name: 'Zaman Yolcusu', description: 'Undo ile 20 hamle geri al', category: 'ABILITIES', targetValue: 20, currentValue: 0, unlocked: false, hidden: false, fluxReward: 60 },
  { id: 'surge_master', name: 'Surge Ustası', description: 'Surge\'ü 25 kez aktifleştir', category: 'ABILITIES', targetValue: 25, currentValue: 0, unlocked: false, hidden: false, fluxReward: 80 },
  
  // Progression achievements (10 total)
  { id: 'games_10', name: 'Yeni Başlayan', description: '10 oyun oyna', category: 'PROGRESSION', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 25 },
  { id: 'games_50', name: 'Düzenli Oyuncu', description: '50 oyun oyna', category: 'PROGRESSION', targetValue: 50, currentValue: 0, unlocked: false, hidden: false, fluxReward: 50 },
  { id: 'games_100', name: 'Bağımlı', description: '100 oyun oyna', category: 'PROGRESSION', targetValue: 100, currentValue: 0, unlocked: false, hidden: false, fluxReward: 100 },
  { id: 'games_500', name: 'Efsane Oyuncu', description: '500 oyun oyna', category: 'PROGRESSION', targetValue: 500, currentValue: 0, unlocked: false, hidden: true, fluxReward: 250 },
  { id: 'blocks_1000', name: 'Blok Yerleştirici', description: '1000 blok yerleştir', category: 'PROGRESSION', targetValue: 1000, currentValue: 0, unlocked: false, hidden: false, fluxReward: 50 },
  { id: 'blocks_5000', name: 'Blok Ustası', description: '5000 blok yerleştir', category: 'PROGRESSION', targetValue: 5000, currentValue: 0, unlocked: false, hidden: false, fluxReward: 100 },
  { id: 'lines_100', name: 'Satır Temizleyici', description: '100 satır temizle', category: 'PROGRESSION', targetValue: 100, currentValue: 0, unlocked: false, hidden: false, fluxReward: 40 },
  { id: 'lines_500', name: 'Satır Ustası', description: '500 satır temizle', category: 'PROGRESSION', targetValue: 500, currentValue: 0, unlocked: false, hidden: false, fluxReward: 80 },
  { id: 'perfect_clear', name: 'Mükemmel Temizlik', description: 'Tahtayı tamamen temizle', category: 'PROGRESSION', targetValue: 1, currentValue: 0, unlocked: false, hidden: false, fluxReward: 100 },
  { id: 'perfect_clear_10', name: 'Temizlik Uzmanı', description: '10 kez tahtayı tamamen temizle', category: 'PROGRESSION', targetValue: 10, currentValue: 0, unlocked: false, hidden: true, fluxReward: 200 },
  
  // Time & Speed achievements (6 total)
  { id: 'speed_demon', name: 'Hız Canavarı', description: '60 saniyede 5000 puan', category: 'SPEED', targetValue: 5000, currentValue: 0, unlocked: false, hidden: false, fluxReward: 100 },
  { id: 'marathon', name: 'Maraton Koşucusu', description: '30 dakika boyunca oyna', category: 'SPEED', targetValue: 1800, currentValue: 0, unlocked: false, hidden: false, fluxReward: 75 },
  { id: 'quick_combo', name: 'Hızlı Kombo', description: '10 saniyede 5x kombo', category: 'SPEED', targetValue: 5, currentValue: 0, unlocked: false, hidden: false, fluxReward: 60 },
  { id: 'timed_master', name: 'Zaman Ustası', description: 'Timed modda 10,000 puan', category: 'SPEED', targetValue: 10000, currentValue: 0, unlocked: false, hidden: false, fluxReward: 80 },
  { id: 'chrono_bonus', name: 'Zaman Bonusu', description: 'Toplam 60 saniye chrono bonus kazan', category: 'SPEED', targetValue: 60, currentValue: 0, unlocked: false, hidden: false, fluxReward: 90 },
  { id: 'sprint_master', name: 'Sprint Ustası', description: 'Final sprint bonusu 5000+ puan', category: 'SPEED', targetValue: 5000, currentValue: 0, unlocked: false, hidden: true, fluxReward: 150 },
  
  // Perfect & Mastery achievements (8 total)
  { id: 'no_mistakes', name: 'Hatasız', description: 'Bir oyunda hiç yanlış hamle yapma', category: 'MASTERY', targetValue: 1, currentValue: 0, unlocked: false, hidden: true, fluxReward: 200 },
  { id: 'efficiency', name: 'Verimlilik', description: '50 hamle ile 10,000 puan', category: 'MASTERY', targetValue: 10000, currentValue: 0, unlocked: false, hidden: true, fluxReward: 150 },
  { id: 'chain_master', name: 'Zincir Ustası', description: 'Bir oyunda 10 kez chain reaction', category: 'MASTERY', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 100 },
  { id: 'color_master', name: 'Renk Ustası', description: '20 kez color bonus kazan', category: 'MASTERY', targetValue: 20, currentValue: 0, unlocked: false, hidden: false, fluxReward: 80 },
  { id: 'tier_master', name: 'Tier Ustası', description: 'Tier 5\'e ulaş', category: 'MASTERY', targetValue: 5, currentValue: 0, unlocked: false, hidden: false, fluxReward: 120 },
  { id: 'event_master', name: 'Event Ustası', description: '10 farklı event yaşa', category: 'MASTERY', targetValue: 10, currentValue: 0, unlocked: false, hidden: false, fluxReward: 100 },
  { id: 'comeback', name: 'Geri Dönüş', description: '5 hücreden az kala 5000+ puan yap', category: 'MASTERY', targetValue: 5000, currentValue: 0, unlocked: false, hidden: true, fluxReward: 180 },
  { id: 'zen_master', name: 'Zen Ustası', description: 'Zen modda 1 saat oyna', category: 'MASTERY', targetValue: 3600, currentValue: 0, unlocked: false, hidden: false, fluxReward: 150 },
];
