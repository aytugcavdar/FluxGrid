import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MiniEventIndicators } from '@features/hud/components/MiniEventIndicators';
import { MiniEventType } from '@features/game/types';

describe('MiniEventIndicators', () => {
  it('should render nothing when no events are active', () => {
    const { container } = render(
      <MiniEventIndicators 
        activeEvents={new Set()} 
        moveCounters={{
          [MiniEventType.FLUX_SURGE]: 0,
          [MiniEventType.SCORE_RUSH]: 0,
          [MiniEventType.CLEAR_BONUS]: 0,
          [MiniEventType.COMBO_SHIELD]: 0,
          [MiniEventType.PIECE_BLESSING]: 0,
        }} 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render Flux Surge indicator when active', () => {
    const activeEvents = new Set([MiniEventType.FLUX_SURGE]);
    const moveCounters = { 
      [MiniEventType.FLUX_SURGE]: 10,
      [MiniEventType.SCORE_RUSH]: 0,
      [MiniEventType.CLEAR_BONUS]: 0,
      [MiniEventType.COMBO_SHIELD]: 0,
      [MiniEventType.PIECE_BLESSING]: 0,
    };
    render(<MiniEventIndicators activeEvents={activeEvents} moveCounters={moveCounters} />);
    
    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.getByText('FLUX SURGE')).toBeInTheDocument();
  });

  it('should render Score Rush indicator when active', () => {
    const activeEvents = new Set([MiniEventType.SCORE_RUSH]);
    const moveCounters = { 
      [MiniEventType.FLUX_SURGE]: 0,
      [MiniEventType.SCORE_RUSH]: 10,
      [MiniEventType.CLEAR_BONUS]: 0,
      [MiniEventType.COMBO_SHIELD]: 0,
      [MiniEventType.PIECE_BLESSING]: 0,
    };
    render(<MiniEventIndicators activeEvents={activeEvents} moveCounters={moveCounters} />);
    
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('SCORE RUSH')).toBeInTheDocument();
  });

  it('should render Clear Bonus indicator when active', () => {
    const activeEvents = new Set([MiniEventType.CLEAR_BONUS]);
    const moveCounters = { 
      [MiniEventType.FLUX_SURGE]: 0,
      [MiniEventType.SCORE_RUSH]: 0,
      [MiniEventType.CLEAR_BONUS]: 1,
      [MiniEventType.COMBO_SHIELD]: 0,
      [MiniEventType.PIECE_BLESSING]: 0,
    };
    render(<MiniEventIndicators activeEvents={activeEvents} moveCounters={moveCounters} />);
    
    expect(screen.getByText('💎')).toBeInTheDocument();
    expect(screen.getByText('CLEAR BONUS')).toBeInTheDocument();
  });

  it('should render multiple indicators when multiple events are active', () => {
    const activeEvents = new Set([
      MiniEventType.FLUX_SURGE,
      MiniEventType.SCORE_RUSH,
      MiniEventType.CLEAR_BONUS,
    ]);
    const moveCounters = {
      [MiniEventType.FLUX_SURGE]: 10,
      [MiniEventType.SCORE_RUSH]: 10,
      [MiniEventType.CLEAR_BONUS]: 1,
      [MiniEventType.COMBO_SHIELD]: 0,
      [MiniEventType.PIECE_BLESSING]: 0,
    };
    render(<MiniEventIndicators activeEvents={activeEvents} moveCounters={moveCounters} />);
    
    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('💎')).toBeInTheDocument();
    expect(screen.getByText('FLUX SURGE')).toBeInTheDocument();
    expect(screen.getByText('SCORE RUSH')).toBeInTheDocument();
    expect(screen.getByText('CLEAR BONUS')).toBeInTheDocument();
  });

  it('should apply correct colors for Flux Surge', () => {
    const activeEvents = new Set([MiniEventType.FLUX_SURGE]);
    const moveCounters = { 
      [MiniEventType.FLUX_SURGE]: 10,
      [MiniEventType.SCORE_RUSH]: 0,
      [MiniEventType.CLEAR_BONUS]: 0,
      [MiniEventType.COMBO_SHIELD]: 0,
      [MiniEventType.PIECE_BLESSING]: 0,
    };
    render(<MiniEventIndicators activeEvents={activeEvents} moveCounters={moveCounters} />);
    
    const label = screen.getByText('FLUX SURGE');
    expect(label).toHaveStyle({ color: '#f59e0b' });
  });

  it('should apply correct colors for Score Rush', () => {
    const activeEvents = new Set([MiniEventType.SCORE_RUSH]);
    const moveCounters = { 
      [MiniEventType.FLUX_SURGE]: 0,
      [MiniEventType.SCORE_RUSH]: 10,
      [MiniEventType.CLEAR_BONUS]: 0,
      [MiniEventType.COMBO_SHIELD]: 0,
      [MiniEventType.PIECE_BLESSING]: 0,
    };
    render(<MiniEventIndicators activeEvents={activeEvents} moveCounters={moveCounters} />);
    
    const label = screen.getByText('SCORE RUSH');
    expect(label).toHaveStyle({ color: '#10b981' });
  });

  it('should apply correct colors for Clear Bonus', () => {
    const activeEvents = new Set([MiniEventType.CLEAR_BONUS]);
    const moveCounters = { 
      [MiniEventType.FLUX_SURGE]: 0,
      [MiniEventType.SCORE_RUSH]: 0,
      [MiniEventType.CLEAR_BONUS]: 1,
      [MiniEventType.COMBO_SHIELD]: 0,
      [MiniEventType.PIECE_BLESSING]: 0,
    };
    render(<MiniEventIndicators activeEvents={activeEvents} moveCounters={moveCounters} />);
    
    const label = screen.getByText('CLEAR BONUS');
    expect(label).toHaveStyle({ color: '#a78bfa' });
  });
});
