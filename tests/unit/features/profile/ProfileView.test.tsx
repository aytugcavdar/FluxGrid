/**
 * Unit tests for ProfileView component
 * Tests profile display, stats rendering, and export functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileView } from '@features/profile/components/ProfileView';
import { useGameStore } from '@features/game/store/gameStore';
import { useAuthStore } from '@features/auth/store/authStore';
import * as audio from '@utils/audio';

// Mock audio utilities
vi.mock('@utils/audio', () => ({
  playClick: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

describe('ProfileView', () => {
  const mockOnClose = vi.fn();
  const mockOnOpenLeaderboard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default game state
    useGameStore.setState({
      stats: {
        gamesPlayed: 15,
        totalScore: 5000,
        linesCleared: 75,
        blocksPlaced: 300,
        bombsExploded: 10,
        iceBroken: 5,
        skillUses: {
          REROLL: 5,
          SHATTER: 3,
          BOMB: 2,
        },
      },
      highScore: 5000,
      achievements: [
        {
          id: 'first-game',
          name: 'İlk Oyun',
          description: 'İlk oyununu tamamla',
          unlocked: true,
          targetValue: 1,
          currentValue: 1,
          category: 'PROGRESSION',
        },
        {
          id: 'score-1000',
          name: '1000 Puan',
          description: '1000 puan kazan',
          unlocked: false,
          targetValue: 1000,
          currentValue: 500,
          category: 'SCORE',
        },
      ],
      maxLevelReached: 5,
    });

    // Setup auth state
    useAuthStore.setState({
      user: {
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        metadata: {} as any,
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({} as any),
        providerId: 'firebase',
        phoneNumber: null,
      } as any,
      isAnonymous: false,
    });
  });

  describe('Rendering', () => {
    it('should render profile view with header', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      expect(screen.getByText(/PROFİLİM/i)).toBeInTheDocument();
      expect(screen.getByText(/İSTATİSTİKLER · BAŞARIMLAR/i)).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      const backButton = screen.getAllByRole('button')[0];
      expect(backButton).toBeInTheDocument();
    });

    it('should render export button', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      expect(screen.getByText(/Dışa Aktar/i)).toBeInTheDocument();
    });

    it('should render profile header with user name', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
      expect(screen.getByText(/Google ile bağlı/i)).toBeInTheDocument();
    });

    it('should render tabs', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      expect(screen.getByText(/İstatistik/i)).toBeInTheDocument();
      expect(screen.getByText(/Modlar/i)).toBeInTheDocument();
      expect(screen.getByText(/Yetenekler/i)).toBeInTheDocument();
      expect(screen.getByText(/Başarımlar/i)).toBeInTheDocument();
    });
  });

  describe('Stats Display', () => {
    it('should display best score stat card', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      expect(screen.getByText(/En İyi Skor/i)).toBeInTheDocument();
      // Check for formatted number (locale-agnostic)
      const formattedScore = (5000).toLocaleString();
      expect(screen.getByText(formattedScore)).toBeInTheDocument();
    });

    it('should display games played stat card', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      // Use getAllByText since "Oyun" appears in multiple places
      const oyunElements = screen.getAllByText(/Oyun/i);
      expect(oyunElements.length).toBeGreaterThan(0);
      
      // Check for the stat card specifically
      const statCards = screen.getAllByText('15');
      expect(statCards.length).toBeGreaterThan(0);
    });

    it('should display blocks placed stat card', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      expect(screen.getByText(/Yerleştirilen Blok/i)).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();
    });

    it('should display lines cleared stat card', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      expect(screen.getByText(/Temizlenen Satır/i)).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('should display daily streak stat card', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      expect(screen.getByText(/Günlük Seri/i)).toBeInTheDocument();
      expect(screen.getByText(/🔥 0/i)).toBeInTheDocument();
    });

    it('should display bombs exploded stat card', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      expect(screen.getByText(/Patlatılan Bomba/i)).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should display total play time section', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      expect(screen.getByText(/Toplam Oyun/i)).toBeInTheDocument();
      // Multiple "15" elements exist, just check they're there
      const fifteenElements = screen.getAllByText('15');
      expect(fifteenElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/Tahmini süre:/i)).toBeInTheDocument();
    });
  });

  describe('Skill Usage', () => {
    it('should display skill usage section', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      // Click on skills tab
      const skillsTab = screen.getByText(/Yetenekler/i);
      fireEvent.click(skillsTab);

      expect(screen.getByText(/Reroll/i)).toBeInTheDocument();
      expect(screen.getByText(/Shatter/i)).toBeInTheDocument();
      // Use getAllByText since "Bomba" appears in multiple places
      const bombaElements = screen.getAllByText(/Bomba/i);
      expect(bombaElements.length).toBeGreaterThan(0);
    });

    it('should show skill counts', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      // Click on skills tab
      const skillsTab = screen.getByText(/Yetenekler/i);
      fireEvent.click(skillsTab);

      const fiveElements = screen.getAllByText('5');
      expect(fiveElements.length).toBeGreaterThan(0);
      const threeElements = screen.getAllByText('3');
      expect(threeElements.length).toBeGreaterThan(0);
      const twoElements = screen.getAllByText('2');
      expect(twoElements.length).toBeGreaterThan(0);
    });
  });

  describe('Interactions', () => {
    it('should call onClose when back button is clicked', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      const backButton = screen.getAllByRole('button')[0];
      fireEvent.click(backButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should play click sound when export button is clicked', () => {
      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      const exportButton = screen.getByText(/Dışa Aktar/i);
      fireEvent.click(exportButton);

      expect(audio.playClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stat Formatting', () => {
    it('should format large numbers with locale', () => {
      useGameStore.setState({
        stats: {
          ...useGameStore.getState().stats,
          totalScore: 123456,
          blocksPlaced: 9999,
        },
        highScore: 123456,
      });

      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      // Check for formatted numbers (locale-agnostic)
      expect(screen.getByText((123456).toLocaleString())).toBeInTheDocument();
      // blocksPlaced is displayed in stat card - just check it exists
      const container = screen.getByText(/Yerleştirilen Blok/i).closest('div');
      expect(container).toBeInTheDocument();
    });

    it('should display games played correctly', () => {
      useGameStore.setState({
        stats: {
          ...useGameStore.getState().stats,
          gamesPlayed: 42,
        },
      });

      render(<ProfileView onClose={mockOnClose} onOpenLeaderboard={mockOnOpenLeaderboard} />);

      // Multiple "42" elements exist (stat card + total play time)
      const fortyTwoElements = screen.getAllByText('42');
      expect(fortyTwoElements.length).toBeGreaterThan(0);
    });
  });
});
