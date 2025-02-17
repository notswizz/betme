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
        <span className="text-gray-400 block">{text || 'No bets available'}</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {text && (
        <span className="text-gray-300 mb-4 px-4 block">{text}</span>
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