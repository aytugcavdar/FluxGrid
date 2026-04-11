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
    gridBase: '#0a0f18',
    gridSlot: '#0a0f18',
    gridEdge: '#3b4a5a',
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
    pieceColors: ['#a855f7', '#f59e0b', '#3b82f6', '#10b981', '#f472b6', '#6366f1'],
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
    pieceColors: ['#f59e0b', '#ea580c', '#fb923c', '#fbbf24', '#f97316', '#fdba74'],
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
    pieceColors: ['#e879f9', '#c084fc', '#a78bfa', '#d946ef', '#f0abfc', '#e879f9'],
    // New UI Redesign colors
    screenBackground: 'linear-gradient(135deg, #0f0e17 0%, #1a0a2e 50%, #2d1b4e 100%)',
    cardBackgroundTransparent: 'rgba(232,121,249,0.08)',
    cardBorderTransparent: 'rgba(232,121,249,0.15)',
    accentPrimary: '#e879f9',
    accentSonsuz: '#c084fc',
    accentTimed: '#a78bfa',
  }
};

interface ThemeStore {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  getThemeColors: () => ThemeColors;
  getPieceColors: () => string[];
  getColors: () => ThemeColors; // Alias for getThemeColors
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  currentTheme: (localStorage.getItem('flux_theme') as ThemeType) || 'dark',
  
  setTheme: (theme: ThemeType) => {
    set({ currentTheme: theme });
    localStorage.setItem('flux_theme', theme);
  },
  
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
