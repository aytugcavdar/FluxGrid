import type { TFunction } from 'i18next';
import type { Achievement } from '@features/game/types';

type AchievementPresentation = {
  name: string;
  description: string;
};

const present = (
  t: TFunction,
  key: string,
  target: number
): AchievementPresentation => ({
  name: t(`achievementDisplay.${key}.name`, { target }),
  description: t(`achievementDisplay.${key}.description`, { target }),
});

export function getAchievementPresentation(
  achievement: Achievement,
  t: TFunction
): AchievementPresentation {
  const { id, targetValue } = achievement;

  if (id.startsWith('score_')) return present(t, 'score', targetValue);
  if (id === 'combo_streak') return present(t, 'comboSeries', targetValue);
  if (id.startsWith('combo_')) return present(t, 'combo', targetValue);
  if (id.startsWith('bomb_')) return present(t, 'bomb', targetValue);
  if (id.startsWith('ice_')) return present(t, 'ice', targetValue);
  if (id.startsWith('games_')) return present(t, 'games', targetValue);
  if (id.startsWith('blocks_')) return present(t, 'blocks', targetValue);
  if (id.startsWith('lines_')) return present(t, 'lines', targetValue);
  if (id.startsWith('timed_score_')) return present(t, 'timedScore', targetValue);
  if (id.startsWith('timed_combo_')) return present(t, 'timedCombo', targetValue);
  if (id === 'timed_lines_25') return present(t, 'timedLines', targetValue);
  if (id === 'sprint_boost_1k' || id === 'sprint_master') return present(t, 'sprint', targetValue);
  if (id.startsWith('tier_') || id === 'tier_master') return present(t, 'tier', targetValue);
  if (id.startsWith('event_') || id === 'event_master') return present(t, 'event', targetValue);
  if (id.startsWith('perfect_clear')) return present(t, 'perfect', targetValue);
  if (id === 'color_bonus_10') return present(t, 'color', targetValue);
  if (id === 'large_piece_1' || id === 'large_piece_25') return present(t, 'largePiece', targetValue);
  if (id === 'line5_piece_10') return present(t, 'lineFive', targetValue);
  if (id === 'hollow_3x3_5') return present(t, 'hollow', targetValue);
  if (id === 'square_3x3_1') return present(t, 'square', targetValue);
  if (id === 'large_piece_clear_10') return present(t, 'largeClear', targetValue);
  if (id === 'record_breaker') return present(t, 'record', targetValue);

  return {
    name: achievement.name,
    description: achievement.description,
  };
}
