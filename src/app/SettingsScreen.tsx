import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../shared/store/settingsStore';
import { useThemeStore, ThemeType } from '../shared/store/themeStore';
import { useGameStore } from '../features/game/store/gameStore';
import { useTutorialStore } from '../shared/store/tutorialStore';
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
    hapticEnabled,
    ghostBlockEnabled,
    performanceModeEnabled,
    language,
    setSoundEnabled,
    setHapticEnabled,
    setGhostBlockEnabled,
    setPerformanceModeEnabled,
    setLanguage,
    exportData,
    resetAllData,
  } = useSettingsStore();

  const { currentTheme, setTheme, getThemeColors } = useThemeStore();
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
  
  const handleLanguageChange = (lang: 'tr' | 'en') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
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
      // Fallback: show instructions anyway
      alert('Bu tarayıcıda otomatik yükleme desteklenmiyor. Tarayıcı menüsünden "Ana ekrana ekle" seçeneğini kullanabilirsiniz.');
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
    { theme: 'dark', label: 'Koyu', colors: ['#3b82f6', '#a855f7', '#f59e0b'] },
    { theme: 'light', label: 'Açık', colors: ['#60a5fa', '#c084fc', '#fbbf24'] },
    { theme: 'neon', label: 'Neon', colors: ['#e879f9', '#06b6d4', '#a78bfa'] },
    { theme: 'ocean', label: 'Okyanus', colors: ['#38bdf8', '#22d3ee', '#7dd3fc'] },
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
      'Tüm verileriniz silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?'
    );
    
    if (confirmed) {
      resetAllData();
      alert('Tüm veriler başarıyla sıfırlandı.');
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
      style={{ background: colors.background }}
    >
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="w-full max-w-[448px] mx-auto">
          {/* GÖRÜNÜM Section */}
          <div className="mb-8">
            <SectionHeader title="GÖRÜNÜM" />
            
            <div className="grid grid-cols-2 gap-3">
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
                    {theme === 'dark' && 'Varsayılan tema'}
                    {theme === 'light' && 'Aydınlık mod'}
                    {theme === 'neon' && 'Canlı renkler'}
                    {theme === 'ocean' && 'Sakin tonlar'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* SES VE TİTREŞİM Section */}
          <div className="mb-8">
            <SectionHeader title="SES VE TİTREŞİM" />
            
            <div className="space-y-3">
              <ToggleSwitch
                label="Ses Efektleri"
                description="Oyun içi sesler"
                value={soundEnabled}
                onChange={setSoundEnabled}
              />
              
              <ToggleSwitch
                label="Titreşim"
                description="Haptik geri bildirim"
                value={hapticEnabled}
                onChange={setHapticEnabled}
              />
            </div>
          </div>

          {/* DİL Section */}
          <div className="mb-8">
            <SectionHeader title="DİL" />
            <p className="text-xs mb-4" style={{ color: colors.textTertiary }}>
              Dil ayarı sadece oyun içinde geçerlidir
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
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Türkçe</p>
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
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>English</p>
              </button>
            </div>
          </div>

          {/* OYUN Section */}
          <div className="mb-8">
            <SectionHeader title="OYUN" />
            
            <div className="space-y-3">
              <ToggleSwitch
                label="Hayalet Blok"
                description="Yerleşim önizlemesi"
                value={ghostBlockEnabled}
                onChange={setGhostBlockEnabled}
              />
              
              <ToggleSwitch
                label="Performans Modu"
                description="Animasyonları azalt"
                value={performanceModeEnabled}
                onChange={setPerformanceModeEnabled}
              />
              
              {/* Export Button - Styled as Action Button */}
              <button
                onClick={handleExport}
                disabled={exportStatus === 'exporting'}
                className="w-full p-5 rounded-2xl transition-all"
                style={{
                  background: 'rgba(59,130,246,0.1)',
                  border: '2px solid rgba(59,130,246,0.3)',
                  opacity: exportStatus === 'exporting' ? 0.5 : 1,
                }}
                aria-label="Veriyi dışa aktar"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {exportStatus === 'exporting' && '⏳'}
                      {exportStatus === 'success' && '✅'}
                      {exportStatus === 'error' && '❌'}
                      {exportStatus === 'idle' && '📤'}
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-semibold mb-0.5" style={{ color: colors.textPrimary }}>
                        Veriyi Dışa Aktar
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>JSON formatında</p>
                    </div>
                  </div>
                </div>
              </button>
              
              {/* Tutorial Replay Button */}
              <button
                onClick={handleReplayTutorial}
                className="w-full p-5 rounded-2xl transition-all"
                style={{
                  background: 'rgba(168,85,247,0.1)',
                  border: '2px solid rgba(168,85,247,0.3)',
                }}
                aria-label={t('settings.replayTutorial')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎓</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold mb-0.5" style={{ color: colors.textPrimary }}>
                        {t('settings.replayTutorial')}
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>İlk oyun deneyimini tekrarla</p>
                    </div>
                  </div>
                </div>
              </button>

              {/* PWA Install Button - Always visible */}
              {!isPWAInstalled && (
                <div
                  onClick={handleInstallPWA}
                  className="w-full p-5 rounded-2xl transition-all cursor-pointer"
                  style={{
                    background: 'rgba(34,197,94,0.1)',
                    border: '2px solid rgba(34,197,94,0.3)',
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleInstallPWA();
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📱</span>
                      <div className="text-left">
                        <p className="text-sm font-semibold mb-0.5" style={{ color: colors.textPrimary }}>
                          Uygulamayı Yükle
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {isIOS ? 'Ana ekrana ekle' : 'Cihazına indir'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isPWAInstalled && (
                <div
                  className="w-full p-5 rounded-2xl"
                  style={{
                    background: 'rgba(34,197,94,0.1)',
                    border: '2px solid rgba(34,197,94,0.3)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold mb-0.5" style={{ color: colors.textPrimary }}>
                        Uygulama Yüklü
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        Ana ekrandan erişebilirsin
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TEHLİKE BÖLGESİ Section */}
          <div className="mb-8">
            <SectionHeader title="TEHLİKE BÖLGESİ" dividerColor="rgba(239,68,68,0.15)" />
            
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
                <p className="text-sm font-bold text-red-500">Tüm Verileri Sıfırla</p>
              </div>
            </button>
          </div>

          {/* Version Footer */}
          <div className="text-center py-6">
            <p className="text-xs" style={{ color: colors.textTertiary }}>FluxGrid v18.0</p>
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
              Ana Ekrana Ekle
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">1️⃣</span>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Safari'de <strong>Paylaş</strong> butonuna dokun (⬆️)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">2️⃣</span>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  <strong>"Ana Ekrana Ekle"</strong> seçeneğini bul
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">3️⃣</span>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  <strong>"Ekle"</strong> butonuna dokun
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowIOSInstructions(false);
                localStorage.setItem('ios_pwa_instructions_shown', 'true');
              }}
              className="w-full py-3 rounded-xl font-bold transition-all"
              style={{
                background: '#3b82f6',
                color: 'white',
              }}
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
