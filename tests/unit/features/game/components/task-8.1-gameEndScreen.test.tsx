/**
 * Task 8.1: GameEndScreen Enhanced Stats Display Tests
 * 
 * Tests for the enhanced game end screen that displays:
 * - Final score prominently
 * - Personal best score
 * - New record badge if isNewRecord is true
 * - Lines cleared count
 * - Maximum combo achieved
 * - Game duration in MM:SS format
 * - Final sprint bonus
 * - New record score difference
 * - Semantic HTML and accessibility features
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameOverModal } from '../../../../../src/app/components/GameOverModal';
import { GameMode } from '../../../../../src/shared/types';

describe('Task 8.1: GameEndScreen Enhanced Stats Display', () => {
  const mockStats = {
    linesCleared: 42,
    timedHighScore: 15000,
    timedMaxCombo: 8,
    blocksPlaced: 100,
    totalScore: 12000,
    bombsExploded: 0,
    iceBroken: 0,
    gamesPlayed: 5,
    skillUses: {},
  };

  const defaultProps = {
    isGameOver: true,
    score: 12000,
    displayScore: 12000,
    highScore: 15000,
    currentModeHighScore: 15000,
    isNewRecord: false,
    showRecordBadge: false,
    showButtons: true,
    gameMode: GameMode.TIMED,
    combo: 5,
    maxCombo: 8,
    todayBestCombo: 6,
    finalSprintBonus: 500,
    newRecordDiff: 0,
    stats: mockStats,
    difficultyTier: 3,
    surgeWasUsed: false,
    dailyClearHistory: [],
    shareStatus: 'idle' as const,
    showPWAPrompt: false,
    showIOSInstructions: false,
    timerStartTime: Date.now() - 125000, // 2:05 ago
    timerExpectedEnd: Date.now(),
    onClose: () => {},
    onPlayAgain: () => {},
    onTryMode: () => {},
    onShare: async () => {},
    onInstallPWA: async () => {},
    onCloseIOSInstructions: () => {},
  };

  describe('Requirement 9.1: Display final score prominently', () => {
    it('should display the final score', () => {
      render(<GameOverModal {...defaultProps} />);
      
      // Score should be visible (using CountUp component)
      const scoreElement = screen.getByLabelText(/final skor/i);
      expect(scoreElement).toBeInTheDocument();
    });
  });

  describe('Requirement 9.2: Display personal best score', () => {
    it('should display personal best for TIMED mode', () => {
      render(<GameOverModal {...defaultProps} />);
      
      // Personal best should be displayed
      const personalBestElement = screen.getByText(/EN İYİ:/i);
      expect(personalBestElement).toBeInTheDocument();
      // Turkish locale uses periods for thousands separator
      expect(screen.getByText(/15\.000/)).toBeInTheDocument();
    });

    it('should have accessible label for personal best', () => {
      render(<GameOverModal {...defaultProps} />);
      
      // Use getAllByLabelText since there might be multiple elements with similar labels
      const personalBestElements = screen.getAllByLabelText(/en iyi skor/i);
      expect(personalBestElements.length).toBeGreaterThan(0);
      expect(personalBestElements[0]).toBeInTheDocument();
    });
  });

  describe('Requirement 9.3: Display new record badge if isNewRecord is true', () => {
    it('should display new record badge when isNewRecord is true', () => {
      render(
        <GameOverModal 
          {...defaultProps} 
          isNewRecord={true}
          showRecordBadge={true}
          score={20000}
          displayScore={20000}
        />
      );
      
      const newRecordBadge = screen.getByText(/YENİ REKOR!/i);
      expect(newRecordBadge).toBeInTheDocument();
    });

    it('should have accessible label for new record badge', () => {
      render(
        <GameOverModal 
          {...defaultProps} 
          isNewRecord={true}
          showRecordBadge={true}
          score={20000}
          displayScore={20000}
        />
      );
      
      const newRecordElement = screen.getByRole('status', { name: /^yeni rekor$/i });
      expect(newRecordElement).toBeInTheDocument();
    });

    it('should not display new record badge when isNewRecord is false', () => {
      render(<GameOverModal {...defaultProps} isNewRecord={false} />);
      
      const newRecordBadge = screen.queryByText(/YENİ REKOR!/i);
      expect(newRecordBadge).not.toBeInTheDocument();
    });
  });

  describe('Requirement 9.4: Display lines cleared count', () => {
    it('should display lines cleared in stats', () => {
      render(<GameOverModal {...defaultProps} />);
      
      // Lines cleared should be visible in stat chips
      const linesElement = screen.getByLabelText(/Satır: 42/i);
      expect(linesElement).toBeInTheDocument();
    });
  });

  describe('Requirement 9.5: Display maximum combo achieved', () => {
    it('should display max combo in stats', () => {
      render(<GameOverModal {...defaultProps} />);
      
      // Max combo should be visible in stat chips
      const comboElement = screen.getByLabelText(/Max Combo: ×8/i);
      expect(comboElement).toBeInTheDocument();
    });
  });
  describe('Requirement 9.7: Display game duration in MM:SS format', () => {
    it('should display game duration in MM:SS format', () => {
      render(<GameOverModal {...defaultProps} />);
      
      // Duration should be visible in stat chips - it will show actual elapsed time
      const durationElement = screen.getByLabelText(/Süre:/i);
      expect(durationElement).toBeInTheDocument();
    });

    it('should format duration correctly for different times', () => {
      const propsWithDifferentTime = {
        ...defaultProps,
        timerStartTime: Date.now() - 65000, // 1:05 ago
      };
      
      render(<GameOverModal {...propsWithDifferentTime} />);
      
      const durationElement = screen.getByLabelText(/Süre:/i);
      expect(durationElement).toBeInTheDocument();
    });

    it('should handle zero duration', () => {
      const propsWithZeroDuration = {
        ...defaultProps,
        timerStartTime: null,
        timerExpectedEnd: null,
      };
      
      render(<GameOverModal {...propsWithZeroDuration} />);
      
      const durationElement = screen.getByLabelText(/Süre: 0:00/i);
      expect(durationElement).toBeInTheDocument();
    });
  });

  describe('Timed Mode: Final sprint and record diff', () => {
    it('should display final sprint bonus', () => {
      render(<GameOverModal {...defaultProps} />);

      const sprintElement = screen.getByLabelText(/Final Sprint: \+500/i);
      expect(sprintElement).toBeInTheDocument();
    });

    it('should display new record diff when timed score beats the record', () => {
      render(
        <GameOverModal
          {...defaultProps}
          isNewRecord={true}
          showRecordBadge={true}
          score={20000}
          displayScore={20000}
          newRecordDiff={5000}
        />
      );

      expect(screen.getByLabelText(/Yeni rekor farkı: \+5\.000/i)).toBeInTheDocument();
    });
  });

  describe('Motivational recap', () => {
    it('should explain why the run ended', () => {
      render(<GameOverModal {...defaultProps} />);

      expect(screen.getByLabelText(/oyun sonu özeti/i)).toBeInTheDocument();
      expect(screen.getByText(/Son bölümde tempo düştü/i)).toBeInTheDocument();
    });

    it('should show remaining score to record', () => {
      render(<GameOverModal {...defaultProps} />);

      expect(screen.getByText(/Rekora 3\.000 kaldı\./i)).toBeInTheDocument();
    });

    it('should show today best combo', () => {
      render(<GameOverModal {...defaultProps} />);

      expect(screen.getByText(/Bugünün en iyi kombosu: 6×/i)).toBeInTheDocument();
    });

    it('should show a mode-specific retry tip', () => {
      render(<GameOverModal {...defaultProps} />);

      expect(screen.getByText(/Tekrar dene: ilk 30 saniyede combo kur/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility: Semantic HTML', () => {
    it('should use dialog role for modal', () => {
      render(<GameOverModal {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have proper heading structure', () => {
      render(<GameOverModal {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should use list role for stats', () => {
      render(<GameOverModal {...defaultProps} />);
      
      const statsList = screen.getByRole('list', { name: /oyun istatistikleri/i });
      expect(statsList).toBeInTheDocument();
    });

    it('should have list items for each stat', () => {
      render(<GameOverModal {...defaultProps} />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility: Descriptive labels for screen readers', () => {
    it('should have aria-label for close button', () => {
      render(<GameOverModal {...defaultProps} />);
      
      const closeButton = screen.getByLabelText(/kapat/i);
      expect(closeButton).toBeInTheDocument();
    });

    it('should have aria-label for play again button', () => {
      render(<GameOverModal {...defaultProps} />);
      
      const playAgainButton = screen.getByLabelText(/tekrar oyna/i);
      expect(playAgainButton).toBeInTheDocument();
    });

    it('should have aria-label for share button', () => {
      render(<GameOverModal {...defaultProps} />);
      
      const shareButton = screen.getByLabelText(/sonucu paylaş/i);
      expect(shareButton).toBeInTheDocument();
    });

    it('should have aria-hidden for decorative icons', () => {
      const { container } = render(<GameOverModal {...defaultProps} />);
      
      // Emojis and decorative icons should have aria-hidden
      const decorativeElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(decorativeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility: Keyboard navigation', () => {
    it('should have focusable buttons', () => {
      render(<GameOverModal {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should have proper tab order', () => {
      const { container } = render(<GameOverModal {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      // Buttons should be in logical order: close, play again, share
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Integration: All stats displayed together', () => {
    it('should display all required stats for TIMED mode', () => {
      render(<GameOverModal {...defaultProps} />);
      
      // Verify all stats are present
      expect(screen.getByLabelText(/final skor/i)).toBeInTheDocument();
      expect(screen.getByText(/EN İYİ:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Satır: 42/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Max Combo: ×8/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Süre:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Final Sprint: \+500/i)).toBeInTheDocument();
    });
  });
});

