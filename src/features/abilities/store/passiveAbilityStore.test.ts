import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePassiveAbilityStore } from './passiveAbilityStore';
import { PassiveAbilityType } from '../types';
import { LocalStorageService } from '../../../services/local/localStorageService';

// Mock LocalStorageService
vi.mock('../../../services/local/localStorageService', () => ({
  LocalStorageService: {
    loadPassiveAbilities: vi.fn(),
    savePassiveAbilities: vi.fn(),
  },
}));

describe('passiveAbilityStore - initializePassives', () => {
  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    
    // Reset store before each test
    const store = usePassiveAbilityStore.getState();
    
    // Mock empty localStorage
    vi.mocked(LocalStorageService.loadPassiveAbilities).mockReturnValue(null);
    
    store.initializePassives();
  });

  it('should initialize all passive abilities from PASSIVE_DEFINITIONS', () => {
    const { passiveAbilities } = usePassiveAbilityStore.getState();

    // Should have all 5 passive abilities
    expect(passiveAbilities.size).toBe(5);
    expect(passiveAbilities.has(PassiveAbilityType.FLUX_BOOST)).toBe(true);
    expect(passiveAbilities.has(PassiveAbilityType.SCORE_MULTIPLIER)).toBe(true);
    expect(passiveAbilities.has(PassiveAbilityType.LUCKY_PIECES)).toBe(true);
    expect(passiveAbilities.has(PassiveAbilityType.COMBO_MASTER)).toBe(true);
    expect(passiveAbilities.has(PassiveAbilityType.ICE_BREAKER)).toBe(true);
  });

  it('should load abilities from localStorage when available', () => {
    // Mock localStorage with saved data
    vi.mocked(LocalStorageService.loadPassiveAbilities).mockReturnValue({
      unlocked: [PassiveAbilityType.FLUX_BOOST, PassiveAbilityType.SCORE_MULTIPLIER],
      equipped: [PassiveAbilityType.FLUX_BOOST],
      maxLevel: 0,
    });

    const store = usePassiveAbilityStore.getState();
    store.initializePassives();

    const { passiveAbilities } = usePassiveAbilityStore.getState();

    const fluxBoost = passiveAbilities.get(PassiveAbilityType.FLUX_BOOST);
    const scoreMultiplier = passiveAbilities.get(PassiveAbilityType.SCORE_MULTIPLIER);
    const luckyPieces = passiveAbilities.get(PassiveAbilityType.LUCKY_PIECES);

    expect(fluxBoost?.unlocked).toBe(true);
    expect(fluxBoost?.equipped).toBe(true);
    expect(scoreMultiplier?.unlocked).toBe(true);
    expect(scoreMultiplier?.equipped).toBe(false);
    expect(luckyPieces?.unlocked).toBe(false);
  });

  it('should restore equipped slots from localStorage', () => {
    // Mock localStorage with equipped abilities
    vi.mocked(LocalStorageService.loadPassiveAbilities).mockReturnValue({
      unlocked: [PassiveAbilityType.FLUX_BOOST, PassiveAbilityType.SCORE_MULTIPLIER],
      equipped: [PassiveAbilityType.FLUX_BOOST, PassiveAbilityType.SCORE_MULTIPLIER],
      maxLevel: 0,
    });

    const store = usePassiveAbilityStore.getState();
    store.initializePassives();

    const { equippedSlots } = usePassiveAbilityStore.getState();

    expect(equippedSlots[0]).toBe(PassiveAbilityType.FLUX_BOOST);
    expect(equippedSlots[1]).toBe(PassiveAbilityType.SCORE_MULTIPLIER);
    expect(equippedSlots[2]).toBe(null);
  });

  it('should handle empty localStorage', () => {
    // Already mocked as null in beforeEach
    const { passiveAbilities, equippedSlots } = usePassiveAbilityStore.getState();

    // All abilities should be locked
    passiveAbilities.forEach((ability) => {
      expect(ability.unlocked).toBe(false);
      expect(ability.equipped).toBe(false);
    });

    // All slots should be empty
    expect(equippedSlots).toEqual([null, null, null]);
  });

  it('should preserve ability effects from PASSIVE_DEFINITIONS', () => {
    const { passiveAbilities } = usePassiveAbilityStore.getState();

    const fluxBoost = passiveAbilities.get(PassiveAbilityType.FLUX_BOOST);
    const scoreMultiplier = passiveAbilities.get(PassiveAbilityType.SCORE_MULTIPLIER);
    const luckyPieces = passiveAbilities.get(PassiveAbilityType.LUCKY_PIECES);
    const comboMaster = passiveAbilities.get(PassiveAbilityType.COMBO_MASTER);
    const iceBreaker = passiveAbilities.get(PassiveAbilityType.ICE_BREAKER);

    expect(fluxBoost?.effect.multiplier).toBe(1.25);
    expect(scoreMultiplier?.effect.multiplier).toBe(1.5);
    expect(luckyPieces?.effect.probability).toBe(0.4);
    expect(comboMaster?.effect.duration).toBe(3000);
    expect(iceBreaker?.effect.healthModifier).toBe(-1);
  });
});
