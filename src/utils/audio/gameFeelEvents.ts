import { hapticEvents } from './haptics';

const COMBO_AFTER_CLEAR_DELAY_MS = 155;

const schedule = (callback: () => void, delayMs: number): void => {
  if (typeof window !== 'undefined') {
    window.setTimeout(callback, delayMs);
    return;
  }

  setTimeout(callback, delayMs);
};

export const gameFeelEvents = {
  dragStart: () => hapticEvents.hover(),
  dragHover: () => hapticEvents.hover(),
  placement: () => hapticEvents.placement(),
  invalidPlacement: () => hapticEvents.invalidPlacement(),
  linesCleared: (clearedLines: number, comboLevel: number = 0) => {
    hapticEvents.lineClear(clearedLines);

    if (comboLevel >= 2) {
      schedule(() => hapticEvents.combo(comboLevel), COMBO_AFTER_CLEAR_DELAY_MS);
    }
  },
  iceHit: (broken: boolean = false) => {
    schedule(() => broken ? hapticEvents.iceBreak() : hapticEvents.iceHit(), 110);
  },
  bombChain: (bombCount: number) => {
    if (bombCount > 0) schedule(() => hapticEvents.bombChain(bombCount), 120);
  },
  gravityLand: (strength: number = 1) => hapticEvents.gravityLand(strength),
  perfectClear: () => hapticEvents.perfectClear(),
  surge: () => hapticEvents.surge(),
  achievement: () => hapticEvents.achievement(),
  gameOver: () => hapticEvents.gameOver(),
  skill: () => hapticEvents.skill(),
};
