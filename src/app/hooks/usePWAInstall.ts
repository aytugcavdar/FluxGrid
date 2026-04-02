import { useEffect, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallReturn {
  showPWAPrompt: boolean;
  isIOS: boolean;
  showIOSInstructions: boolean;
  setShowIOSInstructions: (v: boolean) => void;
  triggerInstall: () => Promise<void>;
}

export function usePWAInstall(isGameOver: boolean, score: number): PWAInstallReturn {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
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
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      console.log('PWA install prompt captured');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Show PWA prompt on first game over or after good score
  useEffect(() => {
    if (isGameOver) {
      const pwaInstalled = localStorage.getItem('pwa_installed') === 'true';
      const pwaPromptShown = localStorage.getItem('pwa_prompt_shown') === 'true';
      const iosInstructionsShown = localStorage.getItem('ios_pwa_instructions_shown') === 'true';
      
      if (!pwaInstalled) {
        // Show on first game over OR when score > 1000
        const shouldShow = !pwaPromptShown || score > 1000;
        
        if (shouldShow) {
          if (isIOS && !iosInstructionsShown) {
            // Show iOS instructions
            setTimeout(() => {
              setShowIOSInstructions(true);
              localStorage.setItem('pwa_prompt_shown', 'true');
            }, 1500);
          } else if (deferredPromptRef.current) {
            // Show PWA install button for non-iOS
            setTimeout(() => {
              setShowPWAPrompt(true);
              localStorage.setItem('pwa_prompt_shown', 'true');
            }, 1500);
          }
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
