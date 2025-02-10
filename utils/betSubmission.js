import connectDB from './mongodb';

export async function submitBet(betData) {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Format the bet data
    const formattedBet = {
      type: betData.type,
      sport: betData.sport,
      team1: betData.team1,
      team2: betData.team2,
      line: betData.line,
      odds: parseInt(betData.odds), // Convert odds to number
      stake: parseFloat(betData.stake), // Convert stake to number
      payout: calculatePayout(parseFloat(betData.stake), parseInt(betData.odds)),
      status: 'pending'
    };

    const response = await fetch('/api/bets/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formattedBet)
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Please login again');
      }
      throw new Error(error.message || 'Failed to submit bet');
    }

    const result = await response.json();
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