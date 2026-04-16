/**
 * Update Dialog Component
 * 
 * Shows update dialog when app version is below minimum or latest version.
 * 
 * Requirements: Task 19.2, Requirement 15.7, 15.8
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { UpdateDialogConfig } from '../../services/version/versionChecker';

interface UpdateDialogProps {
  isVisible: boolean;
  config: UpdateDialogConfig;
  onUpdate: () => void;
  onDismiss?: () => void;
}

export const UpdateDialog: React.FC<UpdateDialogProps> = ({
  isVisible,
  config,
  onUpdate,
  onDismiss
}) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={config.canDismiss ? onDismiss : undefined}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-800 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full"
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-3 text-center">
              {config.title}
            </h2>

            {/* Message */}
            <p className="text-gray-300 text-center mb-6 leading-relaxed">
              {config.message}
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={onUpdate}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all active:scale-95"
              >
                {t('update.button', 'Update Now')}
              </button>

              {config.canDismiss && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold transition-all active:scale-95"
                >
                  {t('update.later', 'Maybe Later')}
                </button>
              )}
            </div>

            {/* Warning for forced updates */}
            {!config.canDismiss && (
              <p className="text-xs text-gray-500 text-center mt-4">
                {t('update.required', 'This update is required to continue using the app')}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
