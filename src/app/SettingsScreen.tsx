import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@core/state/settingsStore';
import { useThemeStore } from '../shared/store/themeStore';
import { ToggleSwitch, SectionHeader } from '../shared/components';
import { AdManager } from '../core/services/ads/AdManager';

type SettingsLanguage = 'tr' | 'en' | 'de' | 'fr' | 'es';

const LANGUAGE_OPTIONS: Array<{ code: SettingsLanguage; labelKey: string; shortLabel: string }> = [
  { code: 'tr', labelKey: 'turkish', shortLabel: 'TR' },
  { code: 'en', labelKey: 'english', shortLabel: 'EN' },
  { code: 'de', labelKey: 'german', shortLabel: 'DE' },
  { code: 'fr', labelKey: 'french', shortLabel: 'FR' },
  { code: 'es', labelKey: 'spanish', shortLabel: 'ES' },
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

  const {
    currentTheme,
    getThemeColors,
    setTheme,
    activateThemeTrial,
    getThemeTrialRemainingMs,
  } = useThemeStore();

  const colors = getThemeColors();
  const [themeRewardStatus, setThemeRewardStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [themeTrialRemainingMs, setThemeTrialRemainingMs] = useState(() => getThemeTrialRemainingMs('neon'));

  const handleLanguageChange = (lang: SettingsLanguage) => {
    setLanguage(lang);
    localStorage.setItem('flux_language', lang);
    i18n.changeLanguage(lang).catch((error) => {
      console.error('[Language] Failed to change language:', error);
    });
  };

  const handleReset = () => {
    const confirmed = window.confirm(t('settingsScreen.resetConfirm'));
    if (!confirmed) return;

    resetAllData();
    alert(t('settingsScreen.resetSuccess'));
  };

  useEffect(() => {
    if (themeTrialRemainingMs <= 0) return;

    const intervalId = window.setInterval(() => {
      const remaining = getThemeTrialRemainingMs('neon');
      setThemeTrialRemainingMs(remaining);
      if (remaining <= 0 && currentTheme === 'neon') setTheme('dark');
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [currentTheme, getThemeTrialRemainingMs, setTheme, themeTrialRemainingMs]);

  const handleThemeTrialReward = async () => {
    if (themeRewardStatus === 'loading') return;
    setThemeRewardStatus('loading');

    const result = await AdManager.showRewardedThemeTrial();
    if (!result.success) {
      setThemeRewardStatus('error');
      setTimeout(() => setThemeRewardStatus('idle'), 2500);
      return;
    }

    const expiresAt = activateThemeTrial('neon', result.reward?.amount || 24);
    setThemeTrialRemainingMs(Math.max(0, expiresAt - Date.now()));
    setThemeRewardStatus('success');
    setTimeout(() => setThemeRewardStatus('idle'), 2500);
  };

  const themeTrialHours = Math.max(0, Math.ceil(themeTrialRemainingMs / (60 * 60 * 1000)));
  const canWatchThemeReward = AdManager.canShowRewardedThemeTrial();

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

          <div className="mb-8">
            <SectionHeader title={t('settingsScreen.rewards')} />
            <div
              className="p-5 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(232,121,249,0.12), rgba(34,211,238,0.07))',
                border: '1px solid rgba(232,121,249,0.28)',
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-base font-black" style={{ color: colors.textPrimary }}>
                    {t('settingsScreen.neonTrialTitle')}
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {t('settingsScreen.neonTrialDesc')}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #e879f9, #22d3ee)',
                    boxShadow: '0 0 18px rgba(232,121,249,0.25)',
                  }}
                />
              </div>

              {themeTrialRemainingMs > 0 ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme(currentTheme === 'neon' ? 'dark' : 'neon')}
                    className="flex-1 py-3 rounded-xl text-sm font-bold"
                    style={{ background: 'rgba(232,121,249,0.18)', color: '#f5d0fe' }}
                  >
                    {currentTheme === 'neon' ? t('settingsScreen.switchToDark') : t('settingsScreen.useNeon')}
                  </button>
                  <div
                    className="px-3 rounded-xl flex items-center text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.05)', color: colors.textSecondary }}
                  >
                    {t('settingsScreen.hoursLeft', { count: themeTrialHours })}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleThemeTrialReward}
                  disabled={!canWatchThemeReward || themeRewardStatus === 'loading'}
                  className="w-full py-3 rounded-xl text-sm font-black disabled:opacity-50"
                  style={{ background: 'linear-gradient(90deg, #a855f7, #0891b2)', color: '#ffffff' }}
                >
                  {themeRewardStatus === 'loading'
                    ? t('settingsScreen.adLoading')
                    : themeRewardStatus === 'error'
                    ? t('settingsScreen.adFailed')
                    : canWatchThemeReward
                    ? t('settingsScreen.watchAdTrial')
                    : t('settingsScreen.trialUsed')}
                </button>
              )}
            </div>
          </div>

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
