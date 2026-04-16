/**
 * Consent Modal Component
 * 
 * GDPR consent form shown to EEA users on first launch or when consent
 * version changes. Provides options for personalized and non-personalized ads.
 * 
 * Requirements: 1.3, 1.5, 1.7
 */

import { useState } from 'react';
import { ConsentType } from '@services/gdpr';

export interface ConsentModalProps {
  onConsent: (consentType: ConsentType) => void | Promise<void>;
  privacyPolicyUrl?: string;
}

export function ConsentModal({
  onConsent,
  privacyPolicyUrl = 'https://fluxgrid.app/privacy',
}: ConsentModalProps) {
  const [selectedConsent, setSelectedConsent] = useState<ConsentType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedConsent) return;

    setIsSubmitting(true);
    try {
      await onConsent(selectedConsent);
    } catch (error) {
      console.error('Error updating consent:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-800">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Gizlilik Tercihleri</h2>
          <p className="text-gray-400 text-sm">
            FluxGrid'i kullanmaya devam etmek için lütfen reklam tercihlerinizi seçin.
          </p>
        </div>

        {/* Consent Options */}
        <div className="space-y-3 mb-6">
          {/* Personalized Ads Option */}
          <button
            onClick={() => setSelectedConsent(ConsentType.PERSONALIZED)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              selectedConsent === ConsentType.PERSONALIZED
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Radio indicator */}
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedConsent === ConsentType.PERSONALIZED
                      ? 'border-blue-500'
                      : 'border-gray-600'
                  }`}
                >
                  {selectedConsent === ConsentType.PERSONALIZED && (
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Kişiselleştirilmiş Reklamlar</h3>
                <p className="text-gray-400 text-sm">
                  İlgi alanlarınıza uygun reklamlar gösterilir. Daha iyi bir deneyim için
                  verileriniz kullanılır.
                </p>
              </div>
            </div>
          </button>

          {/* Non-Personalized Ads Option */}
          <button
            onClick={() => setSelectedConsent(ConsentType.NON_PERSONALIZED)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              selectedConsent === ConsentType.NON_PERSONALIZED
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Radio indicator */}
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedConsent === ConsentType.NON_PERSONALIZED
                      ? 'border-blue-500'
                      : 'border-gray-600'
                  }`}
                >
                  {selectedConsent === ConsentType.NON_PERSONALIZED && (
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">
                  Kişiselleştirilmemiş Reklamlar
                </h3>
                <p className="text-gray-400 text-sm">
                  Genel reklamlar gösterilir. Kişisel verileriniz reklam için kullanılmaz.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Privacy Policy Link */}
        <div className="mb-6 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-gray-400 text-xs">
            Devam ederek{' '}
            <a
              href={privacyPolicyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Gizlilik Politikamızı
            </a>{' '}
            kabul etmiş olursunuz. Tercihlerinizi istediğiniz zaman ayarlardan değiştirebilirsiniz.
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedConsent || isSubmitting}
          className={`w-full px-6 py-3 rounded-xl font-medium transition-all ${
            selectedConsent && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Devam Et'}
        </button>
      </div>
    </div>
  );
}
