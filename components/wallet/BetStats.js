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

function StatValue({ value, label, className = '' }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="text-sm font-medium text-white">{value}</span>
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  );
}

function StatItem({ icon, value, label, tooltip, className = '' }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className={`relative flex items-center gap-1.5 group cursor-help ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`w-2.5 h-2.5 rounded-full ${icon.bg} flex items-center justify-center flex-shrink-0`}>
        <div className={`w-1.5 h-1.5 rounded-full ${icon.dot}`}></div>
      </div>
      <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
        <span className="text-sm font-medium text-white truncate">{value}</span>
        <span className="text-[10px] text-gray-400 flex-shrink-0">{label}</span>
      </div>
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
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Not authenticated');
          return;
        }

        const response = await fetch(`/api/bets/stats?type=${statsType}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        // Check if the response contains the expected data structure
        if (!response.ok || !data.stats) {
          console.error('Invalid response:', data);
          throw new Error(data.error || 'Failed to fetch stats');
        }

        // Initialize default values for missing fields
        const defaultStats = {
          betting: {
            total: 0,
            pending: 0,
            matched: 0,
            completed: 0,
            created: 0,
            accepted: 0,
            won: 0
          },
          financial: {
            tokenBalance: 0,
            totalStaked: 0,
            potentialPayout: 0,
            activeBets: 0,
            winnings: 0
          },
          rank: statsType === 'personal' ? {
            position: 0,
            totalUsers: 0,
            percentile: 0
          } : null
        };

        // Merge received stats with default values
        setStats({
          betting: { ...defaultStats.betting, ...data.stats.betting },
          financial: { ...defaultStats.financial, ...data.stats.financial },
          rank: statsType === 'personal' ? 
            { ...defaultStats.rank, ...data.stats.rank } : 
            null
        });

      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err.message || 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [statsType]);

  // Show loading state
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

  // Show error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="text-red-400 text-sm text-center">
          {error}
        </p>
      </div>
    );
  }

  // Show empty state if no stats
  if (!stats) {
    return (
      <div className="bg-gray-900/90 rounded-xl p-4">
        <p className="text-gray-400 text-sm text-center">
          No statistics available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Stats Toggle */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setStatsType('personal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              statsType === 'personal'
                ? 'bg-purple-500/20 text-purple-300'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setStatsType('global')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              statsType === 'global'
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            Global
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Created/Matched Stats */}
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 backdrop-blur-lg rounded-xl p-2.5 space-y-2 border border-purple-500/20">
          <StatItem 
            icon={{ bg: 'bg-purple-500/30', dot: 'bg-purple-400' }}
            value={stats.betting.created}
            label="Created"
            tooltip={statsType === "personal" ? "Total number of bets you've created" : "Total number of bets created by all users"}
          />
          <StatItem 
            icon={{ bg: 'bg-green-500/30', dot: 'bg-green-400' }}
            value={stats.betting.matched}
            label="Matched"
            tooltip={statsType === "personal" ? "Number of bets you've accepted from other users" : "Total number of bets matched across all users"}
          />
        </div>

        {/* Open/Active Stats */}
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 backdrop-blur-lg rounded-xl p-2.5 space-y-2 border border-blue-500/20">
          <StatItem 
            icon={{ bg: 'bg-blue-500/30', dot: 'bg-blue-400' }}
            value={stats.betting.pending}
            label="Open"
            tooltip={statsType === "personal" ? "Your unmatched bets waiting to be accepted" : "Total unmatched bets waiting to be accepted"}
          />
          <StatItem 
            icon={{ bg: 'bg-orange-500/30', dot: 'bg-orange-400' }}
            value={stats.financial.activeBets}
            label="Active"
            tooltip={statsType === "personal" ? "Your matched bets that haven't been completed yet" : "Total matched bets that haven't been completed yet"}
          />
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-2 gap-2">
        {/* Stakes Card */}
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 backdrop-blur-lg rounded-xl p-2.5 border border-blue-500/20">
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">
                ${stats.financial.totalStaked.toFixed(2)}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">Staked</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-base font-medium text-emerald-400">
                ${stats.financial.potentialPayout.toFixed(2)}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">Potential</span>
            </div>
          </div>
        </div>

        {/* Winnings Card */}
        <div className="bg-gradient-to-br from-amber-500/20 via-rose-500/20 to-pink-500/20 backdrop-blur-xl rounded-xl p-2.5 border border-amber-500/30">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/30 to-rose-500/30 flex items-center justify-center mb-1">
              <span className="text-base">🏆</span>
            </div>
            <span className="text-xl font-bold text-white">
              ${stats.financial.winnings.toFixed(2)}
            </span>
            <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 mt-1">
              <span className="text-xs text-amber-400/90 font-medium">{stats.betting.won} Won</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rank Section */}
      {statsType === "personal" && stats.rank && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/20 to-pink-500/10 backdrop-blur-xl rounded-xl p-2.5 border border-amber-500/20">
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-amber-400/90">#{stats.rank.position}</span>
            </div>
            <div className="h-8 w-px bg-gray-700/50"></div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-rose-400/90">Top {stats.rank.percentile}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 