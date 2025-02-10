import { useState } from 'react';

// Mock data - this will be replaced with API data later
const MOCK_GAMES = {
  MLB: [
    { id: 1, league: 'MLB', status: 'LIVE', inning: '7th', isTop: true,
      team1: { name: 'Yankees', score: 4 }, team2: { name: 'Red Sox', score: 2 } },
    { id: 2, league: 'MLB', status: 'LIVE', inning: '5th', isTop: false,
      team1: { name: 'Dodgers', score: 1 }, team2: { name: 'Giants', score: 3 } },
  ],
  NBA: [
    { id: 3, league: 'NBA', status: 'LIVE', quarter: '3rd', timeLeft: '8:24',
      team1: { name: 'Lakers', score: 78 }, team2: { name: 'Warriors', score: 82 } },
    { id: 4, league: 'NBA', status: 'FINAL',
      team1: { name: 'Celtics', score: 112 }, team2: { name: 'Nets', score: 98 } },
  ],
  NFL: [
    { id: 5, league: 'NFL', status: 'LIVE', quarter: '2nd', timeLeft: '4:15',
      team1: { name: 'Chiefs', score: 14 }, team2: { name: 'Raiders', score: 7 } },
  ]
};

export default function Scoreboard() {
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  
  const leagues = ['ALL', ...Object.keys(MOCK_GAMES)];
  
  const getFilteredGames = () => {
    if (selectedLeague === 'ALL') {
      return Object.values(MOCK_GAMES).flat();
    }
    return MOCK_GAMES[selectedLeague] || [];
  };

  const getGameTime = (game) => {
    if (game.status === 'FINAL') return 'Final';
    if (game.league === 'MLB') {
      return `${game.isTop ? '▲' : '▼'} ${game.inning}`;
    }
    return `${game.quarter} ${game.timeLeft}`;
  };

  const getLeagueIcon = (league) => {
    switch(league) {
      case 'NBA': return '🏀';
      case 'NFL': return '🏈';
      case 'MLB': return '⚾';
      default: return '🎮';
    }
  };

  return (
    <div className="w-full max-w-[95vw] mx-auto">
      {/* League Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
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
            {league !== 'ALL' && getLeagueIcon(league)} {league}
          </button>
        ))}
      </div>

      {/* Games Horizontal Scroll */}
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
          {getFilteredGames().map(game => (
            <div 
              key={game.id}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 hover:from-gray-800/70 hover:to-gray-900/70 
                         transition-all duration-200 cursor-pointer group border border-gray-700/30 backdrop-blur-sm
                         w-[280px] flex-shrink-0 transform hover:scale-[1.02]"
            >
              {/* Game Header */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getLeagueIcon(game.league)}</span>
                  <span className="text-sm font-medium text-blue-400">{game.league}</span>
                </div>
                <div className={`flex items-center gap-1.5 ${
                  game.status === 'LIVE' 
                    ? 'text-green-400' 
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
              <div className="space-y-3 mb-4">
                {/* Team 1 */}
                <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                  <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    {game.team1.name}
                  </span>
                  <span className="text-lg font-bold text-white">
                    {game.team1.score}
                  </span>
                </div>
                
                {/* Team 2 */}
                <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                  <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    {game.team2.name}
                  </span>
                  <span className="text-lg font-bold text-white">
                    {game.team2.score}
                  </span>
                </div>
              </div>

              {/* Indicators */}
              <div className="grid grid-cols-[1fr,auto,1fr] gap-3 pt-3 border-t border-gray-700/30">
                {/* Bet Button */}
                <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-400/10 to-blue-500/10 animate-gradient-x"></div>
                  <span className="text-xl mb-0.5 transform group-hover:scale-110 transition-transform duration-300">🎯</span>
                  <span className="text-[11px] font-medium text-blue-400 group-hover:text-blue-300">Bet</span>
                </button>

                {/* Total Bets Counter */}
                <div className="flex flex-col items-center justify-center px-3">
                  <span className="text-base font-bold bg-gradient-to-br from-gray-100 to-gray-300 text-transparent bg-clip-text">{156}</span>
                  <span className="text-[10px] text-gray-500">Bets</span>
                </div>
                
                {/* Analyze Button */}
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
          ))}
        </div>
      </div>
    </div>
  );
} 