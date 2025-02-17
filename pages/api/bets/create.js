import connectDB from '../../../utils/mongodb';
import Bet from '../../../models/Bet';
import User from '../../../models/User';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get auth header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid authorization header' });
    }

    // Verify token
    const token = authHeader.split(' ')[1];
    const userId = await verifyToken(token);
    
    if (!userId) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Connect to database
    await connectDB();
    
    // Get user to check token balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Extract and validate bet data
    const { type, sport, team1, team2, line, odds, stake } = req.body;

    // Validate required fields
    if (!type || !sport || !team1 || !team2 || !odds || !stake) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          type: !type,
          sport: !sport,
          team1: !team1,
          team2: !team2,
          odds: !odds,
          stake: !stake
        }
      });
    }

    // Parse numeric values
    const numericStake = parseFloat(stake);
    const numericOdds = parseInt(odds);

    // Validate stake against user's token balance
    if (user.tokenBalance < numericStake) {
      return res.status(400).json({ message: 'Insufficient token balance' });
    }

    // Calculate payout
    let payout = numericStake;
    if (numericOdds > 0) {
      payout += (numericStake * numericOdds) / 100;
    } else if (numericOdds < 0) {
      payout += (numericStake * 100) / Math.abs(numericOdds);
    }
    payout = parseFloat(payout.toFixed(2));

    // Calculate challenger stake (what they need to put up to match the bet)
    const winAmount = payout - numericStake;  // How much original bettor can win
    const challengerStake = parseFloat(winAmount.toFixed(2));  // Challenger risks this amount to win original stake

    console.log('Creating bet with values:', {
      type,
      sport,
      team1,
      team2,
      line,
      odds: numericOdds,
      stake: numericStake,
      challengerStake,
      payout
    });

    // Create bet with exact schema match
    const bet = new Bet({
      userId,
      type,
      sport,
      team1,
      team2,
      line,
      odds: numericOdds,
      stake: numericStake,
      challengerStake,
      payout,
      status: 'pending',
      createdAt: new Date()
    });

    await bet.save();

    // Update user's token balance
    user.tokenBalance -= numericStake;
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Bet placed successfully',
      bet: {
        _id: bet._id,
        type: bet.type,
        sport: bet.sport,
        team1: bet.team1,
        team2: bet.team2,
        line: bet.line,
        odds: bet.odds,
        stake: bet.stake,
        challengerStake: bet.challengerStake,
        payout: bet.payout,
        status: bet.status
      }
    });

  } catch (error) {
    console.error('Error creating bet:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ 
      message: error.message || 'Error creating bet',
      error: error.toString()
    });
  }
} 