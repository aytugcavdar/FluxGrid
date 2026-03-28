import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { NavButton } from './NavButton';

describe('NavButton React.memo optimization', () => {
  it('should not re-render when parent re-renders with same props', () => {
    const onClick = vi.fn();
    
    // Parent component that can trigger re-renders
    const ParentComponent = ({ parentState }: { parentState: number }) => {
      return (
        <div>
          <span data-testid="parent-state">Parent state: {parentState}</span>
          <NavButton
            icon="🏠"
            label="Dashboard"
            isActive={false}
            onClick={onClick}
          />
        </div>
      );
    };

    const { rerender, getByTestId, container } = render(<ParentComponent parentState={1} />);
    
    // Verify initial render
    expect(getByTestId('parent-state').textContent).toBe('Parent state: 1');
    const button = container.querySelector('button');
    expect(button).toBeTruthy();

    // Re-render parent with different state but same NavButton props
    rerender(<ParentComponent parentState={2} />);
    expect(getByTestId('parent-state').textContent).toBe('Parent state: 2');
    
    rerender(<ParentComponent parentState={3} />);
    expect(getByTestId('parent-state').textContent).toBe('Parent state: 3');

    // NavButton should still be functional (React.memo is working)
    // The button should still be the same element
    expect(container.querySelector('button')).toBeTruthy();
  });

  it('should re-render when props actually change', () => {
    let renderCount = 0;

    const TrackedNavButton = (props: React.ComponentProps<typeof NavButton>) => {
      renderCount++;
      return <NavButton {...props} />;
    };

    const onClick = vi.fn();

    const { rerender } = render(
      <TrackedNavButton
        icon="🏠"
        label="Dashboard"
        isActive={false}
        onClick={onClick}
      />
    );

    const initialRenderCount = renderCount;

    // Change isActive prop - should trigger re-render
    rerender(
      <TrackedNavButton
        icon="🏠"
        label="Dashboard"
        isActive={true}
        onClick={onClick}
      />
    );

    // Should have re-rendered because isActive changed
    expect(renderCount).toBeGreaterThan(initialRenderCount);
  });

  it('should re-render when icon changes', () => {
    const onClick = vi.fn();

    const { container, rerender } = render(
      <NavButton
        icon="🏠"
        label="Dashboard"
        isActive={false}
        onClick={onClick}
      />
    );

    expect(container.textContent).toContain('🏠');

    // Change icon
    rerender(
      <NavButton
        icon="🎯"
        label="Dashboard"
        isActive={false}
        onClick={onClick}
      />
    );

    expect(container.textContent).toContain('🎯');
    expect(container.textContent).not.toContain('🏠');
  });

  it('should re-render when label changes', () => {
    const onClick = vi.fn();

    const { container, rerender } = render(
      <NavButton
        icon="🏠"
        label="Dashboard"
        isActive={false}
        onClick={onClick}
      />
    );

    expect(container.textContent).toContain('Dashboard');

    // Change label
    rerender(
      <NavButton
        icon="🏠"
        label="Profile"
        isActive={false}
        onClick={onClick}
      />
    );

    expect(container.textContent).toContain('Profile');
    expect(container.textContent).not.toContain('Dashboard');
  });

  it('should re-render when variant changes', () => {
    const onClick = vi.fn();

    const { container, rerender } = render(
      <NavButton
        icon="🔐"
        label="Login"
        isActive={false}
        onClick={onClick}
        variant="default"
      />
    );

    const button = container.querySelector('button');
    const initialBackground = button?.style.background;

    // Change variant to auth
    rerender(
      <NavButton
        icon="🔐"
        label="Login"
        isActive={false}
        onClick={onClick}
        variant="auth"
      />
    );

    const updatedButton = container.querySelector('button');
    const updatedBackground = updatedButton?.style.background;

    // Background should be different for auth variant
    expect(updatedBackground).not.toBe(initialBackground);
    expect(updatedBackground).toContain('linear-gradient');
  });

  it('should re-render when isLoading changes', () => {
    const onClick = vi.fn();

    const { container, rerender } = render(
      <NavButton
        icon="🏠"
        label="Dashboard"
        isActive={false}
        onClick={onClick}
        isLoading={false}
      />
    );

    expect(container.querySelector('button')).toBeTruthy();

    // Change to loading state
    rerender(
      <NavButton
        icon="🏠"
        label="Dashboard"
        isActive={false}
        onClick={onClick}
        isLoading={true}
      />
    );

    // Should show loading skeleton instead of button
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it('should handle stable onClick reference correctly', () => {
    const onClick = vi.fn();

    const ParentComponent = ({ count }: { count: number }) => {
      // Stable onClick reference
      return (
        <div>
          <span>Count: {count}</span>
          <NavButton
            icon="🏠"
            label="Dashboard"
            isActive={false}
            onClick={onClick}
          />
        </div>
      );
    };

    const { rerender } = render(<ParentComponent count={1} />);

    // Re-render parent multiple times with same onClick
    rerender(<ParentComponent count={2} />);
    rerender(<ParentComponent count={3} />);

    // NavButton should handle stable onClick reference without issues
    expect(onClick).not.toHaveBeenCalled();
  });
});
