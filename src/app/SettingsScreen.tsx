import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@core/state/settingsStore';
import { useThemeStore, ThemeType } from '../shared/store/themeStore';
import { useGameStore } from '../features/game/store/gameStore';
import { useTutorialStore } from '../features/tutorial/store/tutorialStore';
import { usePerformanceStore } from '../features/game/store/performanceStore';
import { useVisualEffectStore } from '../features/visual-effects/store/visualEffectStore';
import { useJuiceStore } from '../features/visual-effects/store/juiceStore';
import { GameMode } from '@shared/types';
import { ToggleSwitch, SectionHeader } from '../shared/components';
import { isAndroid } from '../utils/platform/platform';

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
    ghostBlockEnabled,
    performanceModeEnabled,
    colorBlindMode,
    language,
    setSoundEnabled,
    setMusicEnabled,
    setHapticEnabled,
    setGhostBlockEnabled,
    setPerformanceModeEnabled,
    setColorBlindMode,
    setLanguage,
    exportData,
    resetAllData,
  } = useSettingsStore();

  const { currentTheme, setTheme, getThemeColors } = useThemeStore();
  const { initGame } = useGameStore();
  const { reset: resetTutorial } = useTutorialStore();
  const { debugMode, setDebugMode, exportMetrics, metrics } = usePerformanceStore();
  const { prefersReducedMotion, setReducedMotion } = useVisualEffectStore();
  const { performanceMode, setPerformanceMode } = useJuiceStore();
  const colors = getThemeColors();
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [fpsLimit, setFpsLimit] = useState<30 | 60 | 'auto'>('auto');
  const androidPlatform = isAndroid();
  
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

  // Load FPS limit from localStorage on mount
  useEffect(() => {
    const savedFPS = localStorage.getItem('fps-limit');
    if (savedFPS === '30' || savedFPS === '60') {
      setFpsLimit(parseInt(savedFPS) as 30 | 60);
    } else {
      setFpsLimit('auto');
    }
  }, []);

  // Sync performance mode between stores on mount
  useEffect(() => {
    // Sync juiceStore's performanceMode to settingsStore on mount
    if (performanceMode !== performanceModeEnabled) {
      setPerformanceModeEnabled(performanceMode);
    }
  }, []);

  // Handle FPS limit change
  const handleFpsLimitChange = (fps: 30 | 60 | 'auto') => {
    setFpsLimit(fps);
    localStorage.setItem('fps-limit', fps.toString());
    // Note: The actual FPS change will be handled by useFPSLimiter hook in Grid component
  };

  // Handle performance metrics export
  const handleExportMetrics = async () => {
    setExportStatus('exporting');
    
    try {
      const metricsData = exportMetrics();
      
      // Log metrics summary to console for debugging
      const metricsObj = JSON.parse(metricsData);
      console.log('[Settings] ===== PERFORMANCE METRICS SUMMARY =====');
      console.log('[Settings] Current FPS:', metricsObj.currentFPS);
      console.log('[Settings] Average FPS:', metricsObj.averageFPS?.toFixed(2));
      console.log('[Settings] Min FPS:', metricsObj.minFPS);
      console.log('[Settings] Max FPS:', metricsObj.maxFPS);
      console.log('[Settings] FPS History:', metricsObj.fpsHistory?.length, 'samples');
      console.log('[Settings] Touch Response Avg:', metricsObj.averageTouchResponse?.toFixed(2), 'ms');
      console.log('[Settings] Background Pauses:', metricsObj.backgroundPauseCount);
      console.log('[Settings] Battery Savings:', metricsObj.estimatedBatterySavings?.toFixed(1), '%');
      console.log('[Settings] Full data:', metricsObj);
      console.log('[Settings] ==========================================');
      
      // Try native share API first (works on mobile)
      if (navigator.share && navigator.canShare) {
        const blob = new Blob([metricsData], { type: 'application/json' });
        const file = new File([blob], `fluxgrid-metrics-${Date.now()}.json`, { type: 'application/json' });
        
        // Check if we can share files
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'FluxGrid Performance Metrics',
            text: 'Performance metrics from FluxGrid',
            files: [file],
          });
          setExportStatus('success');
          console.log('[Settings] Metrics shared successfully via file');
        } else {
          // Fallback: Share as text
          await navigator.share({
            title: 'FluxGrid Performance Metrics',
            text: metricsData,
          });
          setExportStatus('success');
          console.log('[Settings] Metrics shared successfully as text');
        }
      } else {
        // Fallback to download (desktop/old browsers)
        const blob = new Blob([metricsData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fluxgrid-metrics-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportStatus('success');
        console.log('[Settings] Metrics downloaded as file');
      }
      
      // Reset status after 2 seconds
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (error) {
      console.error('[Settings] Metrics export failed:', error);
      setExportStatus('error');
      
      // Show error message and reset after 3 seconds
      setTimeout(() => setExportStatus('idle'), 3000);
      
      // Last resort: Copy to clipboard
      try {
        const metricsData = exportMetrics();
        await navigator.clipboard.writeText(metricsData);
        alert('Metrics copied to clipboard! Paste it somewhere to save.');
        setExportStatus('success');
        console.log('[Settings] Metrics copied to clipboard as fallback');
      } catch (clipboardError) {
        console.error('[Settings] Clipboard copy also failed:', clipboardError);
        alert('Export failed. Please check console logs for metrics data.');
      }
    }
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

  const themes: Array<{ theme: ThemeType; label: string; colors: string[] }> = [
    { theme: 'dark', label: t('settingsScreen.themeDark'), colors: ['#a855f7', '#9333ea', '#f59e0b'] },
    { theme: 'light', label: t('settingsScreen.themeLight'), colors: ['#f59e0b', '#fbbf24', '#fb923c'] },
    { theme: 'neon', label: t('settingsScreen.themeNeon'), colors: ['#e879f9', '#c084fc', '#a78bfa'] },
  ];

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
          {/* GÖRÜNÜM Section */}
          <div className="mb-8">
            <SectionHeader title={t('settingsScreen.appearance')} />
            
            <div className="grid grid-cols-3 gap-3">
              {themes.map(({ theme, label, colors: themeColors }) => (
                <button
                  key={theme}
                  onClick={() => setTheme(theme)}
                  className="text-left transition-all cursor-pointer"
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: currentTheme === theme 
                      ? 'rgba(59,130,246,0.1)' 
                      : 'transparent',
                    border: currentTheme === theme 
                      ? '2px solid #3b82f6' 
                      : '1.5px solid rgba(255,255,255,0.06)',
                  }}
                  aria-label={`${label} temasını seç`}
                  aria-pressed={currentTheme === theme}
                >
                  {/* 32px height preview gradient */}
                  <div 
                    className="mb-2"
                    style={{
                      height: '32px',
                      borderRadius: '6px',
                      background: `linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 50%, ${themeColors[2]} 100%)`,
                    }}
                  />
                  
                  {/* Theme name and subtitle */}
                  <p className="text-sm font-semibold mb-0.5" style={{ color: colors.textPrimary }}>
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>
                    {theme === 'dark' && t('settingsScreen.themeDarkDesc')}
                    {theme === 'light' && t('settingsScreen.themeLightDesc')}
                    {theme === 'neon' && t('settingsScreen.themeNeonDesc')}
                  </p>
                </button>
              ))}
            </div>
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

          {/* OYUN Section */}
          <div className="mb-8">
            <SectionHeader title={t('settingsScreen.game')} />
            
            <div className="space-y-3">
              <ToggleSwitch
                label={t('settingsScreen.ghostBlock')}
                description={t('settingsScreen.ghostBlockDesc')}
                value={ghostBlockEnabled}
                onChange={setGhostBlockEnabled}
              />
              
              <ToggleSwitch
                label={t('settingsScreen.performanceMode')}
                description={t('settingsScreen.performanceModeDesc')}
                value={performanceMode}
                onChange={(enabled) => {
                  setPerformanceMode(enabled);
                  setPerformanceModeEnabled(enabled);
                }}
              />
              
              <ToggleSwitch
                label={t('settingsScreen.reducedMotion')}
                description={t('settingsScreen.reducedMotionDesc')}
                value={prefersReducedMotion}
                onChange={setReducedMotion}
              />
            </div>
          </div>

          {/* ERİŞİLEBİLİRLİK Section */}
          <div className="mb-8">
            <SectionHeader title={t('settingsScreen.accessibility')} />
            <p className="text-xs mb-4" style={{ color: colors.textTertiary }}>
              {t('settingsScreen.accessibilityNote')}
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setColorBlindMode('none')}
                className="p-5 rounded-2xl text-left transition-all"
                style={{
                  background: colorBlindMode === 'none' 
                    ? 'rgba(59,130,246,0.1)' 
                    : colors.cardBackgroundTransparent,
                  border: colorBlindMode === 'none' 
                    ? '2px solid #3b82f6' 
                    : `2px solid ${colors.cardBorderTransparent}`,
                }}
                aria-label="Normal görüş"
                aria-pressed={colorBlindMode === 'none'}
              >
                <div style={{ fontSize: '20px' }} className="mb-3">👁️</div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: colors.textPrimary }}>{t('settingsScreen.normal')}</p>
                <p className="text-xs" style={{ color: colors.textTertiary }}>{t('settingsScreen.normalDesc')}</p>
              </button>
              
              <button
                onClick={() => setColorBlindMode('protanopia')}
                className="p-5 rounded-2xl text-left transition-all"
                style={{
                  background: colorBlindMode === 'protanopia' 
                    ? 'rgba(59,130,246,0.1)' 
                    : colors.cardBackgroundTransparent,
                  border: colorBlindMode === 'protanopia' 
                    ? '2px solid #3b82f6' 
                    : `2px solid ${colors.cardBorderTransparent}`,
                }}
                aria-label="Kırmızı renk körlüğü"
                aria-pressed={colorBlindMode === 'protanopia'}
              >
                <div style={{ fontSize: '20px' }} className="mb-3">🔴</div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: colors.textPrimary }}>{t('settingsScreen.protanopia')}</p>
                <p className="text-xs" style={{ color: colors.textTertiary }}>{t('settingsScreen.protanopiaDesc')}</p>
              </button>

              <button
                onClick={() => setColorBlindMode('deuteranopia')}
                className="p-5 rounded-2xl text-left transition-all"
                style={{
                  background: colorBlindMode === 'deuteranopia' 
                    ? 'rgba(59,130,246,0.1)' 
                    : colors.cardBackgroundTransparent,
                  border: colorBlindMode === 'deuteranopia' 
                    ? '2px solid #3b82f6' 
                    : `2px solid ${colors.cardBorderTransparent}`,
                }}
                aria-label="Yeşil renk körlüğü"
                aria-pressed={colorBlindMode === 'deuteranopia'}
              >
                <div style={{ fontSize: '20px' }} className="mb-3">🟢</div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: colors.textPrimary }}>{t('settingsScreen.deuteranopia')}</p>
                <p className="text-xs" style={{ color: colors.textTertiary }}>{t('settingsScreen.deuteranopiaDesc')}</p>
              </button>

              <button
                onClick={() => setColorBlindMode('tritanopia')}
                className="p-5 rounded-2xl text-left transition-all"
                style={{
                  background: colorBlindMode === 'tritanopia' 
                    ? 'rgba(59,130,246,0.1)' 
                    : colors.cardBackgroundTransparent,
                  border: colorBlindMode === 'tritanopia' 
                    ? '2px solid #3b82f6' 
                    : `2px solid ${colors.cardBorderTransparent}`,
                }}
                aria-label="Mavi renk körlüğü"
                aria-pressed={colorBlindMode === 'tritanopia'}
              >
                <div style={{ fontSize: '20px' }} className="mb-3">🔵</div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: colors.textPrimary }}>{t('settingsScreen.tritanopia')}</p>
                <p className="text-xs" style={{ color: colors.textTertiary }}>{t('settingsScreen.tritanopiaDesc')}</p>
              </button>
            </div>
          </div>

          {/* PERFORMANS (Android Only) */}
          {androidPlatform && (
            <div className="mb-8">
              <SectionHeader title={t('settingsScreen.performance')} />
              <p className="text-xs mb-4" style={{ color: colors.textTertiary }}>
                {t('settingsScreen.performanceNote')}
              </p>
              
              <div className="space-y-3">
                {/* FPS Limit Selection */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleFpsLimitChange(30)}
                    className="p-4 rounded-xl text-center transition-all"
                    style={{
                      background: fpsLimit === 30 
                        ? 'rgba(59,130,246,0.1)' 
                        : colors.cardBackgroundTransparent,
                      border: fpsLimit === 30 
                        ? '2px solid #3b82f6' 
                        : `2px solid ${colors.cardBorderTransparent}`,
                    }}
                    aria-label="30 FPS seç"
                    aria-pressed={fpsLimit === 30}
                  >
                    <p className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>30</p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>FPS</p>
                  </button>
                  
                  <button
                    onClick={() => handleFpsLimitChange(60)}
                    className="p-4 rounded-xl text-center transition-all"
                    style={{
                      background: fpsLimit === 60 
                        ? 'rgba(59,130,246,0.1)' 
                        : colors.cardBackgroundTransparent,
                      border: fpsLimit === 60 
                        ? '2px solid #3b82f6' 
                        : `2px solid ${colors.cardBorderTransparent}`,
                    }}
                    aria-label="60 FPS seç"
                    aria-pressed={fpsLimit === 60}
                  >
                    <p className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>60</p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>FPS</p>
                  </button>
                  
                  <button
                    onClick={() => handleFpsLimitChange('auto')}
                    className="p-4 rounded-xl text-center transition-all"
                    style={{
                      background: fpsLimit === 'auto' 
                        ? 'rgba(59,130,246,0.1)' 
                        : colors.cardBackgroundTransparent,
                      border: fpsLimit === 'auto' 
                        ? '2px solid #3b82f6' 
                        : `2px solid ${colors.cardBorderTransparent}`,
                    }}
                    aria-label="Otomatik FPS seç"
                    aria-pressed={fpsLimit === 'auto'}
                  >
                    <p className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>Auto</p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>Otomatik</p>
                  </button>
                </div>

                {/* Current FPS Display */}
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: colors.cardBackgroundTransparent,
                    border: `2px solid ${colors.cardBorderTransparent}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: colors.textPrimary }}>
                        {t('settingsScreen.currentFPS')}
                      </p>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                        {t('settingsScreen.currentFPSDesc')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
                        {Math.round(metrics.currentFPS)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DEBUG MODU (Android Only) */}
          {androidPlatform && (
            <div className="mb-8">
              <SectionHeader title={t('settingsScreen.debugMode')} />
              
              <div className="space-y-3">
                {/* Debug Mode Toggle */}
                <ToggleSwitch
                  label={t('settingsScreen.debugModeToggle')}
                  description={t('settingsScreen.debugModeDesc')}
                  value={debugMode}
                  onChange={setDebugMode}
                />

                {/* Test Notification Button */}
                <button
                  onClick={async () => {
                    try {
                      const { scheduleLocalNotification } = await import('../services/notifications/pushNotificationService');
                      await scheduleLocalNotification({
                        title: 'Test Bildirimi',
                        body: 'Bu bir test bildirimidir. Bildirimler çalışıyor! 🎮',
                        id: Date.now(),
                        schedule: { at: new Date(Date.now() + 2000) } // 2 saniye sonra
                      });
                      alert('Test bildirimi 2 saniye içinde gösterilecek!');
                    } catch (error) {
                      console.error('Test notification failed:', error);
                      alert('Bildirim gönderilemedi: ' + error);
                    }
                  }}
                  className="w-full p-5 rounded-2xl transition-all"
                  style={{
                    background: 'rgba(34,197,94,0.1)',
                    border: '2px solid rgba(34,197,94,0.3)',
                  }}
                  aria-label="Test bildirimi gönder"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔔</span>
                      <div className="text-left">
                        <p className="text-sm font-semibold mb-0.5" style={{ color: colors.textPrimary }}>
                          Test Bildirimi
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          Bildirim sistemini test et
                        </p>
                      </div>
                    </div>
                  </div>
                </button>

                {/* FPS Counter Display (when debug mode active) */}
                {debugMode && (
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(168,85,247,0.1)',
                      border: '2px solid rgba(168,85,247,0.3)',
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{t('settingsScreen.averageFPS')}</p>
                        <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                          {Math.round(metrics.averageFPS)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{t('settingsScreen.minFPS')}</p>
                        <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                          {Math.round(metrics.minFPS)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{t('settingsScreen.maxFPS')}</p>
                        <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                          {Math.round(metrics.maxFPS)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{t('settingsScreen.batterySavings')}</p>
                        <p className="text-sm font-bold" style={{ color: '#22c55e' }}>
                          ~{Math.round(metrics.estimatedBatterySavings)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Export Metrics Button */}
                <button
                  onClick={handleExportMetrics}
                  disabled={exportStatus === 'exporting'}
                  className="w-full p-5 rounded-2xl transition-all"
                  style={{
                    background: exportStatus === 'success' 
                      ? 'rgba(34,197,94,0.1)' 
                      : exportStatus === 'error'
                      ? 'rgba(239,68,68,0.1)'
                      : 'rgba(168,85,247,0.1)',
                    border: exportStatus === 'success'
                      ? '2px solid rgba(34,197,94,0.3)'
                      : exportStatus === 'error'
                      ? '2px solid rgba(239,68,68,0.3)'
                      : '2px solid rgba(168,85,247,0.3)',
                    opacity: exportStatus === 'exporting' ? 0.6 : 1,
                  }}
                  aria-label="Performans metriklerini dışa aktar"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {exportStatus === 'exporting' ? '⏳' : exportStatus === 'success' ? '✅' : exportStatus === 'error' ? '❌' : '📊'}
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-semibold mb-0.5" style={{ color: colors.textPrimary }}>
                          {exportStatus === 'exporting' 
                            ? 'Exporting...' 
                            : exportStatus === 'success'
                            ? 'Exported!'
                            : exportStatus === 'error'
                            ? 'Export Failed'
                            : t('settingsScreen.exportMetrics')}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {exportStatus === 'idle' && t('settingsScreen.exportMetricsDesc')}
                          {exportStatus === 'exporting' && 'Preparing metrics data...'}
                          {exportStatus === 'success' && 'Metrics exported successfully!'}
                          {exportStatus === 'error' && 'Failed to export. Check console.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

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
