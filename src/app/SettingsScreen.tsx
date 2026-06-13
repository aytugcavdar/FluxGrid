import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@core/state/settingsStore';
import { useThemeStore } from '../shared/store/themeStore';
import { useGameStore } from '../features/game/store/gameStore';
import { useTutorialStore } from '../features/tutorial/store/tutorialStore';
import { GameMode } from '@shared/types';
import { ToggleSwitch, SectionHeader } from '../shared/components';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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
    exportData,
    resetAllData,
  } = useSettingsStore();

  const { getThemeColors } = useThemeStore();
  const { initGame } = useGameStore();
  const { reset: resetTutorial } = useTutorialStore();
  const colors = getThemeColors();
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  // PWA Install state
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  
  const handleLanguageChange = (lang: 'tr' | 'en' | 'de' | 'fr' | 'es') => {
    console.log('[Language] Changing language to:', lang);
    console.log('[Language] Current i18n language:', i18n.language);
    
    setLanguage(lang);
    localStorage.setItem('flux_language', lang);
    
    i18n.changeLanguage(lang).then(() => {
      console.log('[Language] Language changed successfully to:', i18n.language);
      // No page reload needed - React will re-render automatically
    }).catch((error) => {
      console.error('[Language] Failed to change language:', error);
    });
  };

  // PWA Install setup
  useEffect(() => {
    // Check if already installed
    const pwaInstalled = localStorage.getItem('pwa_installed') === 'true';
    setIsPWAInstalled(pwaInstalled);

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // For iOS, check if already in standalone mode
    if (isIOSDevice) {
      const isStandalone = (navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone) {
        setIsPWAInstalled(true);
        localStorage.setItem('pwa_installed', 'true');
      }
    }

    // For non-iOS, capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstallPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    console.log('PWA Install button clicked!', { isIOS, canInstallPWA, deferredPrompt: !!deferredPromptRef.current });
    
    if (isIOS) {
      // Show iOS instructions
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPromptRef.current) {
      console.log('No deferred prompt available');
      // Fallback: show instructions for other browsers
      setShowIOSInstructions(true); // Use same modal for all browsers
      return;
    }
    
    deferredPromptRef.current.prompt();
    const { outcome } = await deferredPromptRef.current.userChoice;
    
    console.log('User choice:', outcome);
    
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_installed', 'true');
      setIsPWAInstalled(true);
      setCanInstallPWA(false);
    }
    
    deferredPromptRef.current = null;
  };

  const handleExport = async () => {
    setExportStatus('exporting');
    try {
      const data = await exportData();
      
      // Try native share API first
      if (navigator.share) {
        const blob = new Blob([data], { type: 'application/json' });
        const file = new File([blob], `fluxgrid-export-${Date.now()}.json`, { type: 'application/json' });
        await navigator.share({
          title: 'FluxGrid Data Export',
          files: [file],
        });
      } else {
        // Fallback to download
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fluxgrid-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 2000);
    }
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      t('settingsScreen.resetConfirm')
    );
    
    if (confirmed) {
      resetAllData();
      alert(t('settingsScreen.resetSuccess'));
    }
  };
  
  const handleReplayTutorial = () => {
    resetTutorial(); // Reset tutorial state and localStorage
    initGame(GameMode.ENDLESS);
    
    // Start tutorial after a short delay (let canvas load)
    setTimeout(() => {
      useTutorialStore.getState().start();
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ 
        background: colors.background
      }}
    >
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-20" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', paddingBottom: '76px' }}>
        <div className="w-full max-w-[448px] mx-auto">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] mb-2" style={{ color: colors.textTertiary }}>
              FluxGrid
            </p>
            <h1 className="text-3xl font-black leading-none" style={{ color: colors.textPrimary }}>
              Ayarlar
            </h1>
            <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
              Temel oyun tercihlerini buradan yonet.
            </p>

          </div>
          {/* SES VE TİTREŞİM Section */}
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

          {/* DİL Section */}
          <div className="mb-8">
            <SectionHeader title={t('settingsScreen.language')} />
            <p className="text-xs mb-4" style={{ color: colors.textTertiary }}>
              {t('settingsScreen.languageNote')}
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLanguageChange('tr')}
                className="p-5 rounded-2xl text-left transition-all"
                style={{
                  background: language === 'tr' 
                    ? 'rgba(59,130,246,0.1)' 
                    : colors.cardBackgroundTransparent,
                  border: language === 'tr' 
                    ? '2px solid #3b82f6' 
                    : `2px solid ${colors.cardBorderTransparent}`,
                }}
                aria-label="Türkçe dilini seç"
                aria-pressed={language === 'tr'}
              >
                <div style={{ fontSize: '20px' }} className="mb-3">🇹🇷</div>
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{t('settingsScreen.turkish')}</p>
              </button>
              
              <button
                onClick={() => handleLanguageChange('en')}
                className="p-5 rounded-2xl text-left transition-all"
                style={{
                  background: language === 'en' 
                    ? 'rgba(59,130,246,0.1)' 
                    : colors.cardBackgroundTransparent,
                  border: language === 'en' 
                    ? '2px solid #3b82f6' 
                    : `2px solid ${colors.cardBorderTransparent}`,
                }}
                aria-label="İngilizce dilini seç"
                aria-pressed={language === 'en'}
              >
                <div style={{ fontSize: '20px' }} className="mb-3">🇬🇧</div>
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{t('settingsScreen.english')}</p>
              </button>

              <button
                onClick={() => handleLanguageChange('de')}
                className="p-5 rounded-2xl text-left transition-all"
                style={{
                  background: language === 'de' 
                    ? 'rgba(59,130,246,0.1)' 
                    : colors.cardBackgroundTransparent,
                  border: language === 'de' 
                    ? '2px solid #3b82f6' 
                    : `2px solid ${colors.cardBorderTransparent}`,
                }}
                aria-label="Almanca dilini seç"
                aria-pressed={language === 'de'}
              >
                <div style={{ fontSize: '20px' }} className="mb-3">🇩🇪</div>
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{t('settingsScreen.german')}</p>
              </button>

              <button
                onClick={() => handleLanguageChange('fr')}
                className="p-5 rounded-2xl text-left transition-all"
                style={{
                  background: language === 'fr' 
                    ? 'rgba(59,130,246,0.1)' 
                    : colors.cardBackgroundTransparent,
                  border: language === 'fr' 
                    ? '2px solid #3b82f6' 
                    : `2px solid ${colors.cardBorderTransparent}`,
                }}
                aria-label="Fransızca dilini seç"
                aria-pressed={language === 'fr'}
              >
                <div style={{ fontSize: '20px' }} className="mb-3">🇫🇷</div>
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{t('settingsScreen.french')}</p>
              </button>

              <button
                onClick={() => handleLanguageChange('es')}
                className="p-5 rounded-2xl text-left transition-all"
                style={{
                  background: language === 'es' 
                    ? 'rgba(59,130,246,0.1)' 
                    : colors.cardBackgroundTransparent,
                  border: language === 'es' 
                    ? '2px solid #3b82f6' 
                    : `2px solid ${colors.cardBorderTransparent}`,
                }}
                aria-label="İspanyolca dilini seç"
                aria-pressed={language === 'es'}
              >
                <div style={{ fontSize: '20px' }} className="mb-3">🇪🇸</div>
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{t('settingsScreen.spanish')}</p>
              </button>
            </div>
          </div>

          {/* ERİŞİLEBİLİRLİK Section */}
          {/* TEHLİKE BÖLGESİ Section */}
          <div className="mb-8">
            <SectionHeader title={t('settingsScreen.dangerZone')} dividerColor="rgba(239,68,68,0.15)" />
            
            <button
              onClick={handleReset}
              className="w-full p-5 rounded-2xl text-center transition-all"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '2px solid rgba(239,68,68,0.3)',
              }}
              aria-label="Tüm verileri sıfırla"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">⚠️</span>
                <p className="text-sm font-bold text-red-500">{t('settingsScreen.resetAllData')}</p>
              </div>
            </button>
          </div>

          {/* Version Footer */}
          <div className="text-center py-6">
            <p className="text-xs" style={{ color: colors.textTertiary }}>{t('settingsScreen.version')}</p>
          </div>

          {/* Device Info Section */}
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="max-w-sm w-full p-6 rounded-2xl"
            style={{
              background: colors.cardBackground,
              border: `2px solid ${colors.cardBorder}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
              {isIOS ? t('settingsScreen.installPWA') : t('settingsScreen.installPWAInstructions')}
            </h3>
            <div className="space-y-3 mb-6">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">1️⃣</span>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {t('settingsScreen.iosStep1')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">2️⃣</span>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {t('settingsScreen.iosStep2')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">3️⃣</span>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {t('settingsScreen.iosStep3')}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">1️⃣</span>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {t('settingsScreen.androidStep1')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">2️⃣</span>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {t('settingsScreen.androidStep2')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">3️⃣</span>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {t('settingsScreen.androidStep3')}
                    </p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => {
                setShowIOSInstructions(false);
                if (isIOS) {
                  localStorage.setItem('ios_pwa_instructions_shown', 'true');
                }
              }}
              className="w-full py-3 rounded-xl font-bold transition-all"
              style={{
                background: '#3b82f6',
                color: 'white',
              }}
            >
              {t('settingsScreen.understood')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
