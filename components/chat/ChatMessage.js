import React, { useState } from 'react';
import MessageAvatar from '../messages/MessageAvatar';
import RegularMessage from '../messages/RegularMessage';
import BetConfirmation from '../messages/BetConfirmation';
import BetSuccessMessage from '../messages/BetSuccessMessage';
import BetListMessage from '../messages/BetListMessage';
import ImagePreview from '../messages/ImagePreview';
import PlayerStatsCard from '../messages/PlayerStatsCard';
import { memo } from 'react';
import { BetSlipMessage } from './BetSlipMessage';
import { getCurrentUserId } from '../../utils/auth';

const loadingGifs = [
    "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExenZlN21oM2V4amt5emNqc2tpMmlyMXhhMm0yMTVyMGxlMjl4OGQ5YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7qDFg6xkLxOVdZTi/giphy.gif",
    "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMnVnbTFkeXA3dG9jcHV2Ymx0ODR3d3J0bHM2eXE1ZnQxZmhkb2c1bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xUPGcB5L0TIfLrDH8c/giphy.gif",
    "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnJyNjNtYXY0Z2l6eGpnYnp4bnIzb2ZjMzZmZTNvNDlsY2psdnJqZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/z4Rcio67sPE97UMXme/giphy.gif"
];

// Memoize the BetSlipMessage wrapper to prevent unnecessary re-renders
const MemoizedBetSlipWrapper = memo(function BetSlipWrapper({ data, onSubmit }) {
  return (
    <div className="w-full">
      <BetSlipMessage 
        initialData={data}
        onSubmit={onSubmit}
      />
    </div>
  );
});

const ChatMessage = ({ message, onConfirmAction, onImageUpload, onAcceptBet, gameState }) => {
  const { role, type, content } = message;
  const isUser = role === 'user';
  const currentUserId = getCurrentUserId();
  
  // Add loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGif, setLoadingGif] = useState('');

  const handleAcceptBet = async (bet) => {
    setLoadingGif(loadingGifs[Math.floor(Math.random() * loadingGifs.length)]);
    setIsLoading(true);
    try {
      const response = await fetch('/api/actions/acceptBet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ betId: bet._id })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to accept bet');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 5000);
    } catch (error) {
      console.error('Error accepting bet:', error);
      alert(error.message);
      setTimeout(() => {
        setIsLoading(false);
      }, 5000);
    }
  };

  const handleCompleteBet = async (betId, team) => {
    try {
      const response = await fetch('/api/bets/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ betId, team })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        alert(data.error || 'Failed to complete bet. Please try again.');
        return;
      }
      
      alert(data.message); // Show success message
      window.location.reload(); // Refresh the page or update UI as needed
    } catch (error) {
      console.error('Error completing bet:', error);
      alert('An error occurred while completing the bet. Please try again.');
    }
  };

  const handleLoading = () => {
    setLoadingGif(loadingGifs[Math.floor(Math.random() * loadingGifs.length)]);
    setIsLoading(true);
    // ... existing loading logic
  };

  const renderLoading = () => {
    return (
      <div className="flex justify-center items-center">
        <div className="border-4 border-blue-500 rounded-lg p-4 bg-gray-800">
          <img 
            src={loadingGif} 
            alt="Loading..." 
            className="w-32 h-32 object-contain" // Adjust size as needed
          />
        </div>
      </div>
    );
  };

  const renderMessageContent = () => {
    // Handle player stats content specially
    if (content && typeof content === 'object' && 'firstName' in content) {
      return <PlayerStatsCard stats={content} />;
    }

    switch (type) {
      case 'text':
        return <RegularMessage content={content} message={message} />;
      case 'bet_confirmation':
        return <BetConfirmation bet={content} onConfirm={onConfirmAction} />;
      case 'bet_success':
        return <BetSuccessMessage bet={content} />;
      case 'bet_list':
        // Parse the content if it's a string
        const bets = typeof content === 'string' ? JSON.parse(content) : content;
        return <BetListMessage 
          bets={bets} 
          onAcceptBet={handleAcceptBet}
          onCompleteBet={handleCompleteBet}
          currentUserId={currentUserId}
          isMyBets={message.action === 'view_my_bets'}
        />;
      case 'image':
        return <ImagePreview image={content} onUpload={onImageUpload} />;
      case 'betslip':
        console.log('Rendering betslip message:', message);
        return (
          <div className="space-y-4">
            {message.text && (
              <div className="text-white">
                <RegularMessage content={message.text} message={{ ...message, type: 'text' }} />
              </div>
            )}
            <MemoizedBetSlipWrapper 
              data={typeof content === 'string' ? JSON.parse(content) : content} 
              onSubmit={(action) => onConfirmAction({ ...action, requiresConfirmation: true })} 
            />
          </div>
        );
      default:
        return <RegularMessage content={content} message={message} />;
    }
  };

  return (
    <div className="w-full mb-4">
      {isLoading ? renderLoading() : (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex max-w-[85%] items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <MessageAvatar isUser={isUser} />
            {renderMessageContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;

// Helper functions
export function parseBetSlipData(content) {
  try {
    // Look for the bet slip form section
    const formSection = content.split('🎯 BET SLIP FORM')[1];
    if (!formSection) return null;

    const matches = {
      type: extractField(formSection, 'Type:', '\\[(.*?)\\]'),
      sport: extractField(formSection, 'Sport:', '\\[(.*?)\\]'),
      date: extractField(formSection, 'Date:', '\\[(.*?)\\]'),
      team1: extractField(formSection, 'Team 1:', '\\[(.*?)\\]'),
      team2: extractField(formSection, 'Team 2:', '\\[(.*?)\\]'),
      line: extractField(formSection, 'Line:', '\\[(.*?)\\]'),
      pick: extractField(formSection, 'Pick:', '\\[(.*?)\\]'),
      odds: extractField(formSection, 'Odds:', '\\[(.*?)\\]'),
      stake: extractField(formSection, 'Stake:', '\\$\\[(.*?)\\]'),
      payout: extractField(formSection, 'Potential Payout:', '\\$\\[(.*?)\\]'),
      notes: extractField(formSection, 'Additional Notes:', '\\[(.*?)\\]')
    };

    // Clean up and convert values
    return {
      ...matches,
      stake: parseFloat(matches.stake) || 0,
      payout: parseFloat(matches.payout) || 0,
      odds: matches.odds.replace(/[^\d+-]/g, '') // Clean odds to just numbers and +/-
    };
  } catch (error) {
    console.error('Error parsing bet slip:', error);
    return {
      type: '', sport: '', date: '', team1: '', team2: '',
      line: '', pick: '', odds: '', stake: 0, payout: 0, notes: ''
    };
  }
}

function extractField(text, fieldName, pattern) {
  try {
    const regex = new RegExp(`${fieldName}\\s*${pattern}`, 'i');
    return (text.match(regex)?.[1] || '').trim();
  } catch {
    return '';
  }
}

export function handleBetSubmit(betSlipData) {
  try {
    return {
      role: 'assistant',
      type: 'text',
      requiresConfirmation: true,
      content: `Would you like to place this bet?\n` +
              `${betSlipData.team1} vs ${betSlipData.team2}\n` +
              `Pick: ${betSlipData.pick} @ ${betSlipData.odds}\n` +
              `Stake: $${betSlipData.stake}`,
      action: {
        name: 'place_bet',
        ...betSlipData
      }
    };
  } catch (error) {
    console.error('Error submitting bet:', error);
    return null;
  }
}

// Add this to your global CSS or Tailwind config
const styles = `
  @keyframes gradient-x {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 3s ease infinite;
  }
`; 