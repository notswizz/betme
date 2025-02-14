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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await fetch('/api/bets/stats', {
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
  }, []);

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
      {/* Bet Activity Card */}
      <div className="bg-purple-600/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
        <StatItem 
          icon={{ bg: 'bg-purple-500/20', dot: 'bg-purple-400' }}
          value={stats.betting.created}
          label="Bets Created"
          tooltip="Total number of bets you've created"
        />
        <StatItem 
          icon={{ bg: 'bg-green-500/20', dot: 'bg-green-400' }}
          value={stats.betting.matched}
          label="Bets Matched"
          tooltip="Number of bets you've accepted from other users"
        />
      </div>

      {/* Current Bets Card */}
      <div className="bg-blue-600/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
        <StatItem 
          icon={{ bg: 'bg-blue-500/20', dot: 'bg-blue-400' }}
          value={stats.betting.pending}
          label="Open Bets"
          tooltip="Bets you've created that are waiting to be matched by other users"
        />
        <StatItem 
          icon={{ bg: 'bg-orange-500/20', dot: 'bg-orange-400' }}
          value={stats.financial.activeBets}
          label="Active Bets"
          tooltip="Matched bets that are currently in progress and waiting for confirmation"
        />
      </div>

      {/* Financial Stats Card */}
      <div className="bg-indigo-600/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
        <StatItem 
          icon={{ bg: 'bg-indigo-500/20', dot: 'bg-indigo-400' }}
          value={`$${stats.financial.totalStaked}`}
          label="Total Staked"
          tooltip="Total amount of tokens you've staked across all bets"
        />
        <StatItem 
          icon={{ bg: 'bg-emerald-500/20', dot: 'bg-emerald-400' }}
          value={`$${stats.financial.potentialPayout}`}
          label="Potential Winnings"
          tooltip="Maximum amount you could win from your active bets"
        />
      </div>

      {/* Winnings Card */}
      <div className="bg-gradient-to-br from-yellow-600/20 to-pink-600/20 backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-yellow-500/20">
            <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-medium text-white">${stats.financial.winnings}</span>
              <span className="text-yellow-400/80 text-sm">•</span>
              <span className="text-yellow-400/80 text-sm">{stats.betting.won} Won</span>
            </div>
            <span className="text-gray-500 text-sm">Total Winnings</span>
          </div>
        </div>
      </div>
    </div>
  );
} 