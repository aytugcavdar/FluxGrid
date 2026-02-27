import { create } from 'zustand';
import { PassiveAbilityType, PassiveAbility, PassiveAbilityState, PassiveEffect } from '../types';

interface PassiveAbilityStore extends PassiveAbilityState {
  // Actions
  initializePassives: () => void;
  equipPassive: (type: PassiveAbilityType) => boolean;
  unequipPassive: (type: PassiveAbilityType) => void;
  unlockPassive: (type: PassiveAbilityType) => void;
  isPassiveEquipped: (type: PassiveAbilityType) => boolean;
  getEquippedPassives: () => PassiveAbility[];
  
  // Effect Calculators
  calculateFluxMultiplier: () => number;
  calculateScoreMultiplier: () => number;
  shouldUseLuckyPieces: () => boolean;
  getComboTimerBonus: () => number;
  getIceHealthModifier: () => number;
}

export const usePassiveAbilityStore = create<PassiveAbilityStore>((set, get) => ({
  passiveAbilities: new Map<PassiveAbilityType, PassiveAbility>(),
  equippedSlots: [null, null, null],
  maxEquipped: 3,

  initializePassives: () => {
    const passives = new Map<PassiveAbilityType, PassiveAbility>();
    
    // Flux Boost: +25% flux generation
    passives.set(PassiveAbilityType.FLUX_BOOST, {
      type: PassiveAbilityType.FLUX_BOOST,
      unlocked: false,
      equipped: false,
      effect: { multiplier: 1.25 }
    });
    
    // Score Multiplier: 1.5x score
    passives.set(PassiveAbilityType.SCORE_MULTIPLIER, {
      type: PassiveAbilityType.SCORE_MULTIPLIER,
      unlocked: false,
      equipped: false,
      effect: { multiplier: 1.5 }
    });
    
    // Lucky Pieces: +20% favorable shapes
    passives.set(PassiveAbilityType.LUCKY_PIECES, {
      type: PassiveAbilityType.LUCKY_PIECES,
      unlocked: false,
      equipped: false,
      effect: { probability: 0.4 } // 40% chance (20% increase from base 20%)
    });
    
    // Combo Master: +3s combo duration
    passives.set(PassiveAbilityType.COMBO_MASTER, {
      type: PassiveAbilityType.COMBO_MASTER,
      unlocked: false,
      equipped: false,
      effect: { duration: 3000 } // 3 seconds in milliseconds
    });
    
    // Ice Breaker: Ice health 2→1
    passives.set(PassiveAbilityType.ICE_BREAKER, {
      type: PassiveAbilityType.ICE_BREAKER,
      unlocked: false,
      equipped: false,
      effect: { healthModifier: -1 }
    });
    
    set({ passiveAbilities: passives });
  },

  equipPassive: (type: PassiveAbilityType) => {
    const { passiveAbilities, equippedSlots, maxEquipped } = get();
    const passive = passiveAbilities.get(type);
    
    if (!passive || !passive.unlocked || passive.equipped) {
      return false;
    }
    
    // Find empty slot
    const emptySlotIndex = equippedSlots.findIndex(slot => slot === null);
    if (emptySlotIndex === -1) {
      return false; // All slots full
    }
    
    // Equip passive
    const newSlots: [PassiveAbilityType | null, PassiveAbilityType | null, PassiveAbilityType | null] = [...equippedSlots] as any;
    newSlots[emptySlotIndex] = type;
    
    const newPassives = new Map(passiveAbilities);
    const updatedPassive = { ...passive, equipped: true };
    newPassives.set(type, updatedPassive);
    
    set({ 
      equippedSlots: newSlots,
      passiveAbilities: newPassives
    });
    
    return true;
  },

  unequipPassive: (type: PassiveAbilityType) => {
    const { passiveAbilities, equippedSlots } = get();
    const passive = passiveAbilities.get(type);
    
    if (!passive || !passive.equipped) {
      return;
    }
    
    // Remove from slot
    const newSlots: [PassiveAbilityType | null, PassiveAbilityType | null, PassiveAbilityType | null] = [...equippedSlots] as any;
    const slotIndex = newSlots.findIndex(slot => slot === type);
    if (slotIndex !== -1) {
      newSlots[slotIndex] = null;
    }
    
    const newPassives = new Map(passiveAbilities);
    const updatedPassive = { ...passive, equipped: false };
    newPassives.set(type, updatedPassive);
    
    set({ 
      equippedSlots: newSlots,
      passiveAbilities: newPassives
    });
  },

  unlockPassive: (type: PassiveAbilityType) => {
    const { passiveAbilities } = get();
    const passive = passiveAbilities.get(type);
    
    if (!passive) return;
    
    const newPassives = new Map(passiveAbilities);
    const updatedPassive = { ...passive, unlocked: true };
    newPassives.set(type, updatedPassive);
    
    set({ passiveAbilities: newPassives });
  },

  isPassiveEquipped: (type: PassiveAbilityType) => {
    const passive = get().passiveAbilities.get(type);
    return passive?.equipped || false;
  },

  getEquippedPassives: () => {
    const { passiveAbilities, equippedSlots } = get();
    return equippedSlots
      .filter(slot => slot !== null)
      .map(type => passiveAbilities.get(type!))
      .filter(p => p !== undefined) as PassiveAbility[];
  },

  calculateFluxMultiplier: () => {
    const equipped = get().getEquippedPassives();
    const fluxBoost = equipped.find(p => p.type === PassiveAbilityType.FLUX_BOOST);
    return fluxBoost?.effect.multiplier || 1.0;
  },

  calculateScoreMultiplier: () => {
    const equipped = get().getEquippedPassives();
    const scoreBoost = equipped.find(p => p.type === PassiveAbilityType.SCORE_MULTIPLIER);
    return scoreBoost?.effect.multiplier || 1.0;
  },

  shouldUseLuckyPieces: () => {
    const equipped = get().getEquippedPassives();
    return equipped.some(p => p.type === PassiveAbilityType.LUCKY_PIECES);
  },

  getComboTimerBonus: () => {
    const equipped = get().getEquippedPassives();
    const comboMaster = equipped.find(p => p.type === PassiveAbilityType.COMBO_MASTER);
    return comboMaster?.effect.duration || 0;
  },

  getIceHealthModifier: () => {
    const equipped = get().getEquippedPassives();
    const iceBreaker = equipped.find(p => p.type === PassiveAbilityType.ICE_BREAKER);
    return iceBreaker?.effect.healthModifier || 0;
  }
}));
