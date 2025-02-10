import OpenBetsView from '../messages/OpenBetsView';
import BetSuccessMessage from '../messages/BetSuccessMessage';
import ImagePreview from '../messages/ImagePreview';
import BetConfirmation from '../messages/BetConfirmation';
import RegularMessage from '../messages/RegularMessage';
import { BetSlipMessage } from './BetSlipMessage';
import { memo, useMemo } from 'react';

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

export default function ChatMessage({ message, onConfirmAction, onCancelAction }) {
  const isUser = message.role === 'user';

  // Memoize the message content parsing
  const parsedContent = useMemo(() => {
    if (message.type === 'text' && typeof message.content === 'string') {
      try {
        return JSON.parse(message.content);
      } catch (e) {
        return null;
      }
    }
    return message.content;
  }, [message.type, message.content]);

  // Handle confirmation message
  if (message.type === 'text' && message.requiresConfirmation === true && message.action) {
    console.log('Rendering confirmation message:', message);
    return (
      <BetConfirmation 
        message={message}
        onConfirm={onConfirmAction}
        onCancel={onCancelAction}
      />
    );
  }

  // Handle bet slip form
  if (message.type === 'betslip') {
    const betSlipData = typeof message.content === 'string' ? 
      JSON.parse(message.content) : 
      message.content;

    // Calculate payout based on stake and odds
    const calculatePayout = (stake, odds) => {
      const numStake = parseFloat(stake);
      const numOdds = parseInt(odds.replace(/[^-\d]/g, ''));
      
      if (isNaN(numStake) || isNaN(numOdds)) return 19.52;
      
      if (numOdds > 0) {
        return (numStake + (numStake * numOdds) / 100).toFixed(2);
      } else if (numOdds < 0) {
        return (numStake + (numStake * 100) / Math.abs(numOdds)).toFixed(2);
      }
      return numStake.toFixed(2);
    };

    // Create a properly formatted bet slip data object
    const formattedBetSlipData = {
      type: betSlipData.type || 'Spread',
      sport: betSlipData.sport || 'NFL',
      team1: betSlipData.team1 || '',
      team2: betSlipData.team2 || '',
      line: betSlipData.type === 'Moneyline' ? 'ML' : (betSlipData.line || ''),
      odds: betSlipData.odds?.toString() || '-110',
      pick: betSlipData.pick || betSlipData.team1 || '',
      stake: parseFloat(betSlipData.stake || '10'),
      payout: parseFloat(betSlipData.payout || calculatePayout(betSlipData.stake || '10', betSlipData.odds || '-110'))
    };

    console.log('Formatted bet slip data:', formattedBetSlipData);

    // Create a stable key for the wrapper
    const wrapperKey = `${formattedBetSlipData.team1}-${formattedBetSlipData.team2}-${formattedBetSlipData.type}-${formattedBetSlipData.odds}`;
    
    return (
      <MemoizedBetSlipWrapper 
        key={wrapperKey}
        data={formattedBetSlipData}
        onSubmit={(confirmationMessage) => {
          console.log('Submitting bet with data:', formattedBetSlipData);
          const confirmMessage = {
            role: 'assistant',
            type: 'text',
            requiresConfirmation: true,
            content: `Would you like to place this bet?\n` +
                    `${formattedBetSlipData.team1} vs ${formattedBetSlipData.team2}\n` +
                    `${formattedBetSlipData.type} bet @ ${formattedBetSlipData.odds}\n` +
                    `Line: ${formattedBetSlipData.line}\n` +
                    `Stake: $${formattedBetSlipData.stake}\n` +
                    `Potential Payout: $${formattedBetSlipData.payout}`,
            action: {
              name: 'place_bet',
              ...formattedBetSlipData,
              line: formattedBetSlipData.type === 'Moneyline' ? 'ML' : formattedBetSlipData.line,
              status: 'pending'
            }
          };
          onConfirmAction(confirmMessage);
        }}
      />
    );
  }

  // Handle bet success message
  if (message.type === 'text' && parsedContent?.type === 'bet_success') {
    return <BetSuccessMessage betData={parsedContent.data} />;
  }

  // Handle image preview
  if (message.type === 'image') {
    return <ImagePreview message={message} />;
  }

  // Handle open bets display
  if (message.type === 'open_bets') {
    return (
      <div className="w-full mb-4">
        <div className="flex justify-start items-start space-x-3">
          <div className="relative w-9 h-9 rounded-xl shadow-lg group">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-gradient-x opacity-90"></div>
            <div className="absolute inset-[1px] rounded-xl bg-gray-900 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-7 h-7 bg-blue-500/20 rounded-xl animate-ping"></div>
                <span className="relative text-sm font-medium bg-gradient-to-r from-blue-400 to-blue-300 text-transparent bg-clip-text">AI</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <OpenBetsView 
              bets={message.content} 
              onPlaceSimilar={(bet) => {
                onConfirmAction({
                  name: 'place_bet',
                  type: bet.type,
                  sport: bet.sport,
                  team1: bet.team1,
                  team2: bet.team2,
                  line: bet.line,
                  odds: bet.odds,
                  stake: bet.stake
                });
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Regular message display
  return <RegularMessage message={message} />;
}

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