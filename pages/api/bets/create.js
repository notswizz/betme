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

    // Validate stake against user's token balance
    if (user.tokenBalance < stake) {
      return res.status(400).json({ message: 'Insufficient token balance' });
    }

    // Calculate payout using the same formula as the frontend
    let payout = parseFloat(stake);
    const numOdds = parseInt(odds);
    if (numOdds > 0) {
      payout += (stake * numOdds) / 100;
    } else if (numOdds < 0) {
      payout += (stake * 100) / Math.abs(numOdds);
    }
    payout = parseFloat(payout.toFixed(2));

    // Calculate challenger stake (what they need to put up to match the bet)
    const challengerStake = parseFloat((payout - stake).toFixed(2));

    // Create bet with exact schema match
    const bet = new Bet({
      userId,
      type,
      sport,
      team1,
      team2,
      line,
      odds: numOdds,
      stake: parseFloat(stake),
      challengerStake,
      payout,
      status: 'pending',
      createdAt: new Date()
    });

    await bet.save();

    // Update user's token balance
    user.tokenBalance -= parseFloat(stake);
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