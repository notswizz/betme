import { useState, useEffect, useCallback } from 'react';
import { fetchBasketballGames } from '@/utils/gamesApi';

export default function Scoreboard() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGames = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Fetching basketball games...');
      const basketballGames = await fetchBasketballGames();
      console.log('Raw games data:', JSON.stringify(basketballGames, null, 2));
      
      if (!basketballGames || !Array.isArray(basketballGames)) {
        console.log('Invalid games data received:', basketballGames);
        setGames([]);
      } else {
        // Ensure games have all required properties
        const validGames = basketballGames.filter(game => {
          const isValid = game && game.id && game.team1 && game.team2;
          if (!isValid) {
            console.warn('Invalid game data:', JSON.stringify(game, null, 2));
          }
          return isValid;
        });
        
        console.log('Setting valid games:', JSON.stringify(validGames, null, 2));
        setGames(validGames);
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
            {[1, 2, 3].map(i => (
              <div key={i} className="w-[300px] h-[200px] bg-gray-800/50 rounded-xl flex-shrink-0"></div>
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
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="text-red-400 text-center text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-gray-800/50 to-transparent backdrop-blur-sm border-b border-gray-700/30">
      <div className="w-full max-w-[95vw] mx-auto p-2 space-y-2">
        {/* Header */}
     

        {/* Games Display */}
        <div className="overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-2 pb-2">
            {games.length === 0 ? (
              <div className="w-full text-center text-gray-400 py-4 px-4 bg-gray-800/20 rounded-lg">
                <div className="text-sm">No games scheduled for today</div>
                <div className="text-xs text-gray-500 mt-1">Check back later for upcoming games</div>
              </div>
            ) : (
              games.map(game => (
                <div key={game.id} className="snap-center">
                  <GameCard game={game} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// GameCard component
function GameCard({ game }) {
  const [team1LogoError, setTeam1LogoError] = useState(false);
  const [team2LogoError, setTeam2LogoError] = useState(false);

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

  // Helper to format quarter scores - more compact version
  const formatQuarterScores = (scores) => {
    if (!scores) return null;
    return Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .map(([quarter, score]) => (
        <div key={quarter} className="flex flex-col items-center">
          <span className="text-[8px] text-gray-500 uppercase">{quarter}</span>
          <span className="text-[10px] font-medium text-gray-300">{score}</span>
        </div>
      ));
  };

  // Team logo fallback
  const getTeamInitials = (teamName) => {
    if (!teamName) return 'TBD';
    return teamName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="w-[300px] flex-shrink-0 bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-gray-800/50 rounded-lg p-3 
                   hover:from-gray-800/70 hover:via-gray-900/70 hover:to-gray-800/70 transition-all duration-300 
                   border border-gray-700/30 backdrop-blur-sm hover:border-gray-600/30 group
                   shadow-lg">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-blue-400/90 group-hover:text-blue-400">
          {gameDateTime.time}
        </span>
        <div className="flex items-center gap-1">
          <div className="flex items-center px-2 py-0.5 rounded-full bg-black/20 border border-gray-700/30">
            <img src="https://media.api-sports.io/basketball/leagues/12.png" 
                 alt="NBA" 
                 className="w-3 h-3 object-contain mr-1" />
            <span className="text-[10px] font-medium text-gray-400">
              {game.status}
            </span>
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-2">
        {/* Team 1 */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-gray-700/30">
            {team1LogoError ? (
              <div className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded text-[10px] font-bold text-gray-300">
                {getTeamInitials(game.team1.name)}
              </div>
            ) : (
              <img 
                src={game.team1.logo} 
                alt={game.team1.name} 
                className="w-6 h-6 object-contain"
                onError={() => setTeam1LogoError(true)}
              />
            )}
            <span className="flex-1 text-xs font-medium text-white group-hover:text-blue-400 transition-colors">
              {game.team1.name}
            </span>
            <span className="text-lg font-bold text-white">
              {game.team1.score}
            </span>
          </div>
          <div className="flex justify-around px-1">
            {formatQuarterScores(game.team1.quarterScores)}
          </div>
        </div>
        
        {/* Team 2 */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-gray-700/30">
            {team2LogoError ? (
              <div className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded text-[10px] font-bold text-gray-300">
                {getTeamInitials(game.team2.name)}
              </div>
            ) : (
              <img 
                src={game.team2.logo} 
                alt={game.team2.name} 
                className="w-6 h-6 object-contain"
                onError={() => setTeam2LogoError(true)}
              />
            )}
            <span className="flex-1 text-xs font-medium text-white group-hover:text-blue-400 transition-colors">
              {game.team2.name}
            </span>
            <span className="text-lg font-bold text-white">
              {game.team2.score}
            </span>
          </div>
          <div className="flex justify-around px-1">
            {formatQuarterScores(game.team2.quarterScores)}
          </div>
        </div>
      </div>

      {/* Venue */}
      {game.venue && (
        <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{game.venue}</span>
        </div>
      )}

      {/* Action Buttons - More compact and mobile-friendly */}
      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-700/30">
        <button className="flex-1 flex items-center justify-center gap-1 p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 group/btn">
          <span className="text-sm transform group-hover/btn:scale-110 transition-transform">🎯</span>
          <span className="text-[10px] font-medium text-blue-400 group-hover/btn:text-blue-300">Bet</span>
        </button>

        <button className="flex-1 flex items-center justify-center gap-1 p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 hover:from-indigo-500/30 hover:to-purple-600/30 transition-all duration-300 group/btn">
          <span className="text-sm transform group-hover/btn:scale-110 transition-transform">📊</span>
          <span className="text-[10px] font-medium text-indigo-400 group-hover/btn:text-indigo-300">Analyze</span>
        </button>
      </div>
    </div>
  );
} 