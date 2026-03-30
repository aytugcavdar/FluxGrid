import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../shared/store/settingsStore';
import { useThemeStore, ThemeType } from '../shared/store/themeStore';
import { ToggleSwitch, SectionHeader } from '../shared/components';

export const SettingsScreen: React.FC = () => {
  const { i18n } = useTranslation();
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
  const colors = getThemeColors();
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  
  const handleLanguageChange = (lang: 'tr' | 'en') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
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
    </div>
  );
};
