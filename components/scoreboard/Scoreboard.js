import { useState, useEffect, useCallback } from 'react';
import { fetchBasketballGames } from '@/utils/sportsApi';

export default function Scoreboard() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGames = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      const basketballGames = await fetchBasketballGames();
      
      if (!basketballGames || basketballGames.length === 0) {
        console.log('No upcoming games found');
        setGames([]);
      } else {
        // Filter games for today (current date)
        const today = new Date();
        const filteredGames = basketballGames.filter(game => {
          const gameDate = new Date(game.date);
          return gameDate.toDateString() === today.toDateString();
        });
        setGames(filteredGames);
      }
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games. Please try again later.');
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch games on component mount
  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Set up auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  // Helper to check if a game is in the past
  const isGameFinished = (status) => {
    return status === 'Finished' || status === 'Final' || status === 'After OT';
  };

  // Show loading skeleton
  if (loading) {
    return (
      <div className="w-full max-w-[95vw] mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-800/50 rounded-lg w-full max-w-md mx-auto"></div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-[380px] h-[280px] bg-gray-800/50 rounded-xl flex-shrink-0"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full max-w-[95vw] mx-auto p-4">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[95vw] mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 text-center">
        Today's NBA Games
      </div>

      {/* Games Display */}
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-4" style={{ paddingBottom: '10px' }}>
          {games.length === 0 ? (
            <div className="w-full text-center text-gray-400 py-8">
              No games scheduled for today
            </div>
          ) : (
            games.map(game => (
              <GameCard key={game.id} game={game} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// GameCard component
function GameCard({ game }) {
  const getGameDateTime = (date) => {
    const gameDate = new Date(date);
    return {
      time: gameDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      })
    };
  };

  const gameDateTime = getGameDateTime(game.date);

  // Helper to format quarter scores
  const formatQuarterScores = (scores) => {
    return Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .map(([quarter, score]) => (
        <div key={quarter} className="flex flex-col items-center">
          <span className="text-[10px] text-gray-500 uppercase">{quarter}</span>
          <span className="text-xs font-medium text-gray-300">{score}</span>
        </div>
      ));
  };

  return (
    <div className="w-[380px] flex-shrink-0 bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-gray-800/50 rounded-xl p-6 
                   hover:from-gray-800/70 hover:via-gray-900/70 hover:to-gray-800/70 transition-all duration-300 
                   border border-gray-700/30 backdrop-blur-sm hover:border-gray-600/30 group
                   shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-blue-400/90 group-hover:text-blue-400">
            {gameDateTime.time}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center px-2 py-1 rounded-full bg-black/20 border border-gray-700/30">
            <img src="https://media.api-sports.io/basketball/leagues/12.png" 
                 alt="NBA" 
                 className="w-4 h-4 object-contain mr-1" />
            <span className="text-xs font-medium text-gray-400">
              {game.status}
            </span>
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-4">
        {/* Team 1 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 bg-black/20 p-3 rounded-lg border border-gray-700/30">
            <img src={game.team1.logo} alt={game.team1.name} className="w-8 h-8 object-contain" />
            <span className="flex-1 text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
              {game.team1.name}
            </span>
            <span className="text-xl font-bold text-white">
              {game.team1.score}
            </span>
          </div>
          <div className="flex justify-around px-2">
            {formatQuarterScores(game.team1.quarterScores)}
          </div>
        </div>
        
        {/* Team 2 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 bg-black/20 p-3 rounded-lg border border-gray-700/30">
            <img src={game.team2.logo} alt={game.team2.name} className="w-8 h-8 object-contain" />
            <span className="flex-1 text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
              {game.team2.name}
            </span>
            <span className="text-xl font-bold text-white">
              {game.team2.score}
            </span>
          </div>
          <div className="flex justify-around px-2">
            {formatQuarterScores(game.team2.quarterScores)}
          </div>
        </div>
      </div>

      {/* Venue */}
      {game.venue && (
        <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {game.venue}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-700/30">
        <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 group/btn">
          <span className="text-xl mb-0.5 transform group-hover/btn:scale-110 transition-transform">🎯</span>
          <span className="text-[11px] font-medium text-blue-400 group-hover/btn:text-blue-300">Bet</span>
        </button>

        <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 hover:from-indigo-500/30 hover:to-purple-600/30 transition-all duration-300 group/btn">
          <span className="text-xl mb-0.5 transform group-hover/btn:scale-110 transition-transform">📊</span>
          <span className="text-[11px] font-medium text-indigo-400 group-hover/btn:text-indigo-300">Analyze</span>
        </button>
      </div>
    </div>
  );
} 