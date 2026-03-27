import { useEffect, useState } from 'react';
import { useLeaderboardStore } from '../store/leaderboardStore';
import { useAuthStore } from '../../auth';
import { GameMode } from '@shared/types';
import type { LeaderboardEntry } from '../types';

interface LeaderboardViewProps {
  mode: GameMode;
}

type TabType = 'rankings' | 'stats';

const MODE_CONFIG = [
  { mode: GameMode.ENDLESS, icon: '∞', label: 'Sonsuz' },
  { mode: GameMode.TIMED, icon: '⚡', label: 'Rush' },
  { mode: GameMode.DAILY_CHALLENGE, icon: '📅', label: 'Günlük' },
  { mode: GameMode.ZEN, icon: '☁️', label: 'Zen' },
];

const TAB_CONFIG = [
  { id: 'rankings' as TabType, label: 'Sıralama', icon: '🏆' },
  { id: 'stats' as TabType, label: 'İstatistikler', icon: '📊' },
];

export function LeaderboardView({ mode: initialMode }: LeaderboardViewProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>(initialMode);
  const [activeTab, setActiveTab] = useState<TabType>('rankings');

  const { user } = useAuthStore();
  
  // If no user, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold mb-2">Sıralamayı Görmek İçin Giriş Yap</h2>
            <p className="text-gray-400 mb-6">
              Skorunu kaydet, sıralamada yerini al ve diğer oyuncularla yarış!
            </p>
            <button
              onClick={() => useAuthStore.getState().signInWithGoogle()}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google ile Giriş Yap
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    leaderboards,
    userRanks,
    isLoading,
    error,
    hasMore,
    fetchLeaderboard,
    fetchUserRank,
    loadMore,
  } = useLeaderboardStore();

  const entries = leaderboards.get(selectedMode) || [];
  const userRank = userRanks.get(selectedMode);

  const totalPlayers = entries.length;
  const percentile = userRank && typeof userRank === 'number' && totalPlayers > 0
    ? (userRank / totalPlayers) * 100
    : 0;

  useEffect(() => {
    // Clear previous mode data when switching modes
    const { leaderboards } = useLeaderboardStore.getState();
    leaderboards.delete(selectedMode);
    
    fetchLeaderboard(selectedMode);
    
    // Only fetch user rank if user is authenticated (not anonymous)
    if (user && !user.isAnonymous) {
      fetchUserRank(user.uid, selectedMode);
    }
  }, [selectedMode, user, fetchLeaderboard, fetchUserRank]);

  const handleModeChange = (mode: GameMode) => {
    setSelectedMode(mode);
    setActiveTab('rankings');
  };

  const handleLoadMore = () => {
    loadMore(selectedMode);
  };

  if (isLoading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center p-12 bg-red-900/20 border border-red-500/50 rounded-lg">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-red-400 mb-2">Hata</h3>
            <p className="text-red-300 text-center">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 mb-6">
          {MODE_CONFIG.map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
                selectedMode === mode
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span className="text-2xl">{icon}</span>
              <div className="text-sm mt-1">{label}</div>
            </button>
          ))}
        </div>

        {/* Anonymous User Prompt - Requirement 5.2, 5.3, 5.4 */}
        {user?.isAnonymous && (
          <div className="mb-6 p-6 bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔒</span>
                <div>
                  <div className="text-lg font-bold text-yellow-200">
                    Giriş yap → sıralanmaya başla
                  </div>
                  <div className="text-sm text-yellow-300/80">
                    Skorlarını kaydet ve liderlik tablosunda yerini gör
                  </div>
                </div>
              </div>
              <button
                onClick={() => useAuthStore.getState().signInWithGoogle()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
              >
                Giriş Yap
              </button>
            </div>
          </div>
        )}

        {/* Authenticated User Rank Display - Requirement 5.1 */}
        {user && !user.isAnonymous && userRank && typeof userRank === 'number' && (
          <div className="mb-6 p-6 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-cyan-300 mb-1">Sıran</div>
                <div className="text-5xl font-bold text-cyan-400">#{userRank}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-cyan-300 mb-1">Yüzdelik</div>
                <div className="text-2xl font-bold text-cyan-400">Üst %{percentile.toFixed(1)}</div>
                <div className="text-xs text-gray-400 mt-1">{totalPlayers} oyuncudan</div>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                style={{ width: `${Math.min(100, 100 - percentile)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4 border-b border-gray-800">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-bold transition-all ${
                activeTab === tab.id
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'rankings' && (
          <>
            {!isLoading && entries.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 bg-gray-900 rounded-lg">
                <div className="text-6xl mb-4">
                  {MODE_CONFIG.find(m => m.mode === selectedMode)?.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-300 mb-2">Bu modda henüz oynamadın</h3>
                <p className="text-gray-500 text-center mb-6">İlk skorunu kaydet ve sıralamaya gir!</p>
              </div>
            )}

            {entries.length > 0 && (
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                {entries.map((entry) => {
                  const isCurrentUser = entry.uid === user?.uid;
                  return (
                    <div
                      key={entry.uid}
                      className={`flex items-center p-4 border-b border-gray-800 transition-colors ${
                        isCurrentUser ? 'bg-cyan-950/20 border-l-2 border-cyan-400' : 'hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="w-16 text-center">
                        <div
                          className={`text-xl font-bold ${
                            entry.rank === 1 ? 'text-yellow-400' :
                            entry.rank === 2 ? 'text-gray-300' :
                            entry.rank === 3 ? 'text-orange-400' : 'text-gray-500'
                          }`}
                        >
                          #{entry.rank}
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                        {entry.photoURL ? (
                          <img src={entry.photoURL} alt={entry.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-cyan-400 font-bold text-lg">
                            {entry.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 ml-4">
                        <div className="text-base text-gray-200">{entry.displayName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-cyan-400">{entry.score.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {hasMore && entries.length > 0 && (
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="w-full mt-4 py-3 bg-gray-800 text-cyan-400 font-bold rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
              </button>
            )}
          </>
        )}

        {activeTab === 'stats' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">İstatistikler</h3>
            <p className="text-gray-400">İstatistikler yakında eklenecek...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeaderboardView;
