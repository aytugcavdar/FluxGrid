import { describe, it, expect, beforeEach } from 'vitest';
import { usePassiveAbilityStore } from './passiveAbilityStore';
import { PassiveAbilityType } from '../types';

describe('passiveAbilityStore - initializeFromFirestore', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = usePassiveAbilityStore.getState();
    store.initializeFromFirestore([], [], 0);
  });

  it('should initialize all passive abilities from PASSIVE_DEFINITIONS', () => {
    const store = usePassiveAbilityStore.getState();
    store.initializeFromFirestore([], [], 0);

    const { passiveAbilities } = usePassiveAbilityStore.getState();

    // Should have all 5 passive abilities
    expect(passiveAbilities.size).toBe(5);
    expect(passiveAbilities.has(PassiveAbilityType.FLUX_BOOST)).toBe(true);
    expect(passiveAbilities.has(PassiveAbilityType.SCORE_MULTIPLIER)).toBe(true);
    expect(passiveAbilities.has(PassiveAbilityType.LUCKY_PIECES)).toBe(true);
    expect(passiveAbilities.has(PassiveAbilityType.COMBO_MASTER)).toBe(true);
    expect(passiveAbilities.has(PassiveAbilityType.ICE_BREAKER)).toBe(true);
  });

  it('should unlock abilities based on maxLevel', () => {
    const store = usePassiveAbilityStore.getState();
    // maxLevel 10 should unlock FLUX_BOOST (level 3) and SCORE_MULTIPLIER (level 8)
    store.initializeFromFirestore([], [], 10);

    const { passiveAbilities } = usePassiveAbilityStore.getState();

    const fluxBoost = passiveAbilities.get(PassiveAbilityType.FLUX_BOOST);
    const scoreMultiplier = passiveAbilities.get(PassiveAbilityType.SCORE_MULTIPLIER);
    const luckyPieces = passiveAbilities.get(PassiveAbilityType.LUCKY_PIECES);

    expect(fluxBoost?.unlocked).toBe(true);
    expect(scoreMultiplier?.unlocked).toBe(true);
    expect(luckyPieces?.unlocked).toBe(false); // Requires level 15
  });

  it('should unlock abilities from unlocks array', () => {
    const store = usePassiveAbilityStore.getState();
    // Explicitly unlock LUCKY_PIECES even though maxLevel is 0
    store.initializeFromFirestore([PassiveAbilityType.LUCKY_PIECES], [], 0);

    const { passiveAbilities } = usePassiveAbilityStore.getState();

    const luckyPieces = passiveAbilities.get(PassiveAbilityType.LUCKY_PIECES);
    expect(luckyPieces?.unlocked).toBe(true);
  });

  it('should mark abilities as equipped from equipped array', () => {
    const store = usePassiveAbilityStore.getState();
    store.initializeFromFirestore(
      [PassiveAbilityType.FLUX_BOOST, PassiveAbilityType.SCORE_MULTIPLIER],
      [PassiveAbilityType.FLUX_BOOST],
      10
    );

    const { passiveAbilities } = usePassiveAbilityStore.getState();

    const fluxBoost = passiveAbilities.get(PassiveAbilityType.FLUX_BOOST);
    const scoreMultiplier = passiveAbilities.get(PassiveAbilityType.SCORE_MULTIPLIER);

    expect(fluxBoost?.equipped).toBe(true);
    expect(scoreMultiplier?.equipped).toBe(false);
  });

  it('should restore equipped slots from Firestore data', () => {
    const store = usePassiveAbilityStore.getState();
    const equipped = [
      PassiveAbilityType.FLUX_BOOST,
      PassiveAbilityType.SCORE_MULTIPLIER,
    ];
    store.initializeFromFirestore(equipped, equipped, 10);

    const { equippedSlots } = usePassiveAbilityStore.getState();

    expect(equippedSlots[0]).toBe(PassiveAbilityType.FLUX_BOOST);
    expect(equippedSlots[1]).toBe(PassiveAbilityType.SCORE_MULTIPLIER);
    expect(equippedSlots[2]).toBe(null);
  });

  it('should handle empty Firestore data', () => {
    const store = usePassiveAbilityStore.getState();
    store.initializeFromFirestore([], [], 0);

    const { passiveAbilities, equippedSlots } = usePassiveAbilityStore.getState();

    // All abilities should be locked
    passiveAbilities.forEach((ability) => {
      expect(ability.unlocked).toBe(false);
      expect(ability.equipped).toBe(false);
    });

    // All slots should be empty
    expect(equippedSlots).toEqual([null, null, null]);
  });

  it('should handle maxLevel unlocking multiple abilities', () => {
    const store = usePassiveAbilityStore.getState();
    // maxLevel 30 should unlock all abilities up to level 25
    store.initializeFromFirestore([], [], 30);

    const { passiveAbilities } = usePassiveAbilityStore.getState();

    expect(passiveAbilities.get(PassiveAbilityType.FLUX_BOOST)?.unlocked).toBe(true);
    expect(passiveAbilities.get(PassiveAbilityType.SCORE_MULTIPLIER)?.unlocked).toBe(true);
    expect(passiveAbilities.get(PassiveAbilityType.LUCKY_PIECES)?.unlocked).toBe(true);
    expect(passiveAbilities.get(PassiveAbilityType.COMBO_MASTER)?.unlocked).toBe(true);
    expect(passiveAbilities.get(PassiveAbilityType.ICE_BREAKER)?.unlocked).toBe(false); // Requires level 35
  });

  it('should preserve ability effects from PASSIVE_DEFINITIONS', () => {
    const store = usePassiveAbilityStore.getState();
    store.initializeFromFirestore([], [], 10);

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
