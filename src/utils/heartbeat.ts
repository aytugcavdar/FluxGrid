import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '../services/firebase/config';
import { detectPlatform } from '../services/firebase/types';

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

export function startHeartbeat(uid: string): void {
  stopHeartbeat();
  
  // Hemen bir kere güncelle
  updateLastSeen(uid);
  
  // Her 2 dakikada bir güncelle
  heartbeatTimer = setInterval(() => {
    updateLastSeen(uid);
  }, 2 * 60 * 1000);
}

export function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

async function updateLastSeen(uid: string): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const platform = detectPlatform();
    const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
    const tokenHash = 'web_' + uid.substring(0, 8); // web için basit hash
    
    await updateDoc(doc(db, 'users', uid), {
      lastSeenAt: Date.now(),
      lastPlatform: platform,
      lastAppVersion: appVersion,
      [`devices.${tokenHash}`]: {
        token: tokenHash,
        platform,
        appVersion,
        lastSeenAt: Date.now(),
      },
    });
  } catch {
    // Sessizce geç — heartbeat kritik değil
  }
}
