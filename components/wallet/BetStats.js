import { useState, useEffect } from 'react';
import { isAuthenticated } from '@/utils/auth';

function Tooltip({ content, visible, className = '' }) {
  if (!visible) return null;
  
  return (
    <div className={`absolute z-50 bg-gray-800/95 text-[11px] leading-tight text-gray-300 px-2.5 py-1.5 rounded-lg border border-gray-700/50 shadow-xl backdrop-blur-sm max-w-[180px] break-words ${className}`}>
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-800/95 rotate-45 border-t border-l border-gray-700/50"></div>
      {content}
    </div>
  );
}

function StatItem({ icon, value, label, tooltip, className = '' }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className={`relative flex items-center gap-2 group cursor-help ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`w-3.5 h-3.5 rounded-full ${icon.bg} flex items-center justify-center`}>
        <div className={`w-2 h-2 rounded-full ${icon.dot}`}></div>
      </div>
      <span className="text-white text-sm">{value}</span>
      <span className="text-gray-500 text-xs">{label}</span>
      <Tooltip 
        content={tooltip}
        visible={showTooltip}
        className="bottom-full left-0 mb-1.5"
      />
    </div>
  );
}

export default function BetStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsType, setStatsType] = useState('personal');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(`/api/bets/stats?type=${statsType}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch stats');
        setStats(data.stats);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [statsType]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900/90 rounded-xl p-4 animate-pulse space-y-3">
            {[...Array(2)].map((_, j) => (
              <div key={j} className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 bg-gray-800/50 rounded-full"></div>
                <div className="h-3 w-20 bg-gray-800/50 rounded"></div>
              </div>
            ))}
          </div>
        ))}
        <div className="bg-gray-900/90 rounded-xl p-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-800/50 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-6 w-32 bg-gray-800/50 rounded"></div>
              <div className="h-3 w-24 bg-gray-800/50 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) return null;

  return (
    <div className="space-y-4">
      {/* Stats Toggle */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setStatsType('personal')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              statsType === 'personal'
                ? 'bg-purple-500/20 text-purple-300'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setStatsType('global')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              statsType === 'global'
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Global
          </button>
        </div>
      </div>

      {/* Bet Activity Card */}
      <div className="bg-purple-600/10 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-purple-500/20 hover:border-purple-500/30 transition-all duration-200">
        <StatItem 
          icon={{ bg: 'bg-purple-500/20', dot: 'bg-purple-400' }}
          value={stats.betting.created}
          label="Bets Created"
          tooltip={statsType === "personal" ? "Total number of bets you've created" : "Total number of bets created by all users"}
        />
        <StatItem 
          icon={{ bg: 'bg-green-500/20', dot: 'bg-green-400' }}
          value={stats.betting.matched}
          label="Bets Matched"
          tooltip={statsType === "personal" ? "Number of bets you've accepted from other users" : "Total number of bets matched across all users"}
        />
      </div>

      {/* Current Bets Card */}
      <div className="bg-blue-600/10 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-blue-500/20 hover:border-blue-500/30 transition-all duration-200">
        <StatItem 
          icon={{ bg: 'bg-blue-500/20', dot: 'bg-blue-400' }}
          value={stats.betting.pending}
          label="Open Bets"
          tooltip={statsType === "personal" ? "Bets you've created that are waiting to be matched" : "Total open bets waiting to be matched"}
        />
        <StatItem 
          icon={{ bg: 'bg-orange-500/20', dot: 'bg-orange-400' }}
          value={stats.financial.activeBets}
          label="Active Bets"
          tooltip={statsType === "personal" ? "Your matched bets that are currently in progress" : "Total matched bets currently in progress"}
        />
      </div>

      {/* Financial Stats Card */}
      <div className="bg-indigo-600/10 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-indigo-500/20 hover:border-indigo-500/30 transition-all duration-200">
        <StatItem 
          icon={{ bg: 'bg-indigo-500/20', dot: 'bg-indigo-400' }}
          value={`$${stats.financial.totalStaked}`}
          label="Total Staked"
          tooltip={statsType === "personal" ? "Total amount of tokens you've staked" : "Total amount staked across all users"}
        />
        <StatItem 
          icon={{ bg: 'bg-emerald-500/20', dot: 'bg-emerald-400' }}
          value={`$${stats.financial.potentialPayout}`}
          label="Potential Winnings"
          tooltip={statsType === "personal" ? "Maximum amount you could win from your active bets" : "Total potential winnings across all active bets"}
        />
      </div>

      {/* Enhanced Winnings Card */}
      <div className="bg-gradient-to-br from-yellow-500/30 to-pink-500/30 backdrop-blur-xl rounded-xl p-6 border-2 border-yellow-500/30 relative overflow-hidden hover:scale-[1.02] transition-transform duration-200 group">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-pink-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-x"></div>
        <div className="flex items-center gap-4 relative">
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-yellow-500/30 backdrop-blur-sm">
            <div className="w-7 h-7 rounded-full bg-yellow-500/30 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 animate-pulse"></div>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-white drop-shadow">${stats.financial.winnings}</span>
              <span className="text-yellow-400/90 text-sm">•</span>
              <span className="text-yellow-400/90 text-sm font-medium">{stats.betting.won} Won</span>
            </div>
            <span className="text-gray-300/90 text-sm font-medium">
              {statsType === "personal" ? "Your Total Winnings" : "Total Platform Winnings"}
            </span>
          </div>
        </div>
        {statsType === "personal" && stats.rank && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <span>Rank #{stats.rank.position}</span>
            <span>•</span>
            <span>Top {stats.rank.percentile}%</span>
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </div>
      </div>
    </div>
  );
} 