import { LevelDef, ObjectiveType } from '../../game/types';

/**
 * Procedurally generates levels with a realistic difficulty curve.
 * 
 * First 5 levels are easy/tutorial-like.
 * From level 6 onwards, difficulty (score requirement, max moves) scales logarithmically
 * and introduces new objective types.
 */
export const generateLevel = (levelIndex: number): LevelDef => {
  // Base parameters
  const isTutorialPhase = levelIndex <= 5;
  
  // Exponential base for score, flattened slightly for higher levels
  // level 1: ~1000
  // level 10: ~15000
  // level 50: ~150000
  const scoreBase = 1000;
  let targetScore = 0;
  
  if (levelIndex === 1) targetScore = scoreBase;
  else if (levelIndex <= 5) targetScore = scoreBase + (levelIndex * 800);
  else {
    // Logarithmic-like scaling for higher levels to avoid impossible scores
    const multiplier = Math.pow(levelIndex, 1.4) * 500;
    targetScore = Math.floor(scoreBase + multiplier);
  }

  // Round to nearest 500 for clean numbers
  targetScore = Math.ceil(targetScore / 500) * 500;

  const objectives = [
    { type: ObjectiveType.SCORE, target: targetScore, current: 0 }
  ];

  // Add sub-objectives based on level progression
  if (levelIndex >= 2) {
    // Clear lines objective
    const targetLines = Math.floor(5 + (levelIndex * 1.5));
    objectives.push({ type: ObjectiveType.CLEAR_LINES, target: targetLines, current: 0 });
  }

  if (levelIndex >= 5) {
    // Break ice objective starts at level 5
    // Every 3 levels add another ice requirement
    const targetIce = Math.floor((levelIndex - 4) / 3) * 2 + 3;
    objectives.push({ type: ObjectiveType.BREAK_ICE, target: targetIce, current: 0 });
  }

  if (levelIndex >= 10 && levelIndex % 2 === 0) {
    // Chain reaction objective (Combos) for even levels >= 10
    const targetChains = Math.floor((levelIndex - 8) / 4) + 2;
    objectives.push({ type: ObjectiveType.CHAIN_REACTION, target: targetChains, current: 0 });
  }
  
  if (levelIndex >= 15 && levelIndex % 5 === 0) {
    // Boss levels - explicit bomb usage
    const targetBombs = Math.floor(levelIndex / 5);
    objectives.push({ type: ObjectiveType.USE_BOMB, target: targetBombs, current: 0 });
  }

  // Move limits (Optional, Career Mode logic)
  // Higher levels give slightly more moves, but density of score required is much higher
  let movesLimit = 20;
  if (levelIndex > 1) {
    movesLimit = Math.floor(20 + (Math.log(levelIndex) * 10));
  }

  // Reward Flux for completing the level
  let rewardFlux = 30 + (levelIndex * 5);
  // Cap reward at 150
  if (rewardFlux > 150) rewardFlux = 150;

  let name = `Seviye ${levelIndex}`;
  if (levelIndex === 1) name = "Başlangıç";
  else if (levelIndex === 5) name = "Buz Kırıcı";
  else if (levelIndex % 10 === 0) name = `Usta Aşama ${levelIndex / 10}`;

  return {
    index: levelIndex,
    name,
    objectives,
    movesLimit,
    rewardFlux
  };
};
