import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  pageKey: string;
}

// Detect if device is weak (low-end)
const isWeakDevice = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  
  // PRIORITY 1: Check User Agent for known weak devices (most reliable)
  const isKnownWeakDevice = 
    ua.includes('sm-j') ||      // Samsung J series (budget)
    ua.includes('sm-a') ||      // Samsung A series (budget)
    ua.includes('sm-g5') ||     // Samsung G5xx series (GM510, etc.)
    ua.includes('sm-g6') ||     // Samsung G6xx series
    ua.includes('sm-g7') ||     // Samsung G7xx series
    ua.includes('redmi') ||     // Xiaomi Redmi (budget)
    ua.includes('poco') ||      // Xiaomi Poco (budget)
    ua.includes('moto e') ||    // Motorola E (budget)
    ua.includes('moto g') ||    // Motorola G (budget)
    ua.includes('android 6') || // Old Android
    ua.includes('android 7') ||
    ua.includes('android 8') ||
    ua.includes('android 9');
  
  // PRIORITY 2: Check RAM (4GB or less = weak for games)
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const hasLowRAM = deviceMemory <= 4;
  
  // Combine checks: Known weak device OR low RAM = weak
  return isKnownWeakDevice || hasLowRAM;
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, pageKey }) => {
  const isGameScreen = pageKey === 'game';
  const skipAnimations = isWeakDevice();

  // Game screen should appear immediately. The old full-screen curtain made the
  // menu-to-game flow feel like two separate transitions.
  if (isGameScreen) {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        {children}
      </div>
    );
  }
  
  // Regular transition for menu screens
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={skipAnimations ? {} : { opacity: 0, scale: 0.95, y: 20 }}
        animate={skipAnimations ? {} : { opacity: 1, scale: 1, y: 0 }}
        exit={skipAnimations ? {} : { opacity: 0, scale: 0.95, y: -20 }}
        transition={skipAnimations ? { duration: 0 } : {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
