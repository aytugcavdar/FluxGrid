import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppState, GameMode } from '@shared/types';
import { tickTimerImpl } from './timerLogic';

vi.mock('../../../../utils/audio', () => ({
  playGameOver: vi.fn(),
  playTick: vi.fn(),
}));

const createTimerState = (overrides: Record<string, unknown> = {}) => ({
  timeLeft: 1,
  isGameOver: false,
  gameMode: GameMode.TIMED,
  appState: AppState.GAME,
  timerExpectedEnd: 10_000,
  comboTimerStartTime: null,
  comboTimerDuration: 10_000,
  combo: 0,
  score: 0,
  lastPassiveDecayTime: null,
  timedLastChanceAvailable: true,
  timedLastChanceActive: false,
  timedFinalRushLocked: false,
  ...overrides,
});

describe('Timed timer last chance', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens one final move instead of ending immediately', () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    const state = createTimerState();
    const set = (update: Record<string, unknown>) => Object.assign(state, update);

    tickTimerImpl(() => state, set);

    expect(state).toMatchObject({
      timeLeft: 0,
      isGameOver: false,
      timerExpectedEnd: null,
      timedLastChanceAvailable: false,
      timedLastChanceActive: true,
    });
  });

  it('ends the run normally after the last chance has been consumed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    const state = createTimerState({ timedLastChanceAvailable: false });
    const set = (update: Record<string, unknown>) => Object.assign(state, update);

    tickTimerImpl(() => state, set);

    expect(state).toMatchObject({ timeLeft: 0, isGameOver: true });
  });

  it('does not write timer state when the displayed second is unchanged', () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    const state = createTimerState({ timeLeft: 15, timerExpectedEnd: 24_500 });
    const set = vi.fn((update: Record<string, unknown>) => Object.assign(state, update));

    tickTimerImpl(() => state, set);

    expect(set).not.toHaveBeenCalled();
  });

  it('locks Final Rush when the timer enters the last ten seconds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    const state = createTimerState({ timeLeft: 11, timerExpectedEnd: 19_500 });
    const set = (update: Record<string, unknown>) => Object.assign(state, update);

    tickTimerImpl(() => state, set);

    expect(state).toMatchObject({ timeLeft: 10, timedFinalRushLocked: true });
  });
});
