import connectDB from '../../../utils/mongodb';
import Bet from '../../../models/Bet';
import User from '../../../models/User';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get auth header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }

  try {
    // Verify token
    const token = authHeader.split(' ')[1];
    const userId = await verifyToken(token);
    
    if (!userId) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    await connectDB();
    
    // Get user to check token balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { type, sport, team1, team2, line, odds, stake } = req.body;

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
      payout,
      status: 'pending',
      createdAt: new Date()
    });

    await bet.save();

    // Update user's token balance
    user.tokenBalance -= parseFloat(stake);
    await user.save();

    return res.status(201).json({
      message: 'Bet placed successfully',
      betId: bet._id,
      bet: bet
    });

  } catch (error) {
    console.error('Error creating bet:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ 
      message: error.message || 'Error creating bet'
    });
  }
} 