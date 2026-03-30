import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SectionHeader } from './SectionHeader';

describe('SectionHeader', () => {
  it('should render with title text', () => {
    const { getByText } = render(<SectionHeader title="TEST SECTION" />);
    expect(getByText('TEST SECTION')).toBeInTheDocument();
  });

  it('should render h2 element with uppercase and tracking-wider', () => {
    const { container } = render(<SectionHeader title="test section" />);
    const h2 = container.querySelector('h2');
    expect(h2).toBeInTheDocument();
    expect(h2).toHaveClass('uppercase', 'tracking-wider');
  });

  it('should render horizontal divider with flex-1', () => {
    const { container } = render(<SectionHeader title="TEST" />);
    const divider = container.querySelector('.flex-1');
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveClass('h-[0.5px]');
  });

  it('should use default divider color when not provided', () => {
    const { container } = render(<SectionHeader title="TEST" />);
    const divider = container.querySelector('.flex-1');
    expect(divider).toHaveStyle({ backgroundColor: 'rgba(255,255,255,0.05)' });
  });

  it('should use custom divider color when provided', () => {
    const customColor = 'rgba(239,68,68,0.15)';
    const { container } = render(<SectionHeader title="TEST" dividerColor={customColor} />);
    const divider = container.querySelector('.flex-1');
    expect(divider).toHaveStyle({ backgroundColor: customColor });
  });

  it('should use Theme_System colors for text', () => {
    const { container } = render(<SectionHeader title="TEST" />);
    const h2 = container.querySelector('h2');
    // Verify that the h2 has a color style applied (from theme)
    const style = window.getComputedStyle(h2!);
    expect(style.color).toBeTruthy();
  });
});
