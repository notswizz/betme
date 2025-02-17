import React from 'react';
import BetCard from './BetCard';
import { getCurrentUserId } from '../../utils/auth';

export default function BetList({ bets, text, onAction }) {
  console.log('BetList received props:', { bets, text, hasOnAction: !!onAction });

  // Get current user ID
  const currentUserId = getCurrentUserId();

  // Ensure bets is an array
  const betArray = Array.isArray(bets) ? bets : [];

  if (!betArray || betArray.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-400">{text || 'No bets available'}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {text && (
        <p className="text-gray-300 mb-4 px-4">{text}</p>
      )}
      <div className="overflow-x-auto scrollbar-hide w-full">
        <div className="inline-flex px-4 py-2 gap-4 w-auto">
          {betArray.map((bet) => (
            <BetCard 
              key={bet._id} 
              bet={{ ...bet, currentUserId }} 
              onAction={onAction} 
            />
          ))}
        </div>
      </div>
    </div>
  );
} 