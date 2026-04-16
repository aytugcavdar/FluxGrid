/**
 * Error Recovery UI Components
 * 
 * Provides user-facing error messages and recovery options for different
 * error scenarios. Supports localization and accessibility.
 * 
 * Requirements: 2.6, 10.8, 10.9
 */

import { ReactNode } from 'react';
import { ErrorCategory, ErrorSeverity } from '@/src/utils/managers/errorHandler';

export interface ErrorRecoveryProps {
  error: Error;
  category: ErrorCategory;
  severity: ErrorSeverity;
  onRetry?: () => void;
  onDismiss?: () => void;
  onReload?: () => void;
}

/**
 * Get user-friendly error message based on category
 */
export function getErrorMessage(category: ErrorCategory): {
  title: string;
  message: string;
  icon: ReactNode;
} {
  const messages = {
    [ErrorCategory.STORAGE]: {
      title: 'Veri Hatası',
      message: 'Verileriniz kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
          />
        </svg>
      ),
    },
    [ErrorCategory.GAME_STATE]: {
      title: 'Oyun Hatası',
      message: 'Oyun durumu bozuldu. Oyun yeniden başlatılacak.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    [ErrorCategory.NETWORK]: {
      title: 'Bağlantı Hatası',
      message: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
      ),
    },
    [ErrorCategory.RENDER]: {
      title: 'Görüntüleme Hatası',
      message: 'Ekran görüntülenirken bir sorun oluştu. Sayfa yenilenecek.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    [ErrorCategory.AUDIO]: {
      title: 'Ses Hatası',
      message: 'Ses çalınırken bir sorun oluştu. Ses devre dışı bırakıldı.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
          />
        </svg>
      ),
    },
    [ErrorCategory.VALIDATION]: {
      title: 'Doğrulama Hatası',
      message: 'Girdiğiniz bilgiler geçersiz. Lütfen kontrol edin.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    [ErrorCategory.UNKNOWN]: {
      title: 'Bilinmeyen Hata',
      message: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
  };

  return messages[category] || messages[ErrorCategory.UNKNOWN];
}

/**
 * Error Recovery Modal
 * Full-screen modal for critical errors
 */
export function ErrorRecoveryModal({
  error,
  category,
  severity,
  onRetry,
  onDismiss,
  onReload,
}: ErrorRecoveryProps) {
  const { title, message, icon } = getErrorMessage(category);
  const isCritical = severity === ErrorSeverity.CRITICAL;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-800">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isCritical ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'
            }`}
          >
            {icon}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white text-center mb-2">{title}</h2>

        {/* Message */}
        <p className="text-gray-400 text-center mb-6">{message}</p>

        {/* Error details (dev mode only) */}
        {import.meta.env.DEV && (
          <div className="mb-6 p-3 bg-gray-950 rounded-lg">
            <p className="text-xs text-gray-500 font-mono break-all">{error.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              Tekrar Dene
            </button>
          )}

          {onReload && (
            <button
              onClick={onReload}
              className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
            >
              Sayfayı Yenile
            </button>
          )}

          {onDismiss && !isCritical && (
            <button
              onClick={onDismiss}
              className="w-full px-6 py-3 bg-transparent hover:bg-gray-800 text-gray-400 rounded-xl font-medium transition-colors"
            >
              Kapat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Error Toast Notification
 * Non-intrusive notification for low/medium severity errors
 */
export function ErrorToast({
  error,
  category,
  onDismiss,
}: {
  error: Error;
  category: ErrorCategory;
  onDismiss?: () => void;
}) {
  const { title, message, icon } = getErrorMessage(category);

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50 animate-slide-up">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-4 border border-gray-800 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
          <p className="text-xs text-gray-400">{message}</p>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Inline Error Message
 * For form validation and inline errors
 */
export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
