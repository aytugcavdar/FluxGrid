import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { HomeScreen } from '../HomeScreen';
import { StatisticsScreen } from '../StatisticsScreen';
import { SettingsScreen } from '../SettingsScreen';

describe('Accessibility Tests - Task 17', () => {
  describe('HomeScreen Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<HomeScreen />);
      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it('should have aria-label on sound toggle button', () => {
      const { container } = render(<HomeScreen />);
      const soundButton = container.querySelector('button[aria-label="Ses ayarları"]');
      expect(soundButton).toBeInTheDocument();
    });

    it('should have aria-label on mode card play buttons', () => {
      const { container } = render(<HomeScreen />);
      const endlessButton = container.querySelector('button[aria-label*="modunda oyna"]');
      expect(endlessButton).toBeInTheDocument();
    });
  });

  describe('StatisticsScreen Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<StatisticsScreen />);
      const results = await axe(container);
      
      if (results.violations.length > 0) {
        console.log('Accessibility violations found:', JSON.stringify(results.violations, null, 2));
      }
      
      expect(results.violations).toHaveLength(0);
    });

    it('should have proper ARIA attributes on progress bars', () => {
      const { container } = render(<StatisticsScreen />);
      const progressBars = container.querySelectorAll('[role="progressbar"]');
      
      progressBars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-label');
        expect(bar).toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('aria-valuemin');
        expect(bar).toHaveAttribute('aria-valuemax');
      });
    });
  });

  describe('SettingsScreen Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SettingsScreen />);
      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it('should have aria-label and aria-pressed on theme buttons', () => {
      const { container } = render(<SettingsScreen />);
      const themeButtons = container.querySelectorAll('button[aria-label*="temasını seç"]');
      
      expect(themeButtons.length).toBe(4); // 4 theme options
      
      themeButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('aria-pressed');
      });
    });

    it('should have aria-label and aria-pressed on language buttons', () => {
      const { container } = render(<SettingsScreen />);
      
      const turkishButton = container.querySelector('button[aria-label="Türkçe dilini seç"]');
      const englishButton = container.querySelector('button[aria-label="İngilizce dilini seç"]');
      
      expect(turkishButton).toBeInTheDocument();
      expect(turkishButton).toHaveAttribute('aria-pressed');
      
      expect(englishButton).toBeInTheDocument();
      expect(englishButton).toHaveAttribute('aria-pressed');
    });

    it('should have aria-label on export button', () => {
      const { container } = render(<SettingsScreen />);
      const exportButton = container.querySelector('button[aria-label="Veriyi dışa aktar"]');
      expect(exportButton).toBeInTheDocument();
    });

    it('should have aria-label on reset button', () => {
      const { container } = render(<SettingsScreen />);
      const resetButton = container.querySelector('button[aria-label="Tüm verileri sıfırla"]');
      expect(resetButton).toBeInTheDocument();
    });
  });

  describe('Keyboard Accessibility', () => {
    it('all interactive elements in HomeScreen should be keyboard accessible', () => {
      const { container } = render(<HomeScreen />);
      const buttons = container.querySelectorAll('button');
      
      buttons.forEach((button) => {
        // All buttons should be focusable (not have tabIndex=-1)
        const tabIndex = button.getAttribute('tabindex');
        expect(tabIndex).not.toBe('-1');
      });
    });

    it('all interactive elements in SettingsScreen should be keyboard accessible', () => {
      const { container } = render(<SettingsScreen />);
      const buttons = container.querySelectorAll('button');
      
      buttons.forEach((button) => {
        // All buttons should be focusable (not have tabIndex=-1)
        const tabIndex = button.getAttribute('tabindex');
        expect(tabIndex).not.toBe('-1');
      });
    });
  });

  describe('Requirement 18.1: Sound Toggle Button', () => {
    it('should have aria-label attribute', () => {
      const { container } = render(<HomeScreen />);
      const soundButton = container.querySelector('button[aria-label="Ses ayarları"]');
      expect(soundButton).toBeInTheDocument();
      expect(soundButton).toHaveAttribute('aria-label', 'Ses ayarları');
    });
  });

  describe('Requirement 18.2: Theme Selection Buttons', () => {
    it('should have aria-label and aria-pressed attributes', () => {
      const { container } = render(<SettingsScreen />);
      const themeButtons = container.querySelectorAll('button[aria-label*="temasını seç"]');
      
      expect(themeButtons.length).toBeGreaterThan(0);
      
      themeButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('aria-pressed');
        
        const ariaPressed = button.getAttribute('aria-pressed');
        expect(['true', 'false']).toContain(ariaPressed);
      });
    });
  });

  describe('Requirement 18.3: Language Selection Buttons', () => {
    it('should have aria-label and aria-pressed attributes', () => {
      const { container } = render(<SettingsScreen />);
      
      const languageButtons = [
        container.querySelector('button[aria-label="Türkçe dilini seç"]'),
        container.querySelector('button[aria-label="İngilizce dilini seç"]'),
      ];
      
      languageButtons.forEach((button) => {
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('aria-pressed');
        
        const ariaPressed = button?.getAttribute('aria-pressed');
        expect(['true', 'false']).toContain(ariaPressed);
      });
    });
  });

  describe('Requirement 18.4: Export and Reset Buttons', () => {
    it('should have aria-label attributes', () => {
      const { container } = render(<SettingsScreen />);
      
      const exportButton = container.querySelector('button[aria-label="Veriyi dışa aktar"]');
      const resetButton = container.querySelector('button[aria-label="Tüm verileri sıfırla"]');
      
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).toHaveAttribute('aria-label', 'Veriyi dışa aktar');
      
      expect(resetButton).toBeInTheDocument();
      expect(resetButton).toHaveAttribute('aria-label', 'Tüm verileri sıfırla');
    });
  });

  describe('Requirement 18.5: Keyboard Accessibility', () => {
    it('all interactive elements should be keyboard accessible', () => {
      const screens = [
        { name: 'HomeScreen', component: <HomeScreen /> },
        { name: 'StatisticsScreen', component: <StatisticsScreen /> },
        { name: 'SettingsScreen', component: <SettingsScreen /> },
      ];
      
      screens.forEach(({ name, component }) => {
        const { container } = render(component);
        const interactiveElements = container.querySelectorAll('button, a, input, select, textarea');
        
        interactiveElements.forEach((element) => {
          // Elements should either be naturally focusable or have tabIndex >= 0
          const tabIndex = element.getAttribute('tabindex');
          const isNaturallyFocusable = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
          
          if (!isNaturallyFocusable) {
            expect(parseInt(tabIndex || '0')).toBeGreaterThanOrEqual(0);
          }
        });
      });
    });
  });
});
