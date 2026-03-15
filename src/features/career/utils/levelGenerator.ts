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

  // Ensure targetScore is finite and positive
  const safeTargetScore = isFinite(targetScore) && targetScore > 0 ? targetScore : 1000;
  
  // Round to nearest 500 for clean numbers
  targetScore = Math.ceil(safeTargetScore / 500) * 500;

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

  // Boss Level Logic - Every 10th level
  if (levelIndex % 10 === 0 && levelIndex > 0) {
    const bossIndex = (levelIndex / 10) - 1;
    const bossTypes = [
      'ICE_STORM',    // Seviye 10: Grid'e sürekli buz blok düşer
      'BOMB_RAIN',    // Seviye 20: Her 3 hamlede bir bomba bloğu
      'SPEED_SURGE',  // Seviye 30: Moves limit yarıya inmiş, hedef aynı
      'DARKNESS',     // Seviye 40: Parça renklerini gizler
      'MIRROR',       // Seviye 50: Her yerleştirmede ayna parça da gelir
    ] as const;
    
    const bossDescriptions = {
      ICE_STORM: 'Her 2 hamlede bir buz bloğu düşüyor!',
      BOMB_RAIN: 'Dikkat: Bombalar sahada!',
      SPEED_SURGE: 'Daha az hamle, aynı hedef!',
      DARKNESS: 'Parça renkleri gizli — şansına güven!',
      MIRROR: 'Her yerleştirmede ayna parça da geliyor!',
    };
    
    const bossType = bossTypes[bossIndex % bossTypes.length];
    
    return {
      index: levelIndex,
      name: `BOSS — ${levelIndex}. Seviye`,
      objectives,
      movesLimit: bossType === 'SPEED_SURGE' 
        ? Math.floor((movesLimit || 20) * 0.6) 
        : movesLimit,
      rewardFlux: Math.min(150, rewardFlux * 2), // Boss'ta 2x flux ödülü
      starThresholds: [
        targetScore,
        Math.round(targetScore * 1.8),
        Math.round(targetScore * 2.5),
      ] as [number, number, number],
      isBoss: true,
      bossType,
      bossDescription: bossDescriptions[bossType],
    };
  }

  return {
    index: levelIndex,
    name,
    objectives,
    movesLimit,
    rewardFlux,
    starThresholds: [
      targetScore,                                        // 1 star = complete target score
      Math.min(Math.round(targetScore * 1.5), 9999999),  // 2 stars = 50% more (capped)
      Math.min(Math.round(targetScore * 2.0), 9999999)   // 3 stars = double (capped)
    ] as [number, number, number]
  };
};
