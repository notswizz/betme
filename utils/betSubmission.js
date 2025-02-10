import connectDB from './mongodb';

// Constants for validation
const VALID_BET_TYPES = ['Spread', 'Moneyline', 'Over/Under', 'Parlay', 'Prop', 'Future'];
const VALID_SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'SOCCER', 'UFC', 'BOXING'];
const MAX_STAKE = 100000; // Maximum stake amount
const MIN_STAKE = 1; // Minimum stake amount

// Validate odds format and convert to American odds if needed
function validateAndNormalizeOdds(odds, format = 'american') {
  if (typeof odds === 'string') {
    odds = odds.trim();
  }
  
  // Convert to number if it's American odds format
  if (format === 'american') {
    const numOdds = parseInt(odds);
    if (isNaN(numOdds)) {
      throw new Error('Invalid American odds format');
    }
    // Validate reasonable odds range (-10000 to +10000)
    if (numOdds < -10000 || numOdds > 10000) {
      throw new Error('Odds are outside acceptable range');
    }
    return numOdds;
  }
  
  // Handle decimal odds
  if (format === 'decimal') {
    const decimalOdds = parseFloat(odds);
    if (isNaN(decimalOdds) || decimalOdds < 1.01) {
      throw new Error('Invalid decimal odds format');
    }
    // Convert to American odds
    return decimalOdds >= 2 
      ? Math.round((decimalOdds - 1) * 100)
      : Math.round(-100 / (decimalOdds - 1));
  }
  
  // Handle fractional odds (e.g., "3/1")
  if (format === 'fractional') {
    const [num, den] = odds.split('/').map(x => parseInt(x.trim()));
    if (isNaN(num) || isNaN(den) || den === 0) {
      throw new Error('Invalid fractional odds format');
    }
    // Convert to American odds
    return num >= den 
      ? Math.round((num / den) * 100)
      : Math.round(-100 / (num / den));
  }
  
  throw new Error('Unsupported odds format');
}

// Validate line/spread based on bet type
function validateLine(line, betType) {
  if (!line && betType !== 'moneyline') {
    throw new Error('Line is required for this bet type');
  }
  
  if (betType === 'spread' || betType === 'over_under') {
    const numLine = parseFloat(line);
    if (isNaN(numLine)) {
      throw new Error('Invalid line format');
    }
    // Validate common increments (0.5 or whole numbers)
    if (Math.abs(numLine % 0.5) !== 0) {
      throw new Error('Line must be in increments of 0.5');
    }
  }
  
  return true;
}

// Enhanced bet validation
function validateBetData(betData) {
  // Validate bet type
  if (!betData.type || !VALID_BET_TYPES.includes(betData.type)) {
    throw new Error(`Invalid bet type. Must be one of: ${VALID_BET_TYPES.join(', ')}`);
  }
  
  // Validate sport
  if (!betData.sport || !VALID_SPORTS.includes(betData.sport.toUpperCase())) {
    throw new Error(`Invalid sport. Must be one of: ${VALID_SPORTS.join(', ')}`);
  }
  
  // Validate teams
  if (!betData.team1 || !betData.team2) {
    throw new Error('Both teams must be specified');
  }
  if (betData.team1.trim() === betData.team2.trim()) {
    throw new Error('Teams cannot be the same');
  }
  
  // Validate stake
  const stake = parseFloat(betData.stake);
  if (isNaN(stake) || stake < MIN_STAKE || stake > MAX_STAKE) {
    throw new Error(`Stake must be between ${MIN_STAKE} and ${MAX_STAKE}`);
  }
  
  // Validate line if applicable
  validateLine(betData.line, betData.type);
  
  return true;
}

export async function submitBet(betData, token = null) {
  try {
    // Get token from parameter or localStorage
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    console.log('Submitting bet with token:', authToken);

    // Validate bet data
    validateBetData(betData);
    
    // Normalize odds to American format
    const normalizedOdds = validateAndNormalizeOdds(betData.odds, betData.oddsFormat || 'american');

    // Format the bet data
    const formattedBet = {
      type: betData.type,
      sport: betData.sport.toUpperCase(),
      team1: betData.team1.trim(),
      team2: betData.team2.trim(),
      line: betData.line,
      odds: normalizedOdds,
      stake: parseFloat(betData.stake),
      payout: calculatePayout(parseFloat(betData.stake), normalizedOdds)
    };

    // Validate required fields
    if (!formattedBet.type || !formattedBet.sport || !formattedBet.team1 || !formattedBet.team2 || 
        isNaN(formattedBet.odds) || isNaN(formattedBet.stake) || formattedBet.stake <= 0) {
      throw new Error('Missing required bet information');
    }

    console.log('Formatted bet data:', formattedBet);

    // Direct database operation if running on server
    if (typeof window === 'undefined') {
      await connectDB();
      // Import models dynamically to avoid issues with window
      const { default: Bet } = await import('../models/Bet');
      const { default: User } = await import('../models/User');
      const { verifyToken } = await import('./auth');

      const userId = await verifyToken(authToken);
      if (!userId) {
        throw new Error('Invalid token');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.tokenBalance < formattedBet.stake) {
        throw new Error('Insufficient token balance');
      }

      const bet = new Bet({
        userId,
        ...formattedBet,
        status: 'pending',
        createdAt: new Date()
      });

      await bet.save();

      user.tokenBalance -= formattedBet.stake;
      await user.save();

      return {
        success: true,
        message: 'Bet placed successfully',
        bet: {
          _id: bet._id,
          ...formattedBet,
          status: bet.status
        }
      };
    }

    // Client-side API call
    const response = await fetch('/api/bets/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(formattedBet)
    });

    const result = await response.json();
    console.log('Bet submission response:', result);

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        throw new Error('Please login again');
      }
      throw new Error(result.message || 'Failed to submit bet');
    }

    return {
      success: true,
      message: 'Bet placed successfully',
      bet: result.bet
    };
  } catch (error) {
    console.error('Error submitting bet:', error);
    throw error;
  }
}

// Helper function to calculate payout
function calculatePayout(stake, odds) {
  if (!stake || !odds) return 0;
  
  let payout = stake;
  if (odds > 0) {
    payout += (stake * odds) / 100;
  } else if (odds < 0) {
    payout += (stake * 100) / Math.abs(odds);
  }
  
  return parseFloat(payout.toFixed(2));
} 