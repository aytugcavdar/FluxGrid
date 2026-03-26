import { create } from 'zustand';
import { PassiveAbilityType, PassiveAbility, PassiveAbilityState } from '../types';
import { syncAbilities } from '../../../services/firebase/syncManager';

interface PassiveAbilityStore extends PassiveAbilityState {
  // Actions
  initializePassives: () => void;
  initializeFromFirestore: (unlocks: string[], equipped: string[], maxLevel: number) => void;
  equipPassive: (type: PassiveAbilityType) => boolean;
  unequipPassive: (type: PassiveAbilityType) => void;
  unlockPassive: (type: PassiveAbilityType) => void;
  isPassiveEquipped: (type: PassiveAbilityType) => boolean;
  getEquippedPassives: () => PassiveAbility[];
  syncToFirestore: () => void;
  
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
    
    const PASSIVE_DEFINITIONS = [
      {
        type: PassiveAbilityType.FLUX_BOOST,
        unlockLevel: 3,
        effect: { multiplier: 1.25 }
      },
      {
        type: PassiveAbilityType.SCORE_MULTIPLIER,
        unlockLevel: 8,
        effect: { multiplier: 1.5 }
      },
      {
        type: PassiveAbilityType.LUCKY_PIECES,
        unlockLevel: 15,
        effect: { probability: 0.4 }
      },
      {
        type: PassiveAbilityType.COMBO_MASTER,
        unlockLevel: 25,
        effect: { duration: 3000 }
      },
      {
        type: PassiveAbilityType.ICE_BREAKER,
        unlockLevel: 35,
        effect: { healthModifier: -1 }
      },
    ];
    
    // Start with default values (will be loaded from Firestore)
    PASSIVE_DEFINITIONS.forEach(def => {
      passives.set(def.type, {
        type: def.type,
        unlocked: false,
        equipped: false,
        effect: def.effect
      });
    });
    
    // Initialize with empty slots
    const emptySlots: [PassiveAbilityType | null, PassiveAbilityType | null, PassiveAbilityType | null] = [null, null, null];
    
    set({ passiveAbilities: passives, equippedSlots: emptySlots });
  },

  initializeFromFirestore: (unlocks: string[], equipped: string[], maxLevel: number) => {
    const passives = new Map<PassiveAbilityType, PassiveAbility>();
    
    // PASSIVE_DEFINITIONS - same as in initializePassives
    const PASSIVE_DEFINITIONS = [
      {
        type: PassiveAbilityType.FLUX_BOOST,
        unlockLevel: 3,
        effect: { multiplier: 1.25 }
      },
      {
        type: PassiveAbilityType.SCORE_MULTIPLIER,
        unlockLevel: 8,
        effect: { multiplier: 1.5 }
      },
      {
        type: PassiveAbilityType.LUCKY_PIECES,
        unlockLevel: 15,
        effect: { probability: 0.4 }
      },
      {
        type: PassiveAbilityType.COMBO_MASTER,
        unlockLevel: 25,
        effect: { duration: 3000 }
      },
      {
        type: PassiveAbilityType.ICE_BREAKER,
        unlockLevel: 35,
        effect: { healthModifier: -1 }
      },
    ];
    
    // Create all abilities from PASSIVE_DEFINITIONS
    PASSIVE_DEFINITIONS.forEach(def => {
      // Check if unlocked: either by level or explicitly in unlocks array
      const isUnlocked = maxLevel >= def.unlockLevel || unlocks.includes(def.type);
      const isEquipped = equipped.includes(def.type);
      
      passives.set(def.type, {
        type: def.type,
        unlocked: isUnlocked,
        equipped: isEquipped,
        effect: def.effect
      });
    });
    
    // Restore equipped slots from Firestore data
    const restoredSlots: [PassiveAbilityType | null, PassiveAbilityType | null, PassiveAbilityType | null] = [null, null, null];
    equipped.forEach((type, i) => {
      if (i < 3) {
        restoredSlots[i] = type as PassiveAbilityType;
      }
    });
    
    set({ passiveAbilities: passives, equippedSlots: restoredSlots });
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
    
    // Sync to Firestore
    get().syncToFirestore();
    
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
    
    // Sync to Firestore
    get().syncToFirestore();
  },

  unlockPassive: (type: PassiveAbilityType) => {
    const { passiveAbilities } = get();
    const passive = passiveAbilities.get(type);
    
    if (!passive) return;
    
    const newPassives = new Map(passiveAbilities);
    const updatedPassive = { ...passive, unlocked: true };
    newPassives.set(type, updatedPassive);
    
    set({ passiveAbilities: newPassives });
    
    // Save to localStorage
    const unlocks: Record<string, boolean> = {};
    newPassives.forEach((p, key) => {
      if (p.unlocked) unlocks[key] = true;
    });
    localStorage.setItem('flux_passive_unlocks', JSON.stringify(unlocks));
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

  syncToFirestore: (() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    return () => {
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Debounce for 1000ms
      timeoutId = setTimeout(async () => {
        try {
          // Dynamic import to avoid circular dependency
          const { useAuthStore } = await import('@features/auth/store/authStore');
          const { user } = useAuthStore.getState();
          
          if (!user) {
            console.log('syncToFirestore: No user, skipping sync');
            return;
          }
          
          const { equippedSlots, passiveAbilities } = get();
          
          // Build equipped array from slots
          const equipped = equippedSlots.filter(s => s !== null) as string[];
          
          // Build unlocks array
          const unlocks: string[] = [];
          passiveAbilities.forEach((passive, type) => {
            if (passive.unlocked) {
              unlocks.push(type);
            }
          });
          
          // Call syncAbilities
          await syncAbilities(user.uid, {
            passiveEquipped: equipped,
            passiveUnlocks: unlocks,
          });
          
          console.log('syncToFirestore: Successfully synced abilities');
        } catch (error) {
          console.error('syncToFirestore error:', error);
        }
      }, 1000);
    };
  })(),

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
