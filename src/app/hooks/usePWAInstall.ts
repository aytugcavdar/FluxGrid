import { useEffect, useRef, useState } from 'react';

interface PWAInstallReturn {
  showPWAPrompt: boolean;
  isIOS: boolean;
  showIOSInstructions: boolean;
  setShowIOSInstructions: (v: boolean) => void;
  triggerInstall: () => Promise<void>;
}

export function usePWAInstall(isGameOver: boolean, score: number): PWAInstallReturn {
  const deferredPromptRef = useRef<any>(null);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // PWA Install Prompt - Capture beforeinstallprompt event
  useEffect(() => {
    // Check if already installed
    const pwaInstalled = localStorage.getItem('pwa_installed') === 'true';
    if (pwaInstalled) return;

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // For iOS, check if already in standalone mode
    if (isIOSDevice) {
      const isStandalone = (navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone) {
        localStorage.setItem('pwa_installed', 'true');
        return;
      }
    }

    // For non-iOS, capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      console.log('PWA install prompt captured');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Show PWA prompt on game over with good score
  useEffect(() => {
    if (isGameOver && score > 1000) {
      const pwaInstalled = localStorage.getItem('pwa_installed') === 'true';
      const iosInstructionsShown = localStorage.getItem('ios_pwa_instructions_shown') === 'true';
      
      if (!pwaInstalled) {
        if (isIOS && !iosInstructionsShown) {
          // Show iOS instructions once
          setTimeout(() => setShowIOSInstructions(true), 1500);
        } else if (deferredPromptRef.current) {
          // Show PWA install button for non-iOS
          setTimeout(() => setShowPWAPrompt(true), 1500);
        }
      }
    } else {
      setShowPWAPrompt(false);
      setShowIOSInstructions(false);
    }
  }, [isGameOver, score, isIOS]);

  const triggerInstall = async () => {
    if (!deferredPromptRef.current) return;
    
    deferredPromptRef.current.prompt();
    const { outcome } = await deferredPromptRef.current.userChoice;
    
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_installed', 'true');
      setShowPWAPrompt(false);
    }
    
    deferredPromptRef.current = null;
  };

  return {
    showPWAPrompt,
    isIOS,
    showIOSInstructions,
    setShowIOSInstructions,
    triggerInstall,
  };
}
