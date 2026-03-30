import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeCard, ModeCardProps } from './ModeCard';
import { GameMode } from '../types';

// Mock the theme store
vi.mock('../store/themeStore', () => ({
  useThemeStore: () => ({
    getThemeColors: () => ({
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255,255,255,0.7)',
      cardBackgroundTransparent: 'rgba(255,255,255,0.05)',
      cardBorderTransparent: 'rgba(255,255,255,0.1)',
    }),
  }),
}));

describe('ModeCard', () => {
  const mockOnPlay = vi.fn();
  
  const endlessProps: ModeCardProps = {
    mode: GameMode.ENDLESS as GameMode.ENDLESS,
    bestScore: 12500,
    icon: '∞',
    accentColor: {
      border: 'rgba(168,85,247,0.3)',
      background: 'rgba(168,85,247,0.07)',
      gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    },
    tags: ['Limit yok', 'Yarışmalı', 'Yetenekler'],
    onPlay: mockOnPlay,
  };
  
  const timedProps: ModeCardProps = {
    mode: GameMode.TIMED as GameMode.TIMED,
    bestScore: 8750,
    icon: '⏱',
    accentColor: {
      border: 'rgba(245,158,11,0.3)',
      background: 'rgba(245,158,11,0.07)',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
    tags: ['60 saniye', 'Sprint', 'Combo rush'],
    onPlay: mockOnPlay,
  };

  it('should render Endless mode card with correct content', () => {
    render(<ModeCard {...endlessProps} />);
    
    expect(screen.getByText('Sonsuz Mod')).toBeInTheDocument();
    expect(screen.getByText('12.500')).toBeInTheDocument();
    expect(screen.getByText('∞')).toBeInTheDocument();
    expect(screen.getByText('OYNA')).toBeInTheDocument();
    expect(screen.getByText('Limit yok')).toBeInTheDocument();
    expect(screen.getByText('Yarışmalı')).toBeInTheDocument();
    expect(screen.getByText('Yetenekler')).toBeInTheDocument();
  });

  it('should render Timed mode card with correct content', () => {
    render(<ModeCard {...timedProps} />);
    
    expect(screen.getByText('Timed Mod')).toBeInTheDocument();
    expect(screen.getByText('8.750')).toBeInTheDocument();
    expect(screen.getByText('⏱')).toBeInTheDocument();
    expect(screen.getByText('OYNA')).toBeInTheDocument();
    expect(screen.getByText('60 saniye')).toBeInTheDocument();
    expect(screen.getByText('Sprint')).toBeInTheDocument();
    expect(screen.getByText('Combo rush')).toBeInTheDocument();
  });

  it('should display icon with 18% opacity', () => {
    const { container } = render(<ModeCard {...endlessProps} />);
    const iconElement = container.querySelector('.text-6xl');
    
    expect(iconElement).toHaveStyle({ opacity: '0.18' });
  });

  it('should display highscore with text-3xl font-bold styling', () => {
    const { container } = render(<ModeCard {...endlessProps} />);
    const scoreElement = screen.getByText('12.500');
    
    expect(scoreElement).toHaveClass('text-3xl', 'font-bold');
  });

  it('should call onPlay when OYNA button is clicked', async () => {
    const user = userEvent.setup();
    render(<ModeCard {...endlessProps} />);
    
    const playButton = screen.getByText('OYNA');
    await user.click(playButton);
    
    expect(mockOnPlay).toHaveBeenCalledTimes(1);
  });

  it('should apply mode-specific accent colors', () => {
    const { container } = render(<ModeCard {...endlessProps} />);
    const card = container.firstChild as HTMLElement;
    
    // Check that the card has the accent color styles applied (browser normalizes rgba with spaces)
    expect(card.style.background).toBe('rgba(168, 85, 247, 0.07)');
    expect(card.style.border).toBe('1.5px solid rgba(168, 85, 247, 0.3)');
  });

  it('should apply gradient to OYNA button', () => {
    render(<ModeCard {...endlessProps} />);
    const playButton = screen.getByText('OYNA');
    
    expect(playButton).toHaveStyle({
      background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    });
  });

  it('should render all tags', () => {
    render(<ModeCard {...endlessProps} />);
    
    endlessProps.tags.forEach(tag => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it('should have proper aria-label on play button', () => {
    render(<ModeCard {...endlessProps} />);
    const playButton = screen.getByLabelText('Sonsuz Mod modunda oyna');
    
    expect(playButton).toBeInTheDocument();
  });
});
