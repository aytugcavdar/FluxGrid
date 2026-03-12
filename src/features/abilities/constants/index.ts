/**
 * Abilities feature constants
 */
import type { AbilityUnlock } from '../types';
import { ActiveAbilityType, PassiveAbilityType } from '../types';

// Ability Unlock Conditions
export const ABILITY_UNLOCKS: AbilityUnlock[] = [
  { abilityType: PassiveAbilityType.FLUX_BOOST, condition: { type: 'LEVEL', value: 3, description: 'Seviye 3\'e ulaş' }, fluxCost: 0 },
  { abilityType: ActiveAbilityType.ROTATE, condition: { type: 'LEVEL', value: 5, description: 'Seviye 5\'e ulaş' }, fluxCost: 0 },
  { abilityType: PassiveAbilityType.SCORE_MULTIPLIER, condition: { type: 'LEVEL', value: 8, description: 'Seviye 8\'e ulaş' }, fluxCost: 0 },
  { abilityType: ActiveAbilityType.SWAP, condition: { type: 'LEVEL', value: 12, description: 'Seviye 12\'ye ulaş' }, fluxCost: 0 },
  { abilityType: PassiveAbilityType.LUCKY_PIECES, condition: { type: 'LEVEL', value: 15, description: 'Seviye 15\'e ulaş' }, fluxCost: 0 },
  { abilityType: ActiveAbilityType.FREEZE, condition: { type: 'LEVEL', value: 20, description: 'Seviye 20\'ye ulaş' }, fluxCost: 0 },
  { abilityType: PassiveAbilityType.ICE_BREAKER, condition: { type: 'LEVEL', value: 25, description: 'Seviye 25\'e ulaş' }, fluxCost: 0 },
  { abilityType: ActiveAbilityType.MAGNET, condition: { type: 'LEVEL', value: 30, description: 'Seviye 30\'a ulaş' }, fluxCost: 0 },
  { abilityType: PassiveAbilityType.COMBO_MASTER, condition: { type: 'LEVEL', value: 35, description: 'Seviye 35\'e ulaş' }, fluxCost: 0 },
  { abilityType: ActiveAbilityType.UNDO, condition: { type: 'LEVEL', value: 40, description: 'Seviye 40\'a ulaş' }, fluxCost: 0 },
];
