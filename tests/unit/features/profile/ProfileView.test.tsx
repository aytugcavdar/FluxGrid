/**
 * Unit tests for ProfileView component
 * Tests profile display, stats rendering, and export functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileView } from '@features/profile/components/ProfileView';
import { useProfileStore } from '@features/profile/store/profileStore';
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
}));

describe('ProfileView', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default profile state
    useProfileStore.setState({
      profile: {
        username: 'test-user',
        createdAt: Date.now(),
        lastPlayed: Date.now(),
        stats: {
          gamesPlayed: 10,
          totalScore: 5000,
          linesCleared: 50,
          blocksPlaced: 200,
          bombsExploded: 5,
          iceBroken: 3,
          highestCombo: 8,
          longestSession: 300000, // 5 minutes
          totalPlaytime: 600000, // 10 minutes
          skillUses: new Map(),
        },
        achievements: new Map(),
        progression: {
          currentLevel: 1,
          maxLevelReached: 1,
          totalScore: 5000,
          levelProgress: new Map(),
          unlockedAbilities: new Set(),
        },
        unlockedAbilities: new Set(),
        equippedPassives: [],
      },
    });
  });

  describe('Rendering', () => {
    it('should render profile view with header', () => {
      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText(/PROFİLİM/i)).toBeInTheDocument();
      expect(screen.getByText(/İstatistikler ve Veriler/i)).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(<ProfileView onClose={mockOnClose} />);

      const backButton = screen.getAllByRole('button')[0];
      expect(backButton).toBeInTheDocument();
    });

    it('should render export button', () => {
      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText(/Dışa Aktar/i)).toBeInTheDocument();
    });

    it('should render profile header with user icon', () => {
      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText(/OYUNCU/i)).toBeInTheDocument();
      expect(screen.getByText(/FluxGrid Ustası/i)).toBeInTheDocument();
    });

    it('should return null when profile is not available', () => {
      useProfileStore.setState({ profile: null });

      const { container } = render(<ProfileView onClose={mockOnClose} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Stats Display', () => {
    it('should display total score stat card', () => {
      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText(/TOPLAM SKOR/i)).toBeInTheDocument();
      expect(screen.getByText('5.000')).toBeInTheDocument(); // Turkish locale formatting
    });

    it('should display games played stat card', () => {
      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText(/OYNANAN OYUN/i)).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should display playtime stat card', () => {
      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText(/OYUN SÜRESİ/i)).toBeInTheDocument();
    });

    it('should display average score stat card', () => {
      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText(/ORTALAMA SKOR/i)).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument(); // 5000 / 10
    });

    it('should display detailed stats section', () => {
      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText(/DETAYLI İSTATİSTİKLER/i)).toBeInTheDocument();
      expect(screen.getByText(/Yerleştirilen Bloklar/i)).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText(/Temizlenen Satırlar/i)).toBeInTheDocument();
      const fiftyElements = screen.getAllByText('50');
      expect(fiftyElements.length).toBeGreaterThan(0);
    });

    it('should display bomb and ice stats', () => {
      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText(/Patlatılan Bombalar/i)).toBeInTheDocument();
      const fiveElements = screen.getAllByText('5');
      expect(fiveElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/Kırılan Buzlar/i)).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display highest combo', () => {
      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText(/En Yüksek Kombo/i)).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should display longest session in minutes', () => {
      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText(/En Uzun Oturum/i)).toBeInTheDocument();
      expect(screen.getByText('5d')).toBeInTheDocument(); // 300000ms = 5 minutes
    });
  });

  describe('Skill Usage', () => {
    it('should display skill usage section', () => {
      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText(/YETENEKLERİM/i)).toBeInTheDocument();
    });

    it('should show message when no skills used', () => {
      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText(/Henüz yetenek kullanılmadı/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClose when back button is clicked', () => {
      render(<ProfileView onClose={mockOnClose} />);

      const backButton = screen.getAllByRole('button')[0];
      fireEvent.click(backButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should play click sound when export button is clicked', () => {
      render(<ProfileView onClose={mockOnClose} />);

      const exportButton = screen.getByText(/Dışa Aktar/i);
      fireEvent.click(exportButton);

      expect(audio.playClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stat Formatting', () => {
    it('should format large numbers with locale', () => {
      useProfileStore.setState({
        profile: {
          ...useProfileStore.getState().profile!,
          stats: {
            ...useProfileStore.getState().profile!.stats,
            totalScore: 123456,
            blocksPlaced: 9999,
          },
        },
      });

      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText('123.456')).toBeInTheDocument();
      expect(screen.getByText('9.999')).toBeInTheDocument();
    });

    it('should calculate and display average score correctly', () => {
      useProfileStore.setState({
        profile: {
          ...useProfileStore.getState().profile!,
          stats: {
            ...useProfileStore.getState().profile!.stats,
            totalScore: 10000,
            gamesPlayed: 4,
          },
        },
      });

      render(<ProfileView onClose={mockOnClose} />);

      expect(screen.getByText('2.500')).toBeInTheDocument(); // 10000 / 4
    });
  });
});
