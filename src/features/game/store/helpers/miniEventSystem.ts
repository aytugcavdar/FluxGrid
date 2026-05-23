// Mini-event system removed - stub file for compatibility

export function createMiniEventState() {
  return {
    activeEvents: new Set(),
    moveCounters: {},
    lastActivation: {},
    comboShieldActive: false,
  };
}

export function checkMiniEvents(totalMoves: number, state: any, tier: number) {
  return state;
}

export function tickMiniEvents(state: any, linesCleared: number, comboWouldBreak: boolean) {
  return state;
}

export function shouldPreventComboBreak(state: any, linesCleared: number): boolean {
  return false;
}

export function getMiniEventMultiplier(activeEvents: any, _isScoringBoost: boolean, linesCleared: number): number {
  return 1.0;
}

export function isPieceBlessingActive(state: any): boolean {
  return false;
}
