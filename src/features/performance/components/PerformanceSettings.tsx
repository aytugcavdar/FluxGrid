/**
 * Performance Settings Component
 * 
 * UI for managing performance settings
 */

import React from 'react';
import { useSettingsStore } from '../store/settingsStore';
import type { QualityPresetName } from '../types';

export const PerformanceSettings: React.FC = () => {
  const {
    qualityPreset,
    customSettings,
    deviceClassification,
    setQualityPreset,
    setCustomSetting,
    toggleAutoAdjust,
    autoAdjust
  } = useSettingsStore();
  
  const handlePresetChange = (preset: QualityPresetName) => {
    setQualityPreset(preset);
  };
  
  const handleCustomToggle = (setting: string, value: boolean) => {
    setCustomSetting(setting, value);
  };
  
  const isCustom = qualityPreset === 'custom';
  
  return (
    <div className="performance-settings">
      <div className="settings-section">
        <h3>Cihaz Sınıfı</h3>
        <div className="device-badge">
          {deviceClassification === 'high' && '🚀 Yüksek Performans'}
          {deviceClassification === 'medium' && '⚡ Orta Performans'}
          {deviceClassification === 'low' && '💡 Düşük Performans'}
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Kalite Ön Ayarı</h3>
        <div className="preset-selector">
          <button
            className={`preset-button ${qualityPreset === 'low' ? 'active' : ''}`}
            onClick={() => handlePresetChange('low')}
          >
            <div className="preset-title">Düşük</div>
            <div className="preset-desc">Maksimum performans</div>
          </button>
          
          <button
            className={`preset-button ${qualityPreset === 'medium' ? 'active' : ''}`}
            onClick={() => handlePresetChange('medium')}
          >
            <div className="preset-title">Orta</div>
            <div className="preset-desc">Dengeli</div>
          </button>
          
          <button
            className={`preset-button ${qualityPreset === 'high' ? 'active' : ''}`}
            onClick={() => handlePresetChange('high')}
          >
            <div className="preset-title">Yüksek</div>
            <div className="preset-desc">Maksimum kalite</div>
          </button>
          
          {isCustom && (
            <button className="preset-button active">
              <div className="preset-title">Özel</div>
              <div className="preset-desc">Manuel ayarlar</div>
            </button>
          )}
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Görsel Efektler</h3>
        <p className="section-desc">
          {isCustom ? 'Özel ayarlarınızı yapın' : 'Özel ayarlar için "Özel" ön ayarını seçin'}
        </p>
        
        <div className="toggle-list">
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Parçacıklar</span>
              <span className="toggle-impact">Etki: Orta</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={customSettings.particles}
                onChange={(e) => handleCustomToggle('particles', e.target.checked)}
                disabled={!isCustom}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Işıltı Efekti</span>
              <span className="toggle-impact">Etki: Yüksek</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={customSettings.glow}
                onChange={(e) => handleCustomToggle('glow', e.target.checked)}
                disabled={!isCustom}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Gölgeler</span>
              <span className="toggle-impact">Etki: Orta</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={customSettings.shadows}
                onChange={(e) => handleCustomToggle('shadows', e.target.checked)}
                disabled={!isCustom}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Ekran Sarsıntısı</span>
              <span className="toggle-impact">Etki: Düşük</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={customSettings.screenShake}
                onChange={(e) => handleCustomToggle('screenShake', e.target.checked)}
                disabled={!isCustom}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Uçan Skor Metni</span>
              <span className="toggle-impact">Etki: Düşük</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={customSettings.floatingText}
                onChange={(e) => handleCustomToggle('floatingText', e.target.checked)}
                disabled={!isCustom}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Otomatik Ayarlama</h3>
        <div className="toggle-item">
          <div className="toggle-info">
            <span className="toggle-label">Performans düştüğünde kaliteyi otomatik azalt</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={autoAdjust}
              onChange={toggleAutoAdjust}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <style>{`
        .performance-settings {
          padding: 20px;
          max-width: 600px;
        }
        
        .settings-section {
          margin-bottom: 32px;
        }
        
        .settings-section h3 {
          color: #00d4ff;
          font-size: 18px;
          margin: 0 0 16px 0;
        }
        
        .section-desc {
          color: #999;
          font-size: 14px;
          margin: 0 0 16px 0;
        }
        
        .device-badge {
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid #00d4ff;
          border-radius: 8px;
          padding: 12px 16px;
          color: #00d4ff;
          font-size: 16px;
          display: inline-block;
        }
        
        .preset-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }
        
        .preset-button {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid #333;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        
        .preset-button:hover {
          border-color: #00d4ff;
          background: rgba(0, 212, 255, 0.1);
        }
        
        .preset-button.active {
          border-color: #00d4ff;
          background: rgba(0, 212, 255, 0.2);
        }
        
        .preset-title {
          color: #fff;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .preset-desc {
          color: #999;
          font-size: 12px;
        }
        
        .toggle-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .toggle-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }
        
        .toggle-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .toggle-label {
          color: #fff;
          font-size: 14px;
        }
        
        .toggle-impact {
          color: #999;
          font-size: 12px;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #333;
          transition: 0.3s;
          border-radius: 24px;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
          background-color: #00d4ff;
        }
        
        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }
        
        input:disabled + .toggle-slider {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
