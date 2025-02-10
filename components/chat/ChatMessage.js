import React from 'react';
import MessageAvatar from '../messages/MessageAvatar';
import RegularMessage from '../messages/RegularMessage';
import BetConfirmation from '../messages/BetConfirmation';
import BetSuccessMessage from '../messages/BetSuccessMessage';
import OpenBetsView from '../messages/OpenBetsView';
import ImagePreview from '../messages/ImagePreview';
import PlayerStatsCard from '../messages/PlayerStatsCard';
import { memo } from 'react';
import { BetSlipMessage } from './BetSlipMessage';

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

const ChatMessage = ({ message, onBetConfirm, onImageUpload }) => {
  const { role, type, content } = message;
  const isUser = role === 'user';

  const renderMessageContent = () => {
    // Handle player stats content specially
    if (content && typeof content === 'object' && 'firstName' in content) {
      return <PlayerStatsCard stats={content} />;
    }

    switch (type) {
      case 'text':
        return <RegularMessage content={content} message={message} />;
      case 'bet_confirmation':
        return <BetConfirmation bet={content} onConfirm={onBetConfirm} />;
      case 'bet_success':
        return <BetSuccessMessage bet={content} />;
      case 'open_bets':
        return <OpenBetsView bets={content} />;
      case 'image':
        return <ImagePreview image={content} onUpload={onImageUpload} />;
      case 'betslip':
        return handleBetSlip(content);
      default:
        return <RegularMessage content={content} message={message} />;
    }
  };

  return (
    <div className="w-full mb-4">
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex max-w-[85%] items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <MessageAvatar isUser={isUser} />
          {renderMessageContent()}
        </div>
      </div>
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