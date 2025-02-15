import connectDB from '@/utils/mongodb'; // Ensure you have a connection utility
import Bet from '@/models/Bet';
import jwt from 'jsonwebtoken'; // Assuming you're using JWT for authentication
import { verifyToken } from '@/utils/auth'; // Import the verifyToken function

const VOTING_DURATION_HOURS = 24; // How long voting stays open
const REPUTATION_REWARD = 10; // Reputation points for correct votes

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { betId } = req.body; // Assuming team is determined by userId
    const token = req.headers.authorization?.split(' ')[1]; // Get token from Authorization header

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Verify the token using the utility function
      const userId = verifyToken(token); // Use the verifyToken function from auth.js

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Connect to the database
      await connectDB();

      // Find the bet in the database
      const bet = await Bet.findById(betId);
      if (!bet) {
        return res.status(404).json({ error: 'Bet not found' });
      }

      // Determine the winning team based on userId
      let winningTeam;
      if (bet.userId.toString() === userId) {
        winningTeam = bet.team1; // User is on team1
      } else if (bet.challengerId.toString() === userId) {
        winningTeam = bet.team2; // Challenger is on team2
      } else {
        return res.status(403).json({ error: 'User is not part of this bet' });
      }

      // Update the bet with the winning team and change the game status
      bet.winnerId = userId; // Set the winner to the user ID of the bettor
      bet.winningTeam = winningTeam; // Set the winning team
      bet.status = 'completed'; // Change the status to signify completion

      // Add the user ID and winning team to the votes array
      if (!bet.votes) {
        bet.votes = []; // Initialize votes if it's undefined
      }
      bet.votes.push({ userId, team: winningTeam }); // Add the user ID and team to the votes array

      await bet.save();

      return res.status(200).json({ message: 'Bet completed successfully', bet });
    } catch (error) {
      console.error('Error completing bet:', error);
      return res.status(500).json({ error: 'Failed to complete bet' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 