/**
 * Abilities feature types
 */
import type { GridState } from '../../game/types';

// Active Abilities
export enum ActiveAbilityType {
  REROLL = 'REROLL',
  SHATTER = 'SHATTER',
  BOMB = 'BOMB',
  ROTATE = 'ROTATE',
  SWAP = 'SWAP',
  FREEZE = 'FREEZE',
  MAGNET = 'MAGNET',
  UNDO = 'UNDO',
}

export interface ActiveAbility {
  type: ActiveAbilityType;
  fluxCost: number;
  unlocked: boolean;
  cooldown?: number;
  usageCount: number;
}

export interface AbilityState {
  activeAbilities: Map<ActiveAbilityType, ActiveAbility>;
  activeSkill: ActiveAbilityType | null;
  freezeMovesRemaining: number;
  historyStack: GridState[];
}

// Passive Abilities
export enum PassiveAbilityType {
  FLUX_BOOST = 'FLUX_BOOST',
  SCORE_MULTIPLIER = 'SCORE_MULTIPLIER',
  LUCKY_PIECES = 'LUCKY_PIECES',
  COMBO_MASTER = 'COMBO_MASTER',
  ICE_BREAKER = 'ICE_BREAKER',
}

export interface PassiveEffect {
  multiplier?: number;
  duration?: number;
  probability?: number;
  healthModifier?: number;
}

export interface PassiveAbility {
  type: PassiveAbilityType;
  unlocked: boolean;
  equipped: boolean;
  effect: PassiveEffect;
}

export interface PassiveAbilityState {
  passiveAbilities: Map<PassiveAbilityType, PassiveAbility>;
  equippedSlots: [PassiveAbilityType | null, PassiveAbilityType | null, PassiveAbilityType | null];
  maxEquipped: 3;
}

// Ability Unlock System
export interface AbilityUnlock {
  abilityType: ActiveAbilityType | PassiveAbilityType;
  condition: UnlockCondition;
  fluxCost?: number;
}

export interface UnlockCondition {
  type: 'LEVEL' | 'SCORE' | 'ACHIEVEMENT' | 'FLUX';
  value: number;
  description: string;
}
