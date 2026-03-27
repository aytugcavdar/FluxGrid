import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MiniEventIndicators } from '@features/hud/components/MiniEventIndicators';
import { MiniEventType } from '@features/game/types';

describe('MiniEventIndicators', () => {
  it('should render nothing when no events are active', () => {
    const { container } = render(
      <MiniEventIndicators activeEvents={new Set()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render Flux Surge indicator when active', () => {
    const activeEvents = new Set([MiniEventType.FLUX_SURGE]);
    render(<MiniEventIndicators activeEvents={activeEvents} />);
    
    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.getByText('Flux Surge')).toBeInTheDocument();
  });

  it('should render Score Rush indicator when active', () => {
    const activeEvents = new Set([MiniEventType.SCORE_RUSH]);
    render(<MiniEventIndicators activeEvents={activeEvents} />);
    
    expect(screen.getByText('🚀')).toBeInTheDocument();
    expect(screen.getByText('Score Rush')).toBeInTheDocument();
  });

  it('should render Clear Bonus indicator when active', () => {
    const activeEvents = new Set([MiniEventType.CLEAR_BONUS]);
    render(<MiniEventIndicators activeEvents={activeEvents} />);
    
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('Clear Bonus')).toBeInTheDocument();
  });

  it('should render multiple indicators when multiple events are active', () => {
    const activeEvents = new Set([
      MiniEventType.FLUX_SURGE,
      MiniEventType.SCORE_RUSH,
      MiniEventType.CLEAR_BONUS,
    ]);
    render(<MiniEventIndicators activeEvents={activeEvents} />);
    
    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.getByText('🚀')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('Flux Surge')).toBeInTheDocument();
    expect(screen.getByText('Score Rush')).toBeInTheDocument();
    expect(screen.getByText('Clear Bonus')).toBeInTheDocument();
  });

  it('should render only icons in mobile mode', () => {
    const activeEvents = new Set([MiniEventType.FLUX_SURGE]);
    render(<MiniEventIndicators activeEvents={activeEvents} isMobile={true} />);
    
    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.queryByText('Flux Surge')).not.toBeInTheDocument();
  });

  it('should render icons and labels in desktop mode', () => {
    const activeEvents = new Set([MiniEventType.FLUX_SURGE]);
    render(<MiniEventIndicators activeEvents={activeEvents} isMobile={false} />);
    
    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.getByText('Flux Surge')).toBeInTheDocument();
  });

  it('should apply correct colors for Flux Surge', () => {
    const activeEvents = new Set([MiniEventType.FLUX_SURGE]);
    render(<MiniEventIndicators activeEvents={activeEvents} />);
    
    const label = screen.getByText('Flux Surge');
    expect(label).toHaveStyle({ color: '#f59e0b' });
  });

  it('should apply correct colors for Score Rush', () => {
    const activeEvents = new Set([MiniEventType.SCORE_RUSH]);
    render(<MiniEventIndicators activeEvents={activeEvents} />);
    
    const label = screen.getByText('Score Rush');
    expect(label).toHaveStyle({ color: '#3b82f6' });
  });

  it('should apply correct colors for Clear Bonus', () => {
    const activeEvents = new Set([MiniEventType.CLEAR_BONUS]);
    render(<MiniEventIndicators activeEvents={activeEvents} />);
    
    const label = screen.getByText('Clear Bonus');
    expect(label).toHaveStyle({ color: '#10b981' });
  });
});
