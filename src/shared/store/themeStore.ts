import { create } from 'zustand';

export type ThemeType = 'dark' | 'light' | 'neon';

interface ThemeColors {
  // Grid colors
  gridBase: string;
  gridSlot: string;
  gridEdge: string;
  background: string;
  
  // HUD & UI colors
  hudBackground: string;
  hudBorder: string;
  trayBackground: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  
  // Accent colors
  accentColor: string;
  surgeColor: string;
  
  // Modal & Card colors
  modalOverlay: string;
  cardBackground: string;
  cardBorder: string;
  
  // Piece colors
  pieceColors: string[];
  
  // New UI Redesign colors
  screenBackground: string;
  cardBackgroundTransparent: string;
  cardBorderTransparent: string;
  accentPrimary: string; // Blue for navigation
  accentSonsuz: string;  // Purple for Endless mode
  accentTimed: string;   // Orange for Timed mode
}

const THEMES: Record<ThemeType, ThemeColors> = {
  dark: {
    gridBase: '#111c32',
    gridSlot: '#111c32',
    gridEdge: 'rgba(255,255,255,0.11)',
    background: 'linear-gradient(135deg, #0f0c1d 0%, #1a1333 50%, #0f0c1d 100%)',
    hudBackground: '#0d1117',
    hudBorder: 'rgba(255,255,255,0.06)',
    trayBackground: '#0d1117',
    textPrimary: '#e5e7eb',
    textSecondary: 'rgba(255,255,255,0.6)',
    textTertiary: 'rgba(255,255,255,0.3)',
    accentColor: '#a855f7',
    surgeColor: '#f59e0b',
    modalOverlay: 'rgba(0,0,0,0.85)',
    cardBackground: '#1f2937',
    cardBorder: 'rgba(255,255,255,0.08)',
    pieceColors: ['#c084fc', '#fbbf24', '#60a5fa', '#34d399', '#fb7185', '#818cf8', '#06b6d4', '#84cc16', '#fb7185'],
    // New UI Redesign colors
    screenBackground: 'linear-gradient(135deg, #0f0c1d 0%, #1a1333 50%, #0f0c1d 100%)',
    cardBackgroundTransparent: 'rgba(255,255,255,0.03)',
    cardBorderTransparent: 'rgba(255,255,255,0.08)',
    accentPrimary: '#a855f7',
    accentSonsuz: '#a855f7',
    accentTimed: '#f59e0b',
  },
  light: {
    gridBase: '#fef3c7',
    gridSlot: '#fef9e7',
    gridEdge: '#fbbf24',
    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
    hudBackground: '#ffffff',
    hudBorder: 'rgba(251,191,36,0.2)',
    trayBackground: '#fffbeb',
    textPrimary: '#451a03',
    textSecondary: '#78350f',
    textTertiary: '#92400e',
    accentColor: '#f59e0b',
    surgeColor: '#ea580c',
    modalOverlay: 'rgba(120,53,15,0.7)',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(251,191,36,0.15)',
    pieceColors: ['#d97706', '#dc2626', '#2563eb', '#059669', '#7c3aed', '#db2777', '#0891b2', '#65a30d', '#ea580c'],
    // New UI Redesign colors
    screenBackground: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
    cardBackgroundTransparent: 'rgba(255,255,255,0.85)',
    cardBorderTransparent: 'rgba(120,53,15,0.2)',
    accentPrimary: '#ea580c',
    accentSonsuz: '#dc2626',
    accentTimed: '#c2410c',
  },
  neon: {
    gridBase: '#1a0a2e',
    gridSlot: '#16213e',
    gridEdge: '#e879f9',
    background: 'linear-gradient(135deg, #0f0e17 0%, #1a0a2e 50%, #2d1b4e 100%)',
    hudBackground: '#0f0e17',
    hudBorder: 'rgba(232,121,249,0.2)',
    trayBackground: '#120d20',
    textPrimary: '#fdf4ff',
    textSecondary: 'rgba(253,244,255,0.7)',
    textTertiary: 'rgba(253,244,255,0.4)',
    accentColor: '#e879f9',
    surgeColor: '#c084fc',
    modalOverlay: 'rgba(15,14,23,0.9)',
    cardBackground: '#1a0a2e',
    cardBorder: 'rgba(232,121,249,0.15)',
    pieceColors: ['#e879f9', '#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#facc15', '#60a5fa', '#fb7185', '#c084fc'],
    // New UI Redesign colors
    screenBackground: 'linear-gradient(135deg, #0f0e17 0%, #1a0a2e 50%, #2d1b4e 100%)',
    cardBackgroundTransparent: 'rgba(232,121,249,0.08)',
    cardBorderTransparent: 'rgba(232,121,249,0.15)',
    accentPrimary: '#e879f9',
    accentSonsuz: '#c084fc',
    accentTimed: '#a78bfa',
  }
};

