import { create } from 'zustand';

export type ThemeType = 'dark' | 'light' | 'neon' | 'ocean';

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
}

const THEMES: Record<ThemeType, ThemeColors> = {
  dark: {
    gridBase: '#0a0f18',
    gridSlot: '#0a0f18',
    gridEdge: '#3b4a5a',
    background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)',
    hudBackground: '#0d1117',
    hudBorder: 'rgba(255,255,255,0.06)',
    trayBackground: '#0d1117',
    textPrimary: '#e5e7eb',
    textSecondary: 'rgba(255,255,255,0.5)',
    textTertiary: 'rgba(255,255,255,0.25)',
    accentColor: '#3b82f6',
    surgeColor: '#f59e0b',
    modalOverlay: 'rgba(0,0,0,0.8)',
    cardBackground: '#1f2937',
    cardBorder: 'rgba(255,255,255,0.08)',
    pieceColors: ['#f59e0b', '#3b82f6', '#a78bfa', '#10b981', '#f472b6', '#6366f1']
  },
  light: {
    gridBase: '#e5e7eb',
    gridSlot: '#f3f4f6',
    gridEdge: '#9ca3af',
    background: 'linear-gradient(180deg, #f9fafb 0%, #e5e7eb 100%)',
    hudBackground: '#ffffff',
    hudBorder: 'rgba(0,0,0,0.08)',
    trayBackground: '#f1f5f9',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    accentColor: '#3b82f6',
    surgeColor: '#d97706',
    modalOverlay: 'rgba(15,23,42,0.7)',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.1)',
    pieceColors: ['#f59e0b', '#3b82f6', '#a78bfa', '#10b981', '#f472b6', '#6366f1']
  },
  neon: {
    gridBase: '#1a0a2e',
    gridSlot: '#16213e',
    gridEdge: '#0f3460',
    background: 'linear-gradient(180deg, #0f0e17 0%, #1a0a2e 100%)',
    hudBackground: '#0f0e17',
    hudBorder: 'rgba(232,121,249,0.15)',
    trayBackground: '#120d20',
    textPrimary: '#f0e6ff',
    textSecondary: 'rgba(240,230,255,0.5)',
    textTertiary: 'rgba(240,230,255,0.25)',
    accentColor: '#e879f9',
    surgeColor: '#06b6d4',
    modalOverlay: 'rgba(15,14,23,0.9)',
    cardBackground: '#1a0a2e',
    cardBorder: 'rgba(232,121,249,0.12)',
    pieceColors: ['#e879f9', '#06b6d4', '#a78bfa', '#10b981', '#f472b6', '#818cf8']
  },
  ocean: {
    gridBase: '#0c1821',
    gridSlot: '#1b2838',
    gridEdge: '#2d5f7e',
    background: 'linear-gradient(180deg, #0a1929 0%, #0c1821 100%)',
    hudBackground: '#0a1929',
    hudBorder: 'rgba(56,189,248,0.12)',
    trayBackground: '#0c1821',
    textPrimary: '#e0f2fe',
    textSecondary: 'rgba(224,242,254,0.5)',
    textTertiary: 'rgba(224,242,254,0.25)',
    accentColor: '#38bdf8',
    surgeColor: '#22d3ee',
    modalOverlay: 'rgba(10,25,41,0.9)',
    cardBackground: '#0c1821',
    cardBorder: 'rgba(56,189,248,0.1)',
    pieceColors: ['#38bdf8', '#0ea5e9', '#22d3ee', '#34d399', '#67e8f9', '#7dd3fc']
  }
};

interface ThemeStore {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  getThemeColors: () => ThemeColors;
  getPieceColors: () => string[];
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
  }
}));
