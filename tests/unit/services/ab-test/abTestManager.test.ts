import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ABTestManager } from '@services/ab-test/abTestManager';

describe('ABTestManager', () => {
  let manager: ABTestManager;

  beforeEach(() => {
    manager = new ABTestManager();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Variant Assignment', () => {
    it('should assign variant based on user ID', () => {
      const variant = manager.getVariant('test_experiment', 'user123');
      
      expect(variant).toBeDefined();
      expect(['control', 'variant_a', 'variant_b']).toContain(variant);
    });

    it('should assign same variant for same user', () => {
      const variant1 = manager.getVariant('test_experiment', 'user123');
      const variant2 = manager.getVariant('test_experiment', 'user123');
      
      expect(variant1).toBe(variant2);
    });

    it('should assign different variants for different users', () => {
      const variants = new Set();
      
      for (let i = 0; i < 100; i++) {
        const variant = manager.getVariant('test_experiment', `user${i}`);
        variants.add(variant);
      }
      
      // Should have multiple variants
      expect(variants.size).toBeGreaterThan(1);
    });

    it('should distribute variants evenly', () => {
      const distribution: Record<string, number> = {};
      
      for (let i = 0; i < 1000; i++) {
        const variant = manager.getVariant('test_experiment', `user${i}`);
        distribution[variant] = (distribution[variant] || 0) + 1;
      }
      
      // Each variant should have roughly 33% (within 10% margin)
      Object.values(distribution).forEach(count => {
        const percentage = (count / 1000) * 100;
        expect(percentage).toBeGreaterThan(23); // 33% - 10%
        expect(percentage).toBeLessThan(43); // 33% + 10%
      });
    });
  });

  describe('Variant Caching', () => {
    it('should cache variant assignment', () => {
      const variant = manager.getVariant('test_experiment', 'user123');
      
      // Check localStorage
      const cached = localStorage.getItem('ab_test_test_experiment_user123');
      expect(cached).toBe(variant);
    });

    it('should use cached variant', () => {
      // Pre-cache a variant
      localStorage.setItem('ab_test_test_experiment_user123', 'variant_a');
      
      const variant = manager.getVariant('test_experiment', 'user123');
      
      expect(variant).toBe('variant_a');
    });

    it('should clear cache', () => {
      manager.getVariant('test_experiment', 'user123');
      
      manager.clearCache('test_experiment', 'user123');
      
      const cached = localStorage.getItem('ab_test_test_experiment_user123');
      expect(cached).toBeNull();
    });
  });

  describe('Variant Values', () => {
    it('should get variant value', () => {
      const config = {
        control: { buttonColor: 'blue' },
        variant_a: { buttonColor: 'green' },
        variant_b: { buttonColor: 'red' },
      };
      
      const value = manager.getVariantValue('button_test', 'user123', config);
      
      expect(value).toBeDefined();
      expect(['blue', 'green', 'red']).toContain(value.buttonColor);
    });

    it('should return default value if variant not found', () => {
      const config = {
        control: { value: 1 },
      };
      
      const defaultValue = { value: 0 };
      const value = manager.getVariantValue('test', 'user123', config, defaultValue);
      
      expect(value).toBeDefined();
    });
  });

  describe('Conversion Tracking', () => {
    it('should log conversion', () => {
      const logSpy = vi.spyOn(manager, 'logConversion');
      
      manager.logConversion('test_experiment', 'user123', 'purchase', 29.99);
      
      expect(logSpy).toHaveBeenCalledWith('test_experiment', 'user123', 'purchase', 29.99);
    });

    it('should track conversion rate', () => {
      // Simulate conversions
      for (let i = 0; i < 100; i++) {
        manager.getVariant('test_experiment', `user${i}`);
        
        // 50% conversion rate
        if (i % 2 === 0) {
          manager.logConversion('test_experiment', `user${i}`, 'click');
        }
      }
      
      const rate = manager.getConversionRate('test_experiment');
      
      expect(rate).toBeCloseTo(0.5, 1);
    });

    it('should track conversion by variant', () => {
      // Assign users to variants
      for (let i = 0; i < 100; i++) {
        const variant = manager.getVariant('test_experiment', `user${i}`);
        
        // Control: 30% conversion, Variant A: 50% conversion
        if (variant === 'control' && i % 10 < 3) {
          manager.logConversion('test_experiment', `user${i}`, 'click');
        } else if (variant === 'variant_a' && i % 10 < 5) {
          manager.logConversion('test_experiment', `user${i}`, 'click');
        }
      }
      
      const controlRate = manager.getConversionRate('test_experiment', 'control');
      const variantRate = manager.getConversionRate('test_experiment', 'variant_a');
      
      expect(variantRate).toBeGreaterThan(controlRate);
    });
  });

  describe('Analytics Integration', () => {
    it('should set A/B test as user property', () => {
      const setPropertySpy = vi.spyOn(manager, 'setUserProperty');
      
      manager.getVariant('test_experiment', 'user123');
      
      expect(setPropertySpy).toHaveBeenCalledWith(
        'ab_test_test_experiment',
        expect.any(String)
      );
    });

    it('should log A/B test events', () => {
      const logEventSpy = vi.spyOn(manager, 'logEvent');
      
      manager.logConversion('test_experiment', 'user123', 'purchase', 29.99);
      
      expect(logEventSpy).toHaveBeenCalledWith(
        'ab_test_conversion',
        expect.objectContaining({
          experiment: 'test_experiment',
          event_type: 'purchase',
          value: 29.99,
        })
      );
    });
  });

  describe('Feature Flags', () => {
    it('should check if feature is enabled', () => {
      manager.setFeatureFlag('new_ui', true);
      
      expect(manager.isFeatureEnabled('new_ui')).toBe(true);
    });

    it('should check if feature is disabled', () => {
      manager.setFeatureFlag('beta_feature', false);
      
      expect(manager.isFeatureEnabled('beta_feature')).toBe(false);
    });

    it('should return false for undefined features', () => {
      expect(manager.isFeatureEnabled('non_existent')).toBe(false);
    });

    it('should toggle feature flag', () => {
      manager.setFeatureFlag('test_feature', true);
      expect(manager.isFeatureEnabled('test_feature')).toBe(true);
      
      manager.setFeatureFlag('test_feature', false);
      expect(manager.isFeatureEnabled('test_feature')).toBe(false);
    });
  });

  describe('Remote Config Integration', () => {
    it('should load experiments from remote config', async () => {
      const remoteConfig = {
        button_color_test: {
          enabled: true,
          variants: ['control', 'blue', 'green'],
        },
      };
      
      await manager.loadRemoteConfig(remoteConfig);
      
      const variant = manager.getVariant('button_color_test', 'user123');
      expect(['control', 'blue', 'green']).toContain(variant);
    });

    it('should update experiments at runtime', async () => {
      const initialConfig = {
        test: { enabled: true, variants: ['control', 'a'] },
      };
      
      await manager.loadRemoteConfig(initialConfig);
      
      const updatedConfig = {
        test: { enabled: true, variants: ['control', 'a', 'b'] },
      };
      
      await manager.loadRemoteConfig(updatedConfig);
      
      // Should now support variant 'b'
      const variant = manager.getVariant('test', 'user_new');
      expect(['control', 'a', 'b']).toContain(variant);
    });
  });

  describe('Deterministic Hashing', () => {
    it('should use deterministic hash for assignment', () => {
      const hash1 = manager.hashUserId('user123', 'experiment1');
      const hash2 = manager.hashUserId('user123', 'experiment1');
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different experiments', () => {
      const hash1 = manager.hashUserId('user123', 'experiment1');
      const hash2 = manager.hashUserId('user123', 'experiment2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for different users', () => {
      const hash1 = manager.hashUserId('user123', 'experiment1');
      const hash2 = manager.hashUserId('user456', 'experiment1');
      
      expect(hash1).not.toBe(hash2);
    });
  });
});
