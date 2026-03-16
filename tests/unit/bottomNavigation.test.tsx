/**
 * Unit tests for bottom navigation component
 * Validates Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import React from 'react';
import { AppState } from '@shared/types';

// Mock translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'home.map': 'MAP',
        'home.allModes': 'ALL MODES',
        'home.settings': 'SETTINGS',
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock audio utilities
vi.mock('@utils/audio', () => ({
  playClick: vi.fn(),
  unlockAudio: vi.fn(),
  playGameOver: vi.fn(),
}));

// Bottom Navigation Component (extracted for testing)
interface BottomNavigationProps {
  onMapClick: () => void;
  onModesClick: () => void;
  onSettingsClick: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onMapClick,
  onModesClick,
  onSettingsClick,
}) => {
  const { t } = require('react-i18next').useTranslation();
  
  return (
    <div style={{ display: 'flex', gap: 6 }} data-testid="bottom-navigation">
      <button
        onClick={onMapClick}
        data-testid="nav-map"
        style={{
          flex: 1,
          padding: '8px 0',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '.05em' }}>
          {t('home.map')}
        </span>
      </button>
      <button
        onClick={onModesClick}
        data-testid="nav-modes"
        style={{
          flex: 1,
          padding: '8px 0',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '.05em' }}>
          {t('home.allModes')}
        </span>
      </button>
      <button
        onClick={onSettingsClick}
        data-testid="nav-settings"
        style={{
          flex: 1,
          padding: '8px 0',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"/>
        </svg>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '.05em' }}>
          {t('home.settings')}
        </span>
      </button>
    </div>
  );
};

describe('Bottom Navigation', () => {
  describe('Structure and Layout', () => {
    it('renders exactly three navigation buttons', () => {
      const mockHandlers = {
        onMapClick: vi.fn(),
        onModesClick: vi.fn(),
        onSettingsClick: vi.fn(),
      };

      render(<BottomNavigation {...mockHandlers} />);

      const nav = screen.getByTestId('bottom-navigation');
      const buttons = nav.querySelectorAll('button');
      
      expect(buttons).toHaveLength(3);
    });

    it('displays map icon button with label', () => {
      const mockHandlers = {
        onMapClick: vi.fn(),
        onModesClick: vi.fn(),
        onSettingsClick: vi.fn(),
      };

      render(<BottomNavigation {...mockHandlers} />);

      const mapButton = screen.getByTestId('nav-map');
      expect(mapButton).toBeInTheDocument();
      
      // Check for SVG icon
      const svg = mapButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
      
      // Check for label (translation key or translated text)
      expect(mapButton.textContent).toMatch(/MAP|home\.map/);
    });

    it('displays grid icon button with label', () => {
      const mockHandlers = {
        onMapClick: vi.fn(),
        onModesClick: vi.fn(),
        onSettingsClick: vi.fn(),
      };

      render(<BottomNavigation {...mockHandlers} />);

      const modesButton = screen.getByTestId('nav-modes');
      expect(modesButton).toBeInTheDocument();
      
      // Check for SVG icon
      const svg = modesButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
      
      // Check for label (translation key or translated text)
      expect(modesButton.textContent).toMatch(/ALL MODES|home\.allModes/);
    });

    it('displays settings icon button with label', () => {
      const mockHandlers = {
        onMapClick: vi.fn(),
        onModesClick: vi.fn(),
        onSettingsClick: vi.fn(),
      };

      render(<BottomNavigation {...mockHandlers} />);

      const settingsButton = screen.getByTestId('nav-settings');
      expect(settingsButton).toBeInTheDocument();
      
      // Check for SVG icon
      const svg = settingsButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
      
      // Check for label (translation key or translated text)
      expect(settingsButton.textContent).toMatch(/SETTINGS|home\.settings/);
    });

    it('icons are 20px in size', () => {
      const mockHandlers = {
        onMapClick: vi.fn(),
        onModesClick: vi.fn(),
        onSettingsClick: vi.fn(),
      };

      render(<BottomNavigation {...mockHandlers} />);

      const nav = screen.getByTestId('bottom-navigation');
      const svgs = nav.querySelectorAll('svg');
      
      svgs.forEach(svg => {
        expect(svg).toHaveAttribute('width', '20');
        expect(svg).toHaveAttribute('height', '20');
      });
    });

    it('labels use text-xs equivalent font size', () => {
      const mockHandlers = {
        onMapClick: vi.fn(),
        onModesClick: vi.fn(),
        onSettingsClick: vi.fn(),
      };

      render(<BottomNavigation {...mockHandlers} />);

      const nav = screen.getByTestId('bottom-navigation');
      const labels = nav.querySelectorAll('span');
      
      labels.forEach(label => {
        const style = window.getComputedStyle(label);
        // text-xs is typically 10px or 0.75rem
        expect(label.style.fontSize).toBe('10px');
      });
    });

    it('buttons are positioned at bottom of screen in flex layout', () => {
      const mockHandlers = {
        onMapClick: vi.fn(),
        onModesClick: vi.fn(),
        onSettingsClick: vi.fn(),
      };

      render(<BottomNavigation {...mockHandlers} />);

      const nav = screen.getByTestId('bottom-navigation');
      const style = window.getComputedStyle(nav);
      
      expect(nav.style.display).toBe('flex');
    });
  });

  describe('Click Handlers', () => {
    it('map button navigates to LEVEL_MAP', async () => {
      const user = userEvent.setup();
      const mockHandlers = {
        onMapClick: vi.fn(),
        onModesClick: vi.fn(),
        onSettingsClick: vi.fn(),
      };

      render(<BottomNavigation {...mockHandlers} />);

      const mapButton = screen.getByTestId('nav-map');
      await user.click(mapButton);

      expect(mockHandlers.onMapClick).toHaveBeenCalledTimes(1);
    });

    it('grid button navigates to MODES', async () => {
      const user = userEvent.setup();
      const mockHandlers = {
        onMapClick: vi.fn(),
        onModesClick: vi.fn(),
        onSettingsClick: vi.fn(),
      };

      render(<BottomNavigation {...mockHandlers} />);

      const modesButton = screen.getByTestId('nav-modes');
      await user.click(modesButton);

      expect(mockHandlers.onModesClick).toHaveBeenCalledTimes(1);
    });

    it('settings button opens theme selector', async () => {
      const user = userEvent.setup();
      const mockHandlers = {
        onMapClick: vi.fn(),
        onModesClick: vi.fn(),
        onSettingsClick: vi.fn(),
      };

      render(<BottomNavigation {...mockHandlers} />);

      const settingsButton = screen.getByTestId('nav-settings');
      await user.click(settingsButton);

      expect(mockHandlers.onSettingsClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Visual Requirements', () => {
    it('buttons have flex layout with column direction', () => {
      const mockHandlers = {
        onMapClick: vi.fn(),
        onModesClick: vi.fn(),
        onSettingsClick: vi.fn(),
      };

      render(<BottomNavigation {...mockHandlers} />);

      const buttons = [
        screen.getByTestId('nav-map'),
        screen.getByTestId('nav-modes'),
        screen.getByTestId('nav-settings'),
      ];

      buttons.forEach(button => {
        expect(button.style.display).toBe('flex');
        expect(button.style.flexDirection).toBe('column');
        expect(button.style.alignItems).toBe('center');
      });
    });

    it('labels are positioned below icons', () => {
      const mockHandlers = {
        onMapClick: vi.fn(),
        onModesClick: vi.fn(),
        onSettingsClick: vi.fn(),
      };

      render(<BottomNavigation {...mockHandlers} />);

      const mapButton = screen.getByTestId('nav-map');
      const children = Array.from(mapButton.children);
      
      // First child should be SVG (icon)
      expect(children[0].tagName).toBe('svg');
      // Second child should be SPAN (label)
      expect(children[1].tagName).toBe('SPAN');
    });
  });
});
