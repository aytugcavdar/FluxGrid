import { create } from 'zustand';

export type ThemeType = 'dark' | 'light' | 'neon' | 'ocean';

interface ThemeColors {
  gridBase: string;
  gridSlot: string;
  gridEdge: string;
  background: string;
}

const THEMES: Record<ThemeType, ThemeColors> = {
  dark: {
    gridBase: '#0a0f18',
    gridSlot: '#0a0f18',
    gridEdge: '#3b4a5a',
    background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)'
  },
  light: {
    gridBase: '#e5e7eb',
    gridSlot: '#f3f4f6',
    gridEdge: '#6b7280',
    background: 'linear-gradient(180deg, #f9fafb 0%, #e5e7eb 100%)'
  },
  neon: {
    gridBase: '#1a0a2e',
    gridSlot: '#16213e',
    gridEdge: '#0f3460',
    background: 'linear-gradient(180deg, #0f0e17 0%, #1a0a2e 100%)'
  },
  ocean: {
    gridBase: '#0c1821',
    gridSlot: '#1b2838',
    gridEdge: '#2d5f7e',
    background: 'linear-gradient(180deg, #0a1929 0%, #0c1821 100%)'
  }
};

interface ThemeStore {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  getThemeColors: () => ThemeColors;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  currentTheme: (localStorage.getItem('flux_theme') as ThemeType) || 'dark',
  
  setTheme: (theme: ThemeType) => {
    set({ currentTheme: theme });
    localStorage.setItem('flux_theme', theme);
  },
  
  getThemeColors: () => {
    return THEMES[get().currentTheme];
  }
}));
