import { useState, useEffect, useCallback } from 'react';
import { fetchBasketballGames, formatGameData } from '@/utils/sportsApi';

export default function Scoreboard() {
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    // Set to noon to avoid timezone issues
    now.setHours(12, 0, 0, 0);
    return now;
  });
  
  // Currently only NBA is supported through our API
  const leagues = ['ALL', 'NBA'];

  // Generate date options for the dropdown (7 days before and after today)
  const dateOptions = Array.from({ length: 15 }, (_, i) => {
    const date = new Date();
    // Set to noon to avoid timezone issues
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - 7 + i);
    return date;
  });

  const fetchGames = useCallback(async () => {
    try {
      if (retryCount >= 3) {
        setError('Failed to load games. Please try again later.');
        return;
      }

      setError(null);
      setLoading(true);
      console.log('Fetching games for date:', selectedDate.toISOString());
      const basketballGames = await fetchBasketballGames(selectedDate);
      
      // Filter out null values and format games
      const formattedGames = basketballGames
        .map(formatGameData)
        .filter(game => game !== null)
        // Sort games by timestamp
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log('Formatted games:', formattedGames);
      setGames(formattedGames);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching games:', err);
      
      if (err.message.includes('rate limit')) {
        setError('API rate limit reached. Please wait a moment and try again.');
        return;
      }
      
      setError('Failed to load games. Retrying...');
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 2000 * (retryCount + 1)); // Exponential backoff
    } finally {
      setLoading(false);
    }
  }, [retryCount, selectedDate]);

  // Fetch games when date changes
  useEffect(() => {
    fetchGames();
  }, [selectedDate, fetchGames]);

  // Set up auto-refresh only for today's games
  useEffect(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const isToday = selectedDate.toDateString() === today.toDateString();
    let interval;
    
    if (isToday) {
      interval = setInterval(fetchGames, 30000);
      console.log('Auto-refresh enabled for today\'s games');
    }
    
    return () => {
      if (interval) {
        console.log('Clearing auto-refresh interval');
        clearInterval(interval);
      }
    };
  }, [selectedDate, fetchGames]);

  const handleDateChange = (e) => {
    // Create new date at noon to avoid timezone issues
    const newDate = new Date(e.target.value + 'T12:00:00');
    console.log('Date changed to:', newDate.toISOString());
    setSelectedDate(newDate);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getFilteredGames = useCallback(() => {
    if (selectedLeague === 'ALL') {
      return games;
    }
    return games.filter(game => game.league === selectedLeague);
  }, [games, selectedLeague]);

  const getGameTime = useCallback((game) => {
    const gameDate = new Date(game.date);
    const timeStr = gameDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    if (game.status === 'FT') return 'Final';
    if (game.status === 'LIVE') {
      return game.timeLeft ? `${game.quarter}Q ${game.timeLeft}` : game.quarter;
    }
    if (game.status === 'NS') return timeStr;
    if (game.status === 'HT') return 'Halftime';
    return game.status;
  }, []);

  const isWinner = useCallback((game, teamNumber) => {
    if (game.status !== 'FT') return false;
    const team1Score = game.team1.score;
    const team2Score = game.team2.score;
    return teamNumber === 1 ? team1Score > team2Score : team2Score > team1Score;
  }, []);

  // Show loading skeleton
  if (loading) {
    return (
      <div className="w-full max-w-[95vw] mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-800/50 rounded-lg w-full max-w-md"></div>
          <div className="flex gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-[320px] h-[240px] bg-gray-800/50 rounded-xl flex-shrink-0"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[95vw] mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* League Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-2 px-2 scrollbar-hide">
          {leagues.map(league => (
            <button
              key={league}
              onClick={() => setSelectedLeague(league)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedLeague === league
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {league !== 'ALL' && '🏀'} {league}
            </button>
          ))}
        </div>

        {/* Date Selector */}
        <select
          value={selectedDate.toISOString().split('T')[0]}
          onChange={handleDateChange}
          className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-800/50 text-gray-300 hover:bg-gray-800 hover:text-white border-none outline-none focus:ring-2 focus:ring-blue-500"
        >
          {dateOptions.map(date => (
            <option 
              key={date.toISOString()} 
              value={date.toISOString().split('T')[0]}
            >
              {formatDate(date)}
            </option>
          ))}
        </select>
      </div>

      {/* Games Horizontal Scroll */}
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
          {getFilteredGames().length === 0 ? (
            <div className="w-full text-center text-gray-400 py-8">
              No games scheduled for {formatDate(selectedDate)}
            </div>
          ) : (
            getFilteredGames().map(game => (
              <div 
                key={game.id}
                className="w-[320px] flex-shrink-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 
                         hover:from-gray-800/70 hover:to-gray-900/70 transition-all duration-200 cursor-pointer 
                         group border border-gray-700/30 backdrop-blur-sm transform hover:scale-[1.02]"
              >
                {/* Game Header with Date/Time */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <img src={game.league === 'NBA' ? 'https://media.api-sports.io/basketball/leagues/12.png' : ''} 
                         alt="League" 
                         className="w-6 h-6 object-contain" />
                    <span className="text-sm font-medium text-blue-400">{formatDate(new Date(game.date))}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${
                    game.status === 'LIVE' 
                      ? 'text-green-400' 
                      : game.status === 'FT' 
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}>
                    {game.status === 'LIVE' && (
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    )}
                    <span className="text-xs font-medium">
                      {getGameTime(game)}
                    </span>
                  </div>
                </div>

                {/* Teams */}
                <div className="space-y-4">
                  {/* Team 1 */}
                  <div className={`flex items-center gap-4 bg-black/20 p-3 rounded-lg ${
                    isWinner(game, 1) ? 'ring-2 ring-green-500/30' : ''
                  }`}>
                    <img src={game.team1.logo} alt={game.team1.name} className="w-8 h-8 object-contain" />
                    <div className="flex-1">
                      <span className={`text-sm font-medium transition-colors ${
                        isWinner(game, 1) ? 'text-green-400' : 'text-white group-hover:text-blue-400'
                      }`}>
                        {game.team1.name}
                      </span>
                      {/* Quarter Scores */}
                      <div className="flex gap-2 mt-1">
                        {Object.entries(game.team1.quarterScores).map(([quarter, score], idx) => (
                          score > 0 && (
                            <span key={quarter} className="text-xs text-gray-400">
                              {quarter.toUpperCase()}: {score}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                    <span className={`text-xl font-bold ${
                      isWinner(game, 1) ? 'text-green-400' : 'text-white'
                    }`}>
                      {game.team1.score}
                    </span>
                  </div>
                  
                  {/* Team 2 */}
                  <div className={`flex items-center gap-4 bg-black/20 p-3 rounded-lg ${
                    isWinner(game, 2) ? 'ring-2 ring-green-500/30' : ''
                  }`}>
                    <img src={game.team2.logo} alt={game.team2.name} className="w-8 h-8 object-contain" />
                    <div className="flex-1">
                      <span className={`text-sm font-medium transition-colors ${
                        isWinner(game, 2) ? 'text-green-400' : 'text-white group-hover:text-blue-400'
                      }`}>
                        {game.team2.name}
                      </span>
                      {/* Quarter Scores */}
                      <div className="flex gap-2 mt-1">
                        {Object.entries(game.team2.quarterScores).map(([quarter, score], idx) => (
                          score > 0 && (
                            <span key={quarter} className="text-xs text-gray-400">
                              {quarter.toUpperCase()}: {score}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                    <span className={`text-xl font-bold ${
                      isWinner(game, 2) ? 'text-green-400' : 'text-white'
                    }`}>
                      {game.team2.score}
                    </span>
                  </div>
                </div>

                {/* Venue Information */}
                {game.venue && (
                  <div className="mt-4 text-xs text-gray-500">
                    📍 {game.venue}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-[1fr,auto,1fr] gap-3 pt-4 mt-4 border-t border-gray-700/30">
                  <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-400/10 to-blue-500/10 animate-gradient-x"></div>
                    <span className="text-xl mb-0.5 transform group-hover:scale-110 transition-transform duration-300">🎯</span>
                    <span className="text-[11px] font-medium text-blue-400 group-hover:text-blue-300">Bet</span>
                  </button>

                  <div className="flex flex-col items-center justify-center px-3">
                    <span className="text-base font-bold bg-gradient-to-br from-gray-100 to-gray-300 text-transparent bg-clip-text">
                      {Math.floor(Math.random() * 200 + 50)}
                    </span>
                    <span className="text-[10px] text-gray-500">Bets</span>
                  </div>

                  <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 hover:from-indigo-500/30 hover:to-purple-600/30 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-400/10 to-indigo-500/10 animate-gradient-x"></div>
                    <div className="relative flex items-center justify-center w-6 h-6 mb-0.5">
                      <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                      <svg className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transform group-hover:scale-110 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-medium text-indigo-400 group-hover:text-indigo-300">Analyze</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 