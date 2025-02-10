import connectDB from './mongodb';

export async function submitBet(betData, token = null) {
  try {
    // Get token from parameter or localStorage
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    console.log('Submitting bet with token:', authToken);

    // Format the bet data
    const formattedBet = {
      type: betData.type,
      sport: betData.sport,
      team1: betData.team1,
      team2: betData.team2,
      line: betData.line,
      odds: parseInt(betData.odds),
      stake: parseFloat(betData.stake),
      payout: calculatePayout(parseFloat(betData.stake), parseInt(betData.odds))
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