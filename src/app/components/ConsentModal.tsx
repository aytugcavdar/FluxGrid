import React from 'react';

interface ConsentModalProps {
  onConsent: (consentType: 'personalized' | 'non-personalized') => void;
}

/**
 * GDPR Consent Modal
 * 
 * Displays consent options for personalized vs non-personalized ads
 * Required for EEA users per GDPR regulations
 */
export const ConsentModal: React.FC<ConsentModalProps> = ({ onConsent }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-4">
          Reklam Tercihleri
        </h2>
        
        <p className="text-gray-300 mb-6 text-sm leading-relaxed">
          Oyunumuzu ücretsiz sunabilmek için reklamlar gösteriyoruz. 
          Lütfen reklam tercihlerinizi seçin:
        </p>
        
        <div className="space-y-3 mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">
              Kişiselleştirilmiş Reklamlar
            </h3>
            <p className="text-gray-400 text-xs mb-3">
              İlgi alanlarınıza göre özelleştirilmiş reklamlar gösterilir. 
              Daha alakalı içerik için verileriniz kullanılır.
            </p>
            <button
              onClick={() => onConsent('personalized')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Kişiselleştirilmiş Reklamları Kabul Et
            </button>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">
              Kişiselleştirilmemiş Reklamlar
            </h3>
            <p className="text-gray-400 text-xs mb-3">
              Genel reklamlar gösterilir. Verileriniz reklam kişiselleştirmesi 
              için kullanılmaz.
            </p>
            <button
              onClick={() => onConsent('non-personalized')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Kişiselleştirilmemiş Reklamları Kabul Et
            </button>
          </div>
        </div>
        
        <p className="text-gray-500 text-xs text-center">
          Tercihinizi istediğiniz zaman ayarlardan değiştirebilirsiniz.
        </p>
      </div>
    </div>
  );
};
