/**
 * Unit tests for Event Duration Display in HUD
 * Tests Requirements 11.2, 11.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HUD } from '@features/hud/components/HUD';
import { useGameStore } from '@features/game/store/gameStore';
import { useThemeStore } from '@shared/store/themeStore';
import { GameMode } from '@shared/types';

// Mock stores
vi.mock('@features/game/store/gameStore');
vi.mock('@shared/store/themeStore');
vi.mock('@utils/audio', () => ({
  getMuted: vi.fn(() => false),
  toggleMute: vi.fn(() => false),
  playClick: vi.fn(),
  playSkill: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Zap: () => <div>Zap</div>,
  RefreshCw: () => <div>RefreshCw</div>,
  Hammer: () => <div>Hammer</div>,
  Volume2: () => <div>Volume2</div>,
  VolumeX: () => <div>VolumeX</div>,
  Home: () => <div>Home</div>,
  RotateCw: () => <div>RotateCw</div>,
}));

describe('Event Duration Display', () => {
  const mockThemeColors = {
    hudBackground: '#000',
    hudBorder: '#333',
    textPrimary: '#fff',
    textSecondary: '#ccc',
    textTertiary: '#999',
    trayBackground: '#111',
    cardBackground: '#222',
    cardBorder: '#444',
  };

  const createMockGameState = (overrides: any = {}) => ({
    score: 1000,
    highScore: 2000,
    combo: 0,
    gameMode: GameMode.ENDLESS,
    timeLeft: 0,
    setAppState: vi.fn(),
    activeEvent: null,
    eventMovesRemaining: 0,
    timedBoostMovesLeft: 0,
    miniEventState: { activeEvents: new Set(), moveCounters: {}, lastActivation: {} },
    difficultyTier: 0,
    ...overrides,
  });

  beforeEach(() => {
    vi.mocked(useThemeStore).mockReturnValue({
      getThemeColors: () => mockThemeColors,
    } as any);
    vi.mocked(useGameStore).mockReturnValue(createMockGameState() as any);
  });

  it('should not display event banner when no event is active', () => {
    vi.mocked(useGameStore).mockReturnValue(createMockGameState() as any);

    render(<HUD />);
    
    expect(screen.queryByText(/Buz Fırtınası/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Deprem/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ayna Modu/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Kaos Modu/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Void/i)).not.toBeInTheDocument();
  });

  it('should display ICE_STORM event with remaining moves', () => {
    vi.mocked(useGameStore).mockReturnValue(createMockGameState({
      score: 1500,
      activeEvent: 'ICE_STORM',
      eventMovesRemaining: 8,
      difficultyTier: 1,
    }) as any);

    render(<HUD />);
    
    const eventNames = screen.getAllByText(/Buz Fırtınası/i);
    expect(eventNames.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/8 hamle/i).length).toBeGreaterThan(0);
  });

  it('should display QUAKE event with remaining moves', () => {
    vi.mocked(useGameStore).mockReturnValue(createMockGameState({
      score: 9000,
      highScore: 10000,
      activeEvent: 'QUAKE',
      eventMovesRemaining: 5,
      difficultyTier: 3,
    }) as any);

    render(<HUD />);
    
    const eventNames = screen.getAllByText(/Deprem/i);
    expect(eventNames.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5 hamle/i).length).toBeGreaterThan(0);
  });

  it('should display MIRROR event with remaining moves', () => {
    vi.mocked(useGameStore).mockReturnValue(createMockGameState({
      score: 18000,
      highScore: 20000,
      activeEvent: 'MIRROR',
      eventMovesRemaining: 7,
      difficultyTier: 4,
    }) as any);

    render(<HUD />);
    
    const eventNames = screen.getAllByText(/Ayna Modu/i);
    expect(eventNames.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/7 hamle/i).length).toBeGreaterThan(0);
  });

  it('should display CHAOS event with remaining moves', () => {
    vi.mocked(useGameStore).mockReturnValue(createMockGameState({
      score: 35000,
      highScore: 40000,
      activeEvent: 'CHAOS',
      eventMovesRemaining: 12,
      difficultyTier: 5,
    }) as any);

    render(<HUD />);
    
    const eventNames = screen.getAllByText(/Kaos!/i);
    expect(eventNames.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/12 hamle/i).length).toBeGreaterThan(0);
  });

  it('should display VOID event with remaining moves', () => {
    vi.mocked(useGameStore).mockReturnValue(createMockGameState({
      score: 60000,
      highScore: 70000,
      activeEvent: 'VOID',
      eventMovesRemaining: 9,
      difficultyTier: 6,
    }) as any);

    render(<HUD />);
    
    const eventNames = screen.getAllByText(/Void/i);
    expect(eventNames.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/9 hamle/i).length).toBeGreaterThan(0);
  });

  it('should update display when event moves remaining changes', () => {
    // Initial state with 10 moves
    let gameState = createMockGameState({
      score: 1500,
      activeEvent: 'ICE_STORM',
      eventMovesRemaining: 10,
      difficultyTier: 1,
    });
    vi.mocked(useGameStore).mockImplementation(() => gameState as any);
    
    const { unmount } = render(<HUD />);
    expect(screen.getAllByText(/10 hamle/i).length).toBeGreaterThan(0);
    
    // After one move
    gameState = createMockGameState({
      score: 1500,
      activeEvent: 'ICE_STORM',
      eventMovesRemaining: 9,
      difficultyTier: 1,
    });
    
    unmount();
    render(<HUD />);
    expect(screen.getAllByText(/9 hamle/i).length).toBeGreaterThan(0);
  });

  it('should hide event banner when event expires', () => {
    // Event active
    let gameState = createMockGameState({
      score: 1500,
      activeEvent: 'ICE_STORM',
      eventMovesRemaining: 1,
      difficultyTier: 1,
    });
    vi.mocked(useGameStore).mockImplementation(() => gameState as any);
    
    const { unmount } = render(<HUD />);
    expect(screen.getAllByText(/Buz Fırtınası/i).length).toBeGreaterThan(0);
    
    // Event expired
    gameState = createMockGameState({
      score: 1500,
      activeEvent: null,
      eventMovesRemaining: 0,
      difficultyTier: 1,
    });
    
    unmount();
    render(<HUD />);
    expect(screen.queryByText(/Buz Fırtınası/i)).not.toBeInTheDocument();
  });

  it('should not display move count for infinite duration events', () => {
    vi.mocked(useGameStore).mockReturnValue(createMockGameState({
      score: 1500,
      activeEvent: 'ICE_STORM',
      eventMovesRemaining: 9999,
      difficultyTier: 1,
    }) as any);

    render(<HUD />);
    
    expect(screen.getAllByText(/Buz Fırtınası/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/9999 hamle/i)).not.toBeInTheDocument();
  });
});
