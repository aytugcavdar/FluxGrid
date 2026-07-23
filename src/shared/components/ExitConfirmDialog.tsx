import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface ExitConfirmDialogProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ExitConfirmDialog: React.FC<ExitConfirmDialogProps> = React.memo(({
  isVisible,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
              className="relative w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Card */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                {/* Warning icon */}
                <div className="flex justify-center pt-6 pb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                      delay: 0.1,
                    }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{
                        rotate: [0, -10, 10, -10, 10, 0],
                      }}
                      transition={{
                        duration: 0.5,
                        delay: 0.3,
                      }}
                      className="text-4xl"
                    >
                      ⚠️
                    </motion.div>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {t('game.exitTitle')}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {t('game.confirmExit')}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 px-6 pb-6">
                  {/* Cancel button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-colors"
                  >
                    {t('common.cancel')}
                  </motion.button>

                  {/* Confirm button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onConfirm}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all"
                  >
                    {t('common.exit')}
                  </motion.button>
                </div>
              </div>

              {/* Glow effect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 -z-10 blur-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl"
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});
