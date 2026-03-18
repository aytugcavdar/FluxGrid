import { useEffect, useState } from 'react';
import { useLeaderboardStore } from '../store/leaderboardStore';
import { useAuthStore } from '../../auth';
import type { GameMode, LeaderboardEntry } from '../types';

interface LeaderboardViewProps {
  mode: GameMode;
}

export function LeaderboardView({ mode }: LeaderboardViewProps) {
  const { user } = useAuthStore();
  const {
    leaderboards,
    userRanks,
    userPercentiles,
    isLoading,
    error,
    fetchLeaderboard,
    fetchUserRank,
    getNearbyCompetitors,
  } = useLeaderboardStore();

  const [nearbyCompetitors, setNearbyCompetitors] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetchLeaderboard(mode);
    
    if (user) {
      fetchUserRank(user.uid, mode);
      getNearbyCompetitors(user.uid, mode).then(setNearbyCompetitors);
    }
  }, [mode, user]);

  const entries = leaderboards.get(mode) || [];
  const userRank = userRanks.get(mode);
  const userPercentile = userPercentiles.get(mode);

  if (isLoading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  // Empty state when no entries
  if (!isLoading && entries.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold mb-2">Henüz skor yok</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
            Bu modda henüz kimse skor göndermemiş. İlk sen ol!
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            Oyuna Başla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* User Stats Header */}
      {user && userRank && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">Your Rank</div>
              <div className="text-3xl font-bold">#{userRank}</div>
            </div>
            {userPercentile !== undefined && (
              <div className="text-right">
                <div className="text-sm opacity-90">Percentile</div>
                <div className="text-3xl font-bold">Top {userPercentile.toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top 100 Leaderboard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 border-b">
          <h2 className="text-xl font-bold">Top 100 - {mode.toUpperCase()}</h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {entries.map((entry) => (
            <div
              key={entry.uid}
              className={`flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                entry.uid === user?.uid ? 'bg-blue-50 dark:bg-blue-900/20 font-bold' : ''
              }`}
            >
              {/* Rank */}
              <div className="w-16 text-center">
                <div
                  className={`text-lg font-bold ${
                    entry.rank === 1
                      ? 'text-yellow-500'
                      : entry.rank === 2
                      ? 'text-gray-400'
                      : entry.rank === 3
                      ? 'text-orange-600'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  #{entry.rank}
                </div>
              </div>

              {/* Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                {entry.photoURL ? (
                  <img src={entry.photoURL} alt={entry.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    {entry.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 ml-4">
                <div className="text-base">{entry.displayName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{entry.platform}</div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-xl font-bold">{entry.score.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby Competitors */}
      {nearbyCompetitors.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 border-b">
            <h3 className="text-lg font-bold">Nearby Competitors</h3>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {nearbyCompetitors.map((entry) => (
              <div
                key={entry.uid}
                className={`flex items-center p-3 ${
                  entry.uid === user?.uid ? 'bg-blue-50 dark:bg-blue-900/20 font-bold' : ''
                }`}
              >
                <div className="w-12 text-center text-sm font-bold">#{entry.rank}</div>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                  {entry.photoURL ? (
                    <img src={entry.photoURL} alt={entry.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm">
                      {entry.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 ml-3 text-sm">{entry.displayName}</div>
                <div className="text-base font-bold">{entry.score.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
