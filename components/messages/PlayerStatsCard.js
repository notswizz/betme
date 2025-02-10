import React from 'react';
import Image from 'next/image';

const StatBox = ({ label, value, unit }) => (
  <div className="flex flex-col items-center justify-center p-2 bg-gray-800/40 rounded-lg backdrop-blur-sm">
    <div className="text-lg font-bold text-white">{value}</div>
    <div className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</div>
    <div className="text-[10px] text-gray-500">{unit}</div>
  </div>
);

const StatRow = ({ label, value, icon }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-gray-700/50 last:border-0">
    <div className="flex items-center gap-1.5">
      {icon && <span className="text-sm text-gray-400">{icon}</span>}
      <span className="text-xs text-gray-400">{label}</span>
    </div>
    <span className="text-xs text-white font-semibold">{value}</span>
  </div>
);

const PlayerStatsCard = ({ stats }) => {
  const {
    firstName,
    lastName,
    team,
    season,
    gamesPlayed,
    points,
    rebounds,
    assists,
    minutes,
    fgp,
    tpp,
    ftp,
    steals,
    blocks,
    turnovers,
    fouls
  } = stats;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10">
        {/* Header */}
        <div className="relative p-3">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -ml-16 -mb-16" />
          
          <div className="relative flex items-center gap-3">
            {team?.logo && (
              <div className="w-12 h-12 relative flex-shrink-0">
                <Image
                  src={team.logo}
                  alt={team.name}
                  layout="fill"
                  objectFit="contain"
                  className="rounded-full"
                />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white truncate">
                {firstName} {lastName}
              </h2>
              <p className="text-xs text-gray-400 truncate">
                {team?.name} | {season}-{parseInt(season) + 1}
              </p>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-3 gap-2 px-3 py-2">
          <StatBox label="Points" value={points} unit="PPG" />
          <StatBox label="Rebounds" value={rebounds} unit="RPG" />
          <StatBox label="Assists" value={assists} unit="APG" />
        </div>

        {/* Detailed Stats */}
        <div className="px-3 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1">
                Efficiency
              </h3>
              <StatRow icon="⏱️" label="Min" value={`${minutes}`} />
              <StatRow icon="🎯" label="FG%" value={`${fgp}%`} />
              <StatRow icon="🏹" label="3P%" value={`${tpp}%`} />
              <StatRow icon="🎪" label="FT%" value={`${ftp}%`} />
            </div>
            <div>
              <h3 className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1">
                Defense
              </h3>
              <StatRow icon="🥷" label="Stl" value={steals} />
              <StatRow icon="🛡️" label="Blk" value={blocks} />
              <StatRow icon="❌" label="TO" value={turnovers} />
              <StatRow icon="⚠️" label="Fouls" value={fouls} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-gray-900/50 border-t border-white/10">
          <p className="text-center text-[10px] text-gray-400">
            Stats from {gamesPlayed} games played
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsCard; 