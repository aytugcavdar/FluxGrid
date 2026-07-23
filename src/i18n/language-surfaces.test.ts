import { afterAll, describe, expect, it } from 'vitest';
import i18n from './index';
import {
  createEngagementNotificationCopy,
  NotificationType,
} from '../services/notifications/pushNotificationService';

const SURFACE_EXPECTATIONS = {
  en: {
    'home.continue': 'Continue',
    'settingsScreen.title': 'Settings',
    'stats.title': 'Statistics',
    'tutorial.drag.title': 'Place the piece',
    'continueModal.title': 'CONTINUE?',
    'achievementDisplay.unlocked': 'Achievement Unlocked',
    'gameOver.title': 'GAME OVER',
    'gameOver.playAgain': 'Play Again',
    'timedHud.lastChance': 'LAST CHANCE',
  },
  tr: {
    'home.continue': 'Devam Et',
    'settingsScreen.title': 'Ayarlar',
    'stats.title': 'İstatistik',
    'tutorial.drag.title': 'Parçayı yerleştir',
    'continueModal.title': 'DEVAM ET?',
    'achievementDisplay.unlocked': 'Başarım Açıldı',
    'gameOver.title': 'OYUN BİTTİ',
    'gameOver.playAgain': 'Tekrar Oyna',
    'timedHud.lastChance': 'SON ŞANS',
  },
} as const;

describe('Turkish and English surface localization', () => {
  afterAll(async () => {
    await i18n.changeLanguage('en');
  });

  for (const language of ['en', 'tr'] as const) {
    it(`translates primary ${language} surfaces`, async () => {
      await i18n.changeLanguage(language);

      for (const [key, expected] of Object.entries(SURFACE_EXPECTATIONS[language])) {
        expect(i18n.t(key)).toBe(expected);
      }
    });
  }

  it('translates scheduled phone notification copy', async () => {
    const context = { bestScore: 10_000, lastScore: 9_200 };
    const now = new Date('2026-07-14T12:00:00Z');

    await i18n.changeLanguage('en');
    const english = createEngagementNotificationCopy(NotificationType.NEAR_RECORD, context, now);

    await i18n.changeLanguage('tr');
    const turkish = createEngagementNotificationCopy(NotificationType.NEAR_RECORD, context, now);

    expect(english.title).not.toBe(turkish.title);
    expect(english.body).not.toBe(turkish.body);
    expect(english.title).not.toContain('notifications.');
    expect(turkish.title).not.toContain('notifications.');
  });
});
