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

        {user?.isAnonymous && (
          <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-yellow-200">Sıralamaya girmek için Google ile giriş yap</p>
              </div>
              <button
                onClick={() => useAuthStore.getState().signInWithGoogle()}
                className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors"
              >
                Giriş Yap
              </button>
            </div>
          </div>
        )}

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
