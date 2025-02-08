import connectDB from '@/utils/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Verify auth token
    const userId = await verifyToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const user = await User.findById(userId);
      return res.status(200).json({ balance: user.tokenBalance });
    }

    // Handle POST - update balance
    const { amount } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { tokenBalance: amount } },
      { new: true }
    );

    res.status(200).json({ balance: user.tokenBalance });
  } catch (error) {
    console.error('Balance management error:', error);
    res.status(500).json({ error: 'Error managing balance' });
  }
} 