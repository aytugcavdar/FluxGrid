/**
 * Unit tests for CareerPage component
 * Tests career stats display and achievements
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CareerPage } from '@features/career/components/CareerPage';
import { useGameStore } from '@features/game/store/gameStore';
import { AppState } from '@shared/types';
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

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'career.title': 'KARİYER',
        'career.subtitle': 'İstatistikler ve Başarılar',
        'career.stats': 'İSTATİSTİKLER',
        'career.achievements': 'BAŞARILAR',
        'career.totalScore': 'TOPLAM SKOR',
        'career.linesCleared': 'TEMİZLENEN SATIRLAR',
        'career.blocksPlaced': 'YERLEŞTİRİLEN BLOKLAR',
        'career.gamesPlayed': 'OYNANAN OYUN',
        'career.bombsExploded': 'PATLATILAN BOMBALAR',
        'career.iceBroken': 'KIRILAN BUZLAR',
      };
      return translations[key] || key;
    },
  }),
}));

describe('CareerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default game state
    useGameStore.setState({
      stats: {
        gamesPlayed: 15,
        totalScore: 12500,
        linesCleared: 75,
        blocksPlaced: 300,
        bombsExploded: 10,
        iceBroken: 5,
        skillUses: {},
      },
      achievements: [
        {
          id: 'first-game',
          name: 'İlk Oyun',
          description: 'İlk oyununu tamamla',
          unlocked: true,
          targetValue: 1,
          currentValue: 1,
        },
        {
          id: 'score-1000',
          name: '1000 Puan',
          description: '1000 puan kazan',
          unlocked: true,
          targetValue: 1000,
          currentValue: 1000,
        },
        {
          id: 'score-10000',
          name: '10000 Puan',
          description: '10000 puan kazan',
          unlocked: false,
          targetValue: 10000,
          currentValue: 5000,
        },
      ],
    });
  });

  describe('Rendering', () => {
    it('should render career page header', () => {
      render(<CareerPage />);

      expect(screen.getByText(/Profil/i)).toBeInTheDocument();
      expect(screen.getByText(/İstatistikler ve Başarımlar/i)).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(<CareerPage />);

      const backButton = screen.getAllByRole('button')[0];
      expect(backButton).toBeInTheDocument();
    });

    it('should render best score section', () => {
      render(<CareerPage />);

      // Use getAllByText since "En İyi Skor" appears in multiple places
      const bestScoreElements = screen.getAllByText(/En İyi Skor/i);
      expect(bestScoreElements.length).toBeGreaterThan(0);
    });

    it('should render achievements section', () => {
      render(<CareerPage />);

      // Use getAllByText since "Başarımlar" appears in multiple places
      const achievementsElements = screen.getAllByText(/Başarımlar/i);
      expect(achievementsElements.length).toBeGreaterThan(0);
    });
  });

  describe('Stats Display', () => {
    it('should display best score stat', () => {
      useGameStore.setState({ highScore: 12500 });
      render(<CareerPage />);

      // Use getAllByText since "En İyi Skor" appears in multiple places
      const bestScoreElements = screen.getAllByText(/En İyi Skor/i);
      expect(bestScoreElements.length).toBeGreaterThan(0);
      // Check for formatted number (locale-agnostic) - now appears in both best score and total score
      const formattedScores = screen.getAllByText((12500).toLocaleString());
      expect(formattedScores.length).toBeGreaterThan(0);
    });

    it('should display games played stat', () => {
      render(<CareerPage />);

      expect(screen.getByText(/Oynanan Oyun/i)).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should display lines cleared stat', () => {
      render(<CareerPage />);

      expect(screen.getByText(/Temizlenen Satır/i)).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('should render stat cards', () => {
      const { container } = render(<CareerPage />);

      // Check that stat cards exist
      const statCards = container.querySelectorAll('.grid.grid-cols-2 > div');
      expect(statCards.length).toBeGreaterThan(0);
    });
  });

  describe('Achievements Display', () => {
    it('should display achievement count', () => {
      render(<CareerPage />);

      expect(screen.getByText(/2 \/ 3/i)).toBeInTheDocument();
    });

    it('should display unlocked achievements', () => {
      render(<CareerPage />);

      expect(screen.getByText('İlk Oyun')).toBeInTheDocument();
      expect(screen.getByText('İlk oyununu tamamla')).toBeInTheDocument();
      expect(screen.getByText('1000 Puan')).toBeInTheDocument();
      expect(screen.getByText('1000 puan kazan')).toBeInTheDocument();
    });

    it('should display locked achievements', () => {
      render(<CareerPage />);

      expect(screen.getByText('10000 Puan')).toBeInTheDocument();
      expect(screen.getByText('10000 puan kazan')).toBeInTheDocument();
    });

    it('should show checkmark for unlocked achievements', () => {
      render(<CareerPage />);

      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBe(2); // 2 unlocked achievements
    });

    it('should show lock emoji for locked achievements', () => {
      render(<CareerPage />);

      const locks = screen.getAllByText('🔒');
      expect(locks.length).toBe(1); // 1 locked achievement
    });

    it('should apply different styles to unlocked vs locked achievements', () => {
      const { container } = render(<CareerPage />);

      const achievementCards = container.querySelectorAll('.space-y-2 > div');
      expect(achievementCards.length).toBe(3);

      // First two should have green styling (unlocked)
      expect(achievementCards[0].className).toContain('bg-green-900/10');
      expect(achievementCards[1].className).toContain('bg-green-900/10');

      // Last one should have gray styling and opacity (locked)
      expect(achievementCards[2].className).toContain('bg-gray-800/30');
      expect(achievementCards[2].className).toContain('opacity-40');
    });
  });

  describe('Interactions', () => {
    it('should call playClick and navigate to HOME when back button is clicked', () => {
      const setAppState = vi.fn();
      useGameStore.setState({ setAppState });

      render(<CareerPage />);

      const backButton = screen.getAllByRole('button')[0];
      fireEvent.click(backButton);

      expect(audio.playClick).toHaveBeenCalledTimes(1);
      expect(setAppState).toHaveBeenCalledWith(AppState.HOME);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero stats', () => {
      useGameStore.setState({
        stats: {
          gamesPlayed: 0,
          totalScore: 0,
          linesCleared: 0,
          blocksPlaced: 0,
          bombsExploded: 0,
          iceBroken: 0,
          skillUses: {},
        },
        highScore: 0,
      });

      render(<CareerPage />);

      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });

    it('should handle empty achievements array', () => {
      useGameStore.setState({
        achievements: [],
      });

      render(<CareerPage />);

      expect(screen.getByText(/0 \/ 0/i)).toBeInTheDocument();
    });

    it('should handle all achievements unlocked', () => {
      useGameStore.setState({
        achievements: [
          {
            id: 'ach1',
            name: 'Başarı 1',
            description: 'Açıklama 1',
            unlocked: true,
            targetValue: 100,
            currentValue: 100,
          },
          {
            id: 'ach2',
            name: 'Başarı 2',
            description: 'Açıklama 2',
            unlocked: true,
            targetValue: 200,
            currentValue: 200,
          },
        ],
      });

      render(<CareerPage />);

      expect(screen.getByText(/2 \/ 2/i)).toBeInTheDocument();
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBe(2);
    });

    it('should format large numbers correctly', () => {
      useGameStore.setState({
        stats: {
          ...useGameStore.getState().stats,
          totalScore: 1234567,
        },
        highScore: 1234567,
      });

      render(<CareerPage />);

      // Check that numbers are formatted with locale - appears in both best score and total score
      const formattedNumbers = screen.getAllByText((1234567).toLocaleString());
      expect(formattedNumbers.length).toBeGreaterThan(0);
    });
  });
});
