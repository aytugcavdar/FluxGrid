import { TIMED_MODE } from '../../constants';
import { GRID_SIZE, type Coord } from '../../types';

export interface TimedTargetReward {
  seconds: number;
  scoreMultiplier: number;
}

export interface TimedMomentumResult {
  momentum: number;
  lastClearAt: number | null;
  freezeTriggered: boolean;
}

export interface TimedTimeRewardResult {
  grantedSeconds: number;
  convertedScore: number;
  totalBonusSeconds: number;
}

const coordKey = ({ x, y }: Coord): string => `${x},${y}`;

export function refillTimedTargets(
  currentTargets: Coord[],
  count = TIMED_MODE.TARGET_COUNT,
  seed = 0
): Coord[] {
  const targets: Coord[] = [];
  const keys = new Set<string>();
  const rows = new Set<number>();
  const cols = new Set<number>();

  currentTargets.forEach(target => {
    if (
      targets.length >= count ||
      target.x < 0 || target.x >= GRID_SIZE ||
      target.y < 0 || target.y >= GRID_SIZE ||
      keys.has(coordKey(target)) ||
      rows.has(target.y) || cols.has(target.x)
    ) return;

    targets.push(target);
    keys.add(coordKey(target));
    rows.add(target.y);
    cols.add(target.x);
  });

  for (let offset = 0; offset < GRID_SIZE * GRID_SIZE && targets.length < count; offset++) {
    const index = (Math.abs(seed) * 17 + offset * 37) % (GRID_SIZE * GRID_SIZE);
    const candidate = { x: index % GRID_SIZE, y: Math.floor(index / GRID_SIZE) };
    if (keys.has(coordKey(candidate)) || rows.has(candidate.y) || cols.has(candidate.x)) continue;

    targets.push(candidate);
    keys.add(coordKey(candidate));
    rows.add(candidate.y);
    cols.add(candidate.x);
  }

  return targets;
}

export function getHitTimedTargets(
  targets: Coord[],
  clearedRows: number[],
  clearedCols: number[]
): Coord[] {
  const rowSet = new Set(clearedRows);
  const colSet = new Set(clearedCols);
  return targets.filter(target => rowSet.has(target.y) || colSet.has(target.x));
}

export function getTimedTargetReward(hitCount: number): TimedTargetReward {
  if (hitCount <= 0) return { seconds: 0, scoreMultiplier: 1 };
  if (hitCount === 1) {
    return { seconds: TIMED_MODE.TARGET_SINGLE_SECONDS, scoreMultiplier: 1 };
  }
  if (hitCount === 2) {
    return { seconds: TIMED_MODE.TARGET_MULTI_SECONDS, scoreMultiplier: 1 };
  }
  return {
    seconds: TIMED_MODE.TARGET_MULTI_SECONDS,
    scoreMultiplier: TIMED_MODE.TARGET_TRIPLE_SCORE_MULTIPLIER,
  };
}

export function resolveTimedTimeReward(
  requestedSeconds: number,
  earnedBonusSeconds: number,
  finalRushLocked: boolean,
  lastChanceAvailable: boolean,
  isLastChanceClear: boolean
): TimedTimeRewardResult {
  const requested = Math.max(0, Math.floor(requestedSeconds));
  const earned = Math.max(0, Math.min(TIMED_MODE.MAX_BONUS_SECONDS, earnedBonusSeconds));

  if (requested === 0) {
    return { grantedSeconds: 0, convertedScore: 0, totalBonusSeconds: earned };
  }

  if (finalRushLocked && !isLastChanceClear) {
    return {
      grantedSeconds: 0,
      convertedScore: requested * TIMED_MODE.FINAL_RUSH_SECONDS_TO_SCORE,
      totalBonusSeconds: earned,
    };
  }

  const rewardCap = isLastChanceClear
    ? TIMED_MODE.MAX_BONUS_SECONDS
    : TIMED_MODE.MAX_BONUS_SECONDS - (lastChanceAvailable ? TIMED_MODE.LAST_CHANCE_SECONDS : 0);
  const maxGrant = Math.max(0, rewardCap - earned);
  const requestedGrant = isLastChanceClear
    ? Math.min(requested, TIMED_MODE.LAST_CHANCE_SECONDS)
    : requested;
  const grantedSeconds = Math.min(requestedGrant, maxGrant);
  const convertedSeconds = requested - grantedSeconds;

  return {
    grantedSeconds,
    convertedScore: convertedSeconds * TIMED_MODE.FINAL_RUSH_SECONDS_TO_SCORE,
    totalBonusSeconds: earned + grantedSeconds,
  };
}

export function getNextTimedMomentum(
  currentMomentum: number,
  linesCleared: number,
  lastClearAt: number | null,
  now: number
): TimedMomentumResult {
  if (linesCleared <= 0) {
    return {
      momentum: Math.max(0, currentMomentum),
      lastClearAt,
      freezeTriggered: false,
    };
  }

  const quickClear = lastClearAt !== null && now - lastClearAt <= TIMED_MODE.MOMENTUM_QUICK_CLEAR_MS;
  const multiLineGain = Math.min(20, Math.max(0, linesCleared - 1) * 10);
  const gain = TIMED_MODE.MOMENTUM_BASE_GAIN
    + multiLineGain
    + (quickClear ? TIMED_MODE.MOMENTUM_QUICK_GAIN : 0);
  const nextMomentum = Math.min(TIMED_MODE.MOMENTUM_MAX, currentMomentum + gain);
  const freezeTriggered = nextMomentum >= TIMED_MODE.MOMENTUM_MAX;

  return {
    momentum: freezeTriggered ? 0 : nextMomentum,
    lastClearAt: now,
    freezeTriggered,
  };
}
