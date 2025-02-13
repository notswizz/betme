// Get open bets from other users
export async function getOpenBets(currentUserId) {
  try {
    await connectDB();
    
    // Find all pending bets that were NOT created by the current user
    const bets = await Bet.find({
      creatorId: { $ne: currentUserId }, // Exclude current user's bets
      status: 'pending', // Only show pending bets
      challengerId: null // Only show unmatched bets
    }).populate('creatorId', 'username'); // Get creator's username
    
    if (!bets || bets.length === 0) {
      return {
        success: true,
        message: {
          role: 'assistant',
          type: 'bet_list',
          content: [],
          text: "No open bets available at the moment. Check back later or create your own bet!"
        }
      };
    }
    
    // Format bets for display
    const formattedBets = bets.map(bet => ({
      id: bet._id.toString(),
      creator: bet.creatorId.username,
      type: bet.type,
      team1: bet.team1,
      team2: bet.team2,
      line: bet.line,
      odds: bet.odds,
      stake: bet.stake,
      status: bet.status,
      createdAt: bet.createdAt
    }));
    
    return {
      success: true,
      message: {
        role: 'assistant',
        type: 'bet_list',
        content: formattedBets,
        text: `Here are the available open bets you can accept:`
      }
    };
  } catch (error) {
    console.error('Error getting open bets:', error);
    return {
      success: false,
      error: 'Failed to fetch open bets. Please try again.'
    };
  }
}

// Get user's own bets
export async function getUserBets(userId) {
  try {
    await connectDB();
    
    // Find all bets created by the user
    const bets = await Bet.find({
      creatorId: userId
    }).populate('creatorId challengerId', 'username');
    
    if (!bets || bets.length === 0) {
      return {
        success: true,
        message: {
          role: 'assistant',
          type: 'bet_list',
          content: [],
          text: "You haven't placed any bets yet. Say 'I want to place a bet' to get started!"
        }
      };
    }
    
    // Format bets for display
    const formattedBets = bets.map(bet => ({
      id: bet._id.toString(),
      creator: bet.creatorId.username,
      challenger: bet.challengerId?.username,
      type: bet.type,
      team1: bet.team1,
      team2: bet.team2,
      line: bet.line,
      odds: bet.odds,
      stake: bet.stake,
      status: bet.status,
      createdAt: bet.createdAt
    }));
    
    return {
      success: true,
      message: {
        role: 'assistant',
        type: 'bet_list',
        content: formattedBets,
        text: `Here are your bets:`
      }
    };
  } catch (error) {
    console.error('Error getting user bets:', error);
    return {
      success: false,
      error: 'Failed to fetch your bets. Please try again.'
    };
  }
} 