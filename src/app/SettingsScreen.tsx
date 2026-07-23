import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@core/state/settingsStore';
import { useThemeStore } from '../shared/store/themeStore';
import { ToggleSwitch, SectionHeader } from '../shared/components';
import { AdManager } from '../core/services/ads/AdManager';
import { Capacitor } from '@capacitor/core';
import {
  getEngagementNotificationPreferences,
  notificationScheduler,
  setEngagementNotificationPreferences,
} from '../services/notifications/pushNotificationService';
import { requestNotificationPermission } from '../utils/native/notificationHelper';

type SettingsLanguage = 'tr' | 'en';

const LANGUAGE_OPTIONS: Array<{ code: SettingsLanguage; labelKey: string; shortLabel: string }> = [
  { code: 'tr', labelKey: 'turkish', shortLabel: 'TR' },
  { code: 'en', labelKey: 'english', shortLabel: 'EN' },
];

export const SettingsScreen: React.FC = () => {
  const { i18n, t } = useTranslation();
  const {
    soundEnabled,
    musicEnabled,
    hapticEnabled,
    language,
    setSoundEnabled,
    setMusicEnabled,
    setHapticEnabled,
    setLanguage,
    resetAllData,
  } = useSettingsStore();

  const { getThemeColors } = useThemeStore();

  const colors = getThemeColors();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => getEngagementNotificationPreferences().enabled
  );
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [privacyOptionsAvailable, setPrivacyOptionsAvailable] = useState(
    () => AdManager.isPrivacyOptionsRequired()
  );
  const [privacyOptionsBusy, setPrivacyOptionsBusy] = useState(false);

  const handleLanguageChange = (lang: SettingsLanguage) => {
    setLanguage(lang);
    localStorage.setItem('flux_language', lang);
    i18n.changeLanguage(lang).catch((error) => {
      console.error('[Language] Failed to change language:', error);
    });
  };

  const handleReset = async () => {
    const confirmed = window.confirm(t('settingsScreen.resetConfirm'));
    if (!confirmed) return;

    await notificationScheduler.cancelAllNotifications();
    resetAllData();
  };

  useEffect(() => {
    const updateAvailability = () => {
      setPrivacyOptionsAvailable(AdManager.isPrivacyOptionsRequired());
    };

    updateAvailability();
    window.addEventListener('fluxgrid-ad-consent-updated', updateAvailability);
    return () => window.removeEventListener('fluxgrid-ad-consent-updated', updateAvailability);
  }, []);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (notificationBusy || !Capacitor.isNativePlatform()) return;
    setNotificationBusy(true);

    try {
      if (!enabled) {
        setEngagementNotificationPreferences({ enabled: false, streakReminder: false });
        setNotificationsEnabled(false);
        await notificationScheduler.cancelAllNotifications();
        return;
      }

      const granted = await requestNotificationPermission();
      if (!granted) {
        setEngagementNotificationPreferences({ enabled: false, streakReminder: false });
        setNotificationsEnabled(false);
        return;
      }

      setEngagementNotificationPreferences({
        enabled: true,
        dailyReminder: true,
        streakReminder: false,
      });
      setNotificationsEnabled(true);
      await notificationScheduler.scheduleEngagementNotifications({}, { requestPermission: false });
    } finally {
      setNotificationBusy(false);
    }
  };

  const handlePrivacyOptions = async () => {
    if (privacyOptionsBusy) return;
    setPrivacyOptionsBusy(true);
    try {
      await AdManager.showPrivacyOptions();
      setPrivacyOptionsAvailable(AdManager.isPrivacyOptionsRequired());
    } finally {
      setPrivacyOptionsBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: colors.background }}
    >
      <div
        className="flex-1 overflow-y-auto px-4 pb-20"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          paddingBottom: '76px',
        }}
      >
        <div className="w-full max-w-[448px] mx-auto">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] mb-2" style={{ color: colors.textTertiary }}>
              FluxGrid
            </p>
            <h1 className="text-3xl font-black leading-none" style={{ color: colors.textPrimary }}>
              {t('settingsScreen.title')}
            </h1>
            <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
              {t('settingsScreen.subtitle')}
            </p>
          </div>

          <div className="mb-8">
            <SectionHeader title={t('settingsScreen.soundAndVibration')} />
            <div className="space-y-3">
              <ToggleSwitch
                label={t('settingsScreen.soundEffects')}
                description={t('settingsScreen.soundEffectsDesc')}
                value={soundEnabled}
                onChange={setSoundEnabled}
              />
              <ToggleSwitch
                label={t('settingsScreen.music')}
                description={t('settingsScreen.musicDesc')}
                value={musicEnabled}
                onChange={setMusicEnabled}
              />
              <ToggleSwitch
                label={t('settingsScreen.vibration')}
                description={t('settingsScreen.vibrationDesc')}
                value={hapticEnabled}
                onChange={setHapticEnabled}
              />
            </div>
          </div>

          {Capacitor.isNativePlatform() && (
            <div className="mb-8">
              <SectionHeader title={t('settingsScreen.notifications')} />
              <ToggleSwitch
                label={t('settingsScreen.phoneNotifications')}
                description={t('settingsScreen.phoneNotificationsDesc')}
                value={notificationsEnabled}
                onChange={handleNotificationToggle}
                disabled={notificationBusy}
              />
            </div>
          )}

          <div className="mb-8">
            <SectionHeader title={t('settingsScreen.language')} />
            <p className="text-xs mb-4" style={{ color: colors.textTertiary }}>
              {t('settingsScreen.languageNote')}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {LANGUAGE_OPTIONS.map(option => {
                const selected = language === option.code;
                return (
                  <button
                    key={option.code}
                    onClick={() => handleLanguageChange(option.code)}
                    className="p-5 rounded-2xl text-left transition-all"
                    style={{
                      background: selected ? 'rgba(59,130,246,0.1)' : colors.cardBackgroundTransparent,
                      border: selected ? '2px solid #3b82f6' : `2px solid ${colors.cardBorderTransparent}`,
                    }}
                    aria-label={t('settingsScreen.languageOptionAria', { language: t(`settingsScreen.${option.labelKey}`) })}
                    aria-pressed={selected}
                  >
                    <div className="mb-3 text-xs font-black tracking-[0.16em]" style={{ color: colors.textTertiary }}>
                      {option.shortLabel}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      {t(`settingsScreen.${option.labelKey}`)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {Capacitor.isNativePlatform() && privacyOptionsAvailable && (
            <div className="mb-8">
              <SectionHeader title={t('settingsScreen.privacy')} />
              <button
                onClick={handlePrivacyOptions}
                disabled={privacyOptionsBusy}
                className="w-full p-5 rounded-2xl text-left transition-all disabled:opacity-50"
                style={{
                  background: colors.cardBackgroundTransparent,
                  border: `1px solid ${colors.cardBorderTransparent}`,
                  color: colors.textPrimary,
                }}
              >
                <p className="text-sm font-bold">{t('settingsScreen.adPrivacyOptions')}</p>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  {privacyOptionsBusy
                    ? t('settingsScreen.adPrivacyOpening')
                    : t('settingsScreen.adPrivacyOptionsDesc')}
                </p>
              </button>
            </div>
          )}

          <div className="mb-8">
            <SectionHeader title={t('settingsScreen.dangerZone')} dividerColor="rgba(239,68,68,0.15)" />
            <button
              onClick={handleReset}
              className="w-full p-5 rounded-2xl text-center transition-all"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '2px solid rgba(239,68,68,0.3)',
              }}
              aria-label="Tum verileri sifirla"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">!</span>
                <p className="text-sm font-bold text-red-500">{t('settingsScreen.resetAllData')}</p>
              </div>
            </button>
          </div>

          <div className="text-center py-6">
            <p className="text-xs" style={{ color: colors.textTertiary }}>
              {t('settingsScreen.version')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