const ACTIVE_THEME: ThemeType = 'dark';
const THEME_TRIAL_EXPIRY_KEY = 'flux_theme_trial_neon_expires_at';

export const THEME_SWATCHES: Record<ThemeType, string[]> = {
  dark: ['#a855f7', '#3b82f6', '#f59e0b'],
  light: ['#f59e0b', '#2563eb', '#059669'],
  neon: ['#e879f9', '#22d3ee', '#facc15'],
};

const isThemeType = (theme: string | null): theme is ThemeType => {
  return theme === 'dark' || theme === 'light' || theme === 'neon';
};

const getNeonTrialExpiry = (): number => {
  const value = Number(localStorage.getItem(THEME_TRIAL_EXPIRY_KEY));
  return Number.isFinite(value) ? value : 0;
};

const hasNeonTrial = (): boolean => getNeonTrialExpiry() > Date.now();

const savedTheme = localStorage.getItem('flux_theme');
if (savedTheme !== ACTIVE_THEME && !(savedTheme === 'neon' && hasNeonTrial())) {
  localStorage.setItem('flux_theme', ACTIVE_THEME);
}
const initialTheme: ThemeType = savedTheme === 'neon' && hasNeonTrial()
  ? 'neon'
  : ACTIVE_THEME;

interface ThemeStore {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  activateThemeTrial: (theme: 'neon', durationHours?: number) => number;
  getThemeTrialRemainingMs: (theme: 'neon') => number;
  isThemeAvailable: (theme: ThemeType) => boolean;
  getThemeColors: () => ThemeColors;
  getPieceColors: () => string[];
  getColors: () => ThemeColors; // Alias for getThemeColors
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  currentTheme: isThemeType(initialTheme) ? initialTheme : ACTIVE_THEME,
  
  setTheme: (theme) => {
    const nextTheme = theme === ACTIVE_THEME || (theme === 'neon' && hasNeonTrial())
      ? theme
      : ACTIVE_THEME;
    set({ currentTheme: nextTheme });
    localStorage.setItem('flux_theme', nextTheme);
  },

  activateThemeTrial: (theme, durationHours = 24) => {
    const expiresAt = Date.now() + (Math.max(1, durationHours) * 60 * 60 * 1000);
    localStorage.setItem(THEME_TRIAL_EXPIRY_KEY, String(expiresAt));
    localStorage.setItem('flux_theme', theme);
    set({ currentTheme: theme });
    return expiresAt;
  },

  getThemeTrialRemainingMs: () => Math.max(0, getNeonTrialExpiry() - Date.now()),

  isThemeAvailable: (theme) => theme === ACTIVE_THEME || (theme === 'neon' && hasNeonTrial()),
  
  getThemeColors: () => {
    return THEMES[get().currentTheme];
  },
  
  getPieceColors: () => {
    return THEMES[get().currentTheme].pieceColors;
  },
  
  getColors: () => {
    return THEMES[get().currentTheme];
  },
}));
