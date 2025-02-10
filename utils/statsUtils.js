export function calculatePlayerAverages(stats) {
  console.log('=== DEBUG: Calculating Player Averages ===');
  console.log('Input stats count:', stats.length);

  // Filter out invalid or incomplete stat entries
  const validStats = stats.filter(game => 
    game.min && 
    (game.points !== undefined || game.pts !== undefined)
  );

  console.log('Valid stats count:', validStats.length);

  if (validStats.length === 0) {
    return null;
  }

  const totals = validStats.reduce((acc, game) => {
    const gameStats = {
      points: Number(game.points || game.pts) || 0,
      assists: Number(game.assists) || 0,
      rebounds: Number(game.totReb || game.reb) || 0,
      steals: Number(game.steals) || 0,
      blocks: Number(game.blocks) || 0,
      turnovers: Number(game.turnovers) || 0,
      fouls: Number(game.pFouls || game.fouls) || 0,
      minutes: parseFloat(game.min) || 0,
      fgm: Number(game.fgm) || 0,
      fga: Number(game.fga) || 0,
      tpm: Number(game.tpm) || 0,
      tpa: Number(game.tpa) || 0,
      ftm: Number(game.ftm) || 0,
      fta: Number(game.fta) || 0
    };

    return {
      points: acc.points + gameStats.points,
      assists: acc.assists + gameStats.assists,
      rebounds: acc.rebounds + gameStats.rebounds,
      steals: acc.steals + gameStats.steals,
      blocks: acc.blocks + gameStats.blocks,
      turnovers: acc.turnovers + gameStats.turnovers,
      fouls: acc.fouls + gameStats.fouls,
      minutes: acc.minutes + gameStats.minutes,
      fgm: acc.fgm + gameStats.fgm,
      fga: acc.fga + gameStats.fga,
      tpm: acc.tpm + gameStats.tpm,
      tpa: acc.tpa + gameStats.tpa,
      ftm: acc.ftm + gameStats.ftm,
      fta: acc.fta + gameStats.fta
    };
  }, {
    points: 0, assists: 0, rebounds: 0, steals: 0,
    blocks: 0, turnovers: 0, fouls: 0, minutes: 0,
    fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0
  });

  const count = validStats.length;
  return {
    points: (totals.points / count).toFixed(1),
    assists: (totals.assists / count).toFixed(1),
    rebounds: (totals.rebounds / count).toFixed(1),
    steals: (totals.steals / count).toFixed(1),
    blocks: (totals.blocks / count).toFixed(1),
    turnovers: (totals.turnovers / count).toFixed(1),
    fouls: (totals.fouls / count).toFixed(1),
    minutes: (totals.minutes / count).toFixed(1),
    fgp: ((totals.fgm / totals.fga) * 100).toFixed(1),
    tpp: ((totals.tpm / totals.tpa) * 100).toFixed(1),
    ftp: ((totals.ftm / totals.fta) * 100).toFixed(1)
  };
}

export function formatStatValue(stat, value) {
  switch(stat.toLowerCase()) {
    case 'points': return `${value} PPG`;
    case 'assists': return `${value} APG`;
    case 'rebounds': return `${value} RPG`;
    case 'steals': return `${value} SPG`;
    case 'blocks': return `${value} BPG`;
    case 'fgp': return `${value}% FG`;
    case 'tpp': return `${value}% 3P`;
    case 'ftp': return `${value}% FT`;
    default: return value;
  }
} 