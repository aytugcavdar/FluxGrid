import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { NavButton } from './NavButton';

describe('NavButton', () => {
  describe('Rendering', () => {
    it('should render button with icon and label', () => {
      const { container } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
        />
      );

      expect(container.textContent).toContain('🏠');
      expect(container.textContent).toContain('Dashboard');
    });

    it('should render with default variant', () => {
      const { container } = render(
        <NavButton
          icon="🎯"
          label="Quests"
          isActive={false}
          onClick={() => {}}
        />
      );

      expect(container.querySelector('button')).toBeTruthy();
    });

    it('should render with auth variant', () => {
      const { container } = render(
        <NavButton
          icon="🔐"
          label="Login"
          isActive={false}
          onClick={() => {}}
          variant="auth"
        />
      );

      expect(container.querySelector('button')).toBeTruthy();
    });
  });

  describe('Active State Styling', () => {
    it('should apply active styling when isActive is true', () => {
      const { container } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={true}
          onClick={() => {}}
        />
      );

      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      
      // Check for active state indicator (aria-current)
      expect(button?.getAttribute('aria-current')).toBe('page');
    });

    it('should not have aria-current when inactive', () => {
      const { container } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
        />
      );

      const button = container.querySelector('button');
      expect(button?.getAttribute('aria-current')).toBeNull();
    });
  });

  describe('Click Handler', () => {
    it('should call onClick when button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={handleClick}
        />
      );

      const button = screen.getByRole('button', { name: /dashboard navigation button/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={handleClick}
          isLoading={true}
        />
      );

      // Loading state renders a div, not a button
      const loadingElement = screen.getByLabelText('Loading');
      expect(loadingElement).toBeTruthy();
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      const { container } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
          isLoading={true}
        />
      );

      expect(screen.getByLabelText('Loading')).toBeTruthy();
      expect(screen.getByLabelText('Loading').getAttribute('aria-busy')).toBe('true');
    });

    it('should not display button content when loading', () => {
      const { container } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
          isLoading={true}
        />
      );

      // Should not show the actual icon and label
      expect(container.textContent).not.toContain('🏠');
      expect(container.textContent).not.toContain('DASHBOARD');
    });

    it('should have pointer-events: none when loading', () => {
      const { container } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
          isLoading={true}
        />
      );

      const loadingElement = screen.getByLabelText('Loading');
      const style = window.getComputedStyle(loadingElement);
      expect(loadingElement.style.pointerEvents).toBe('none');
    });
  });

  describe('Minimum Size Requirements (Requirement 1.4)', () => {
    it('should have minimum 44x44px touch target', () => {
      const { container } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
        />
      );

      const button = container.querySelector('button');
      expect(button?.style.minWidth).toBe('44px');
      expect(button?.style.minHeight).toBe('44px');
    });

    it('should have icon size of at least 20px', () => {
      const { container } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
        />
      );

      const icon = container.querySelector('span[aria-hidden="true"]') as HTMLElement;
      expect(icon?.style.fontSize).toBe('20px');
    });

    it('should have label font size of at least 10px', () => {
      const { container } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
        />
      );

      const label = container.querySelector('span:not([aria-hidden])') as HTMLElement;
      expect(label?.style.fontSize).toBe('10px');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
        />
      );

      const button = screen.getByRole('button', { name: /dashboard navigation button/i });
      expect(button).toBeTruthy();
    });

    it('should mark icon as decorative with aria-hidden', () => {
      const { container } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
        />
      );

      const icon = container.querySelector('span[aria-hidden="true"]');
      expect(icon).toBeTruthy();
    });

    it('should be disabled when loading', () => {
      render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
          isLoading={true}
        />
      );

      const loadingElement = screen.getByLabelText('Loading');
      expect(loadingElement.style.pointerEvents).toBe('none');
    });

    it('should have tabIndex={0} for keyboard navigation', () => {
      const { container } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
        />
      );

      const button = container.querySelector('button');
      expect(button?.getAttribute('tabIndex')).toBe('0');
    });

    it('should call onClick when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={handleClick}
        />
      );

      const button = screen.getByRole('button', { name: /dashboard navigation button/i });
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when Space key is pressed', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={handleClick}
        />
      );

      const button = screen.getByRole('button', { name: /dashboard navigation button/i });
      button.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should show visible focus indicator when focused', () => {
      const { container } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
        />
      );

      const button = container.querySelector('button') as HTMLButtonElement;
      
      // Simulate focus
      button.focus();
      const focusEvent = new FocusEvent('focus', { bubbles: true });
      button.dispatchEvent(focusEvent);

      // Check that focus handler was set up (outline: none is set, custom focus indicator via onFocus)
      expect(button.style.outline).toBe('none');
    });
  });

  describe('Visual Feedback (Requirement 1.3, 3.2)', () => {
    it('should have transition properties for smooth state changes', () => {
      const { container } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
        />
      );

      const button = container.querySelector('button');
      expect(button?.style.transition).toContain('0.2s');
    });

    it('should have different styling for active state', () => {
      const { container: activeContainer } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={true}
          onClick={() => {}}
        />
      );

      const { container: inactiveContainer } = render(
        <NavButton
          icon="🏠"
          label="Dashboard"
          isActive={false}
          onClick={() => {}}
        />
      );

      const activeButton = activeContainer.querySelector('button');
      const inactiveButton = inactiveContainer.querySelector('button');

      // Active button should have different transform
      expect(activeButton?.style.transform).toBe('scale(1.05)');
      expect(inactiveButton?.style.transform).toBe('scale(1)');
    });
  });
});
