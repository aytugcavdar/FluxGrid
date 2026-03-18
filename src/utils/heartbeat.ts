import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '../services/firebase/config';

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
    await updateDoc(doc(db, 'users', uid), {
      lastSeenAt: Date.now(),
    });
  } catch {
    // Sessizce geç — heartbeat kritik değil
  }
}
