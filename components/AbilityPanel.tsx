import React from 'react';
import { motion } from 'framer-motion';
import { useAbilityStore } from '../store/abilityStore';
import { usePassiveAbilityStore } from '../store/passiveAbilityStore';
import { useGameStore } from '../store/gameStore';
import { ActiveAbilityType, PassiveAbilityType } from '../types';
import { RotateCw, Repeat, Snowflake, Magnet, Undo, Zap, TrendingUp, Clover, Clock, Shield, RefreshCw, Hammer, Bomb } from 'lucide-react';
import clsx from 'clsx';
import { playClick } from '../utils/audio';

const ACTIVE_ABILITY_ICONS: Record<ActiveAbilityType, React.ReactNode> = {
  [ActiveAbilityType.REROLL]: <RefreshCw size={20} />,
  [ActiveAbilityType.SHATTER]: <Hammer size={20} />,
  [ActiveAbilityType.BOMB]: <Bomb size={20} />,
  [ActiveAbilityType.ROTATE]: <RotateCw size={20} />,
  [ActiveAbilityType.SWAP]: <Repeat size={20} />,
  [ActiveAbilityType.FREEZE]: <Snowflake size={20} />,
  [ActiveAbilityType.MAGNET]: <Magnet size={20} />,
  [ActiveAbilityType.UNDO]: <Undo size={20} />
};

const PASSIVE_ABILITY_ICONS: Record<PassiveAbilityType, React.ReactNode> = {
  [PassiveAbilityType.FLUX_BOOST]: <Zap size={20} />,
  [PassiveAbilityType.SCORE_MULTIPLIER]: <TrendingUp size={20} />,
  [PassiveAbilityType.LUCKY_PIECES]: <Clover size={20} />,
  [PassiveAbilityType.COMBO_MASTER]: <Clock size={20} />,
  [PassiveAbilityType.ICE_BREAKER]: <Shield size={20} />
};

export const AbilityPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { activeAbilities, activateAbility } = useAbilityStore();
  const { passiveAbilities, equippedSlots, equipPassive, unequipPassive } = usePassiveAbilityStore();
  const flux = useGameStore(state => state.flux);

  const handleActivate = (type: ActiveAbilityType) => {
    const ability = activeAbilities.get(type);
    if (ability && ability.unlocked && flux >= ability.fluxCost) {
      playClick();
      activateAbility(type);
    }
  };

  const handleEquipToggle = (type: PassiveAbilityType) => {
    playClick();
    const isEquipped = equippedSlots.includes(type);
    if (isEquipped) {
      unequipPassive(type);
    } else {
      equipPassive(type);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-800 border border-white/10 rounded-3xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white italic tracking-tight">YETENEKLERİM</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl">&times;</button>
        </div>

        {/* Active Abilities */}
        <div className="mb-8">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">AKTİF YETENEKLER</h3>
          <div className="space-y-3">
            {Array.from(activeAbilities.entries()).map(([type, ability]) => {
              const unlocked = ability.unlocked;
              const canUse = unlocked && flux >= ability.fluxCost;

              return (
                <motion.button
                  key={type}
                  onClick={() => unlocked && handleActivate(type)}
                  disabled={!canUse}
                  className={clsx(
                    "w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4",
                    unlocked
                      ? canUse
                        ? "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
                        : "bg-white/5 border-white/10 opacity-50"
                      : "bg-white/5 border-white/10 opacity-30"
                  )}
                >
                  <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    unlocked ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-white/20"
                  )}>
                    {unlocked ? ACTIVE_ABILITY_ICONS[type] : '🔒'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-sm">{type}</span>
                      <span className="text-xs text-blue-400 font-bold">{ability.fluxCost} Flux</span>
                    </div>
                    <p className="text-xs text-white/60">Kullanım: {ability.usageCount}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Passive Abilities */}
        <div>
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-2">PASİF YETENEKLER</h3>
          <p className="text-xs text-white/60 mb-4">En fazla 3 pasif yetenek donatabilirsiniz</p>
          <div className="space-y-3">
            {Array.from(passiveAbilities.entries()).map(([type, ability]) => {
              const unlocked = ability.unlocked;
              const isEquipped = equippedSlots.includes(type);
              const canEquip = unlocked && (isEquipped || equippedSlots.filter(s => s !== null).length < 3);

              return (
                <motion.button
                  key={type}
                  onClick={() => unlocked && canEquip && handleEquipToggle(type)}
                  disabled={!canEquip && !isEquipped}
                  className={clsx(
                    "w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4",
                    unlocked
                      ? isEquipped
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : canEquip
                          ? "bg-white/5 border-white/10 hover:bg-white/10"
                          : "bg-white/5 border-white/10 opacity-50"
                      : "bg-white/5 border-white/10 opacity-30"
                  )}
                >
                  <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    unlocked
                      ? isEquipped
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-purple-500/20 text-purple-400"
                      : "bg-white/5 text-white/20"
                  )}>
                    {unlocked ? PASSIVE_ABILITY_ICONS[type] : '🔒'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-sm">{type}</span>
                      {isEquipped && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold">
                          DONATILDI
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60">
                      {ability.effect.multiplier && `${ability.effect.multiplier}x çarpan`}
                      {ability.effect.probability && `${ability.effect.probability * 100}% şans`}
                      {ability.effect.duration && `${ability.effect.duration}s süre`}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
