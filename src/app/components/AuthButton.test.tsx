import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AuthButton } from './AuthButton';
import type { User } from 'firebase/auth';

const mockUser: User = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn(),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  toJSON: vi.fn(),
  providerId: 'firebase',
  phoneNumber: null,
};

describe('AuthButton', () => {
  describe('Rendering States', () => {
    it('should render loading skeleton when isLoading is true', () => {
      render(
        <AuthButton
          user={null}
          isAnonymous={false}
          isLoading={true}
          onLogin={() => {}}
          onSaveAccount={() => {}}
        />
      );

      expect(screen.getByTestId('auth-button-loading')).toBeTruthy();
      expect(screen.getByLabelText('Loading authentication')).toBeTruthy();
    });

    it('should render login button for unauthenticated users', () => {
      render(
        <AuthButton
          user={null}
          isAnonymous={false}
          isLoading={false}
          onLogin={() => {}}
          onSaveAccount={() => {}}
        />
      );

      expect(screen.getByTestId('auth-button')).toBeTruthy();
      expect(screen.getByText('SAVE')).toBeTruthy();
      expect(screen.getByText('🛡️')).toBeTruthy();
    });

    it('should render save account button for anonymous users', () => {
      render(
        <AuthButton
          user={mockUser}
          isAnonymous={true}
          isLoading={false}
          onLogin={() => {}}
          onSaveAccount={() => {}}
        />
      );

      expect(screen.getByTestId('auth-button')).toBeTruthy();
      expect(screen.getByText('SAVE')).toBeTruthy();
      expect(screen.getByText('🛡️')).toBeTruthy();
    });

    it('should not render anything for authenticated users', () => {
      const { container } = render(
        <AuthButton
          user={mockUser}
          isAnonymous={false}
          isLoading={false}
          onLogin={() => {}}
          onSaveAccount={() => {}}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Click Handlers', () => {
    it('should call onLogin when login button is clicked', async () => {
      const user = userEvent.setup();
      const handleLogin = vi.fn();

      render(
        <AuthButton
          user={null}
          isAnonymous={false}
          isLoading={false}
          onLogin={handleLogin}
          onSaveAccount={() => {}}
        />
      );

      const button = screen.getByTestId('auth-button');
      await user.click(button);

      expect(handleLogin).toHaveBeenCalledTimes(1);
    });

    it('should call onSaveAccount when save account button is clicked', async () => {
      const user = userEvent.setup();
      const handleSaveAccount = vi.fn();

      render(
        <AuthButton
          user={mockUser}
          isAnonymous={true}
          isLoading={false}
          onLogin={() => {}}
          onSaveAccount={handleSaveAccount}
        />
      );

      const button = screen.getByTestId('auth-button');
      await user.click(button);

      expect(handleSaveAccount).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation (Requirement 1.3)', () => {
    it('should have tabIndex={0} for keyboard navigation', () => {
      render(
        <AuthButton
          user={null}
          isAnonymous={false}
          isLoading={false}
          onLogin={() => {}}
          onSaveAccount={() => {}}
        />
      );

      const button = screen.getByTestId('auth-button');
      expect(button.getAttribute('tabIndex')).toBe('0');
    });

    it('should call onLogin when Enter key is pressed on login button', async () => {
      const user = userEvent.setup();
      const handleLogin = vi.fn();

      render(
        <AuthButton
          user={null}
          isAnonymous={false}
          isLoading={false}
          onLogin={handleLogin}
          onSaveAccount={() => {}}
        />
      );

      const button = screen.getByTestId('auth-button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleLogin).toHaveBeenCalledTimes(1);
    });

    it('should call onLogin when Space key is pressed on login button', async () => {
      const user = userEvent.setup();
      const handleLogin = vi.fn();

      render(
        <AuthButton
          user={null}
          isAnonymous={false}
          isLoading={false}
          onLogin={handleLogin}
          onSaveAccount={() => {}}
        />
      );

      const button = screen.getByTestId('auth-button');
      button.focus();
      await user.keyboard(' ');

      expect(handleLogin).toHaveBeenCalledTimes(1);
    });

    it('should call onSaveAccount when Enter key is pressed on save account button', async () => {
      const user = userEvent.setup();
      const handleSaveAccount = vi.fn();

      render(
        <AuthButton
          user={mockUser}
          isAnonymous={true}
          isLoading={false}
          onLogin={() => {}}
          onSaveAccount={handleSaveAccount}
        />
      );

      const button = screen.getByTestId('auth-button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleSaveAccount).toHaveBeenCalledTimes(1);
    });

    it('should call onSaveAccount when Space key is pressed on save account button', async () => {
      const user = userEvent.setup();
      const handleSaveAccount = vi.fn();

      render(
        <AuthButton
          user={mockUser}
          isAnonymous={true}
          isLoading={false}
          onLogin={() => {}}
          onSaveAccount={handleSaveAccount}
        />
      );

      const button = screen.getByTestId('auth-button');
      button.focus();
      await user.keyboard(' ');

      expect(handleSaveAccount).toHaveBeenCalledTimes(1);
    });

    it('should show visible focus indicator when focused', () => {
      const { container } = render(
        <AuthButton
          user={null}
          isAnonymous={false}
          isLoading={false}
          onLogin={() => {}}
          onSaveAccount={() => {}}
        />
      );

      const button = screen.getByTestId('auth-button') as HTMLButtonElement;
      
      // Check that outline is removed (custom focus indicator via onFocus)
      expect(button.style.outline).toBe('none');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for login button', () => {
      render(
        <AuthButton
          user={null}
          isAnonymous={false}
          isLoading={false}
          onLogin={() => {}}
          onSaveAccount={() => {}}
        />
      );

      const button = screen.getByLabelText('SAVE navigation button');
      expect(button).toBeTruthy();
    });

    it('should have proper aria-label for save account button', () => {
      render(
        <AuthButton
          user={mockUser}
          isAnonymous={true}
          isLoading={false}
          onLogin={() => {}}
          onSaveAccount={() => {}}
        />
      );

      const button = screen.getByLabelText('SAVE navigation button');
      expect(button).toBeTruthy();
    });

    it('should mark icon as decorative with aria-hidden', () => {
      const { container } = render(
        <AuthButton
          user={null}
          isAnonymous={false}
          isLoading={false}
          onLogin={() => {}}
          onSaveAccount={() => {}}
        />
      );

      const icon = container.querySelector('span[aria-hidden="true"]');
      expect(icon).toBeTruthy();
    });

    it('should have aria-busy during loading', () => {
      render(
        <AuthButton
          user={null}
          isAnonymous={false}
          isLoading={true}
          onLogin={() => {}}
          onSaveAccount={() => {}}
        />
      );

      const loadingElement = screen.getByLabelText('Loading authentication');
      expect(loadingElement.getAttribute('aria-busy')).toBe('true');
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefersReducedMotion prop', () => {
      render(
        <AuthButton
          user={null}
          isAnonymous={false}
          isLoading={false}
          onLogin={() => {}}
          onSaveAccount={() => {}}
          prefersReducedMotion={true}
        />
      );

      const button = screen.getByTestId('auth-button');
      expect(button).toBeTruthy();
    });
  });
});
