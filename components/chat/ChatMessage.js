import ActionConfirmation from './ActionConfirmation';
import ListingView from './ListingView';
import BetSlipMessage from './BetSlipMessage';

export default function ChatMessage({ message, onConfirmAction, onCancelAction }) {
  const isUser = message.role === 'user';

  // Helper function to parse game data from raw text
  const parseGameFromText = (text) => {
    try {
      // Looking at your example: "8/23-T8D = Kksu 0-0 E 1su 0-0"
      const parts = text.split(/\s+/);
      
      return {
        type: 'SINGLE',
        sport: 'Soccer', // Default to soccer for scores like 0-0
        date: parts[0], // 8/23-T8D
        team1: parts[2], // Kksu
        team2: parts[5], // 1su
        line: '0-0',
        pick: parts[2], // Default to first team
        odds: '-110', // Default odds
        stake: '10', // Default stake
        payout: '19.09', // Calculated based on default odds and stake
        notes: `Raw data: ${text}`
      };
    } catch (error) {
      console.error('Error parsing game data:', error);
      return {
        type: 'SINGLE',
        sport: 'Unknown',
        date: new Date().toLocaleDateString(),
        team1: '',
        team2: '',
        line: '',
        pick: '',
        odds: '',
        stake: '10',
        payout: '0',
        notes: `Failed to parse: ${text}`
      };
    }
  };

  // Handle bet slip form - return early to prevent double rendering
  if (message.type === 'betslip') {
    return (
      <div className="w-full">
        <BetSlipMessage 
          initialData={message.content} 
          onSubmit={(data) => onConfirmAction({
            name: 'place_bet',
            ...data
          })}
        />
      </div>
    );
  }

  // Handle image preview
  if (message.type === 'image') {
    return (
      <div className="mb-2 md:mb-4">
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className="max-w-[70%] rounded-lg overflow-hidden bg-white shadow-md">
            <img 
              src={message.imageUrl} 
              alt="Uploaded bet slip"
              className="w-full h-auto"
            />
            <div className="mt-2 text-sm text-gray-500 p-2">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get message content safely
  const content = typeof message === 'string' ? message : message?.content;
  if (!content) return null;

  // Parse listings from message content if it exists
  const parseListings = (text) => {
    if (typeof text !== 'string') return null;
    
    try {
      if (text.includes('Current listings:')) {
        const listingsData = text.split('Current listings:\n')[1];
        if (!listingsData) return null;
        
        return listingsData.split('\n').map(listing => {
          const match = listing.match(/^• "(.*)" for (\d+) tokens$/);
          if (match) {
            return {
              _id: Math.random().toString(),
              title: match[1],
              tokenPrice: parseInt(match[2]),
              createdAt: new Date(),
              status: 'active'
            };
          }
          return null;
        }).filter(Boolean);
      }
      return null;
    } catch (error) {
      console.error('Error parsing listings:', error);
      return null;
    }
  };

  // Format content for display
  const formatContent = (text) => {
    if (typeof text !== 'string') return '';
    
    if (text.includes('Current listings:')) {
      return <p className="text-sm mb-1">Available Listings:</p>;
    }

    if (text.includes('\n')) {
      return text.split('\n').map((line, i) => (
        <p key={i} className="text-sm mb-1">{line}</p>
      ));
    }
    return <p className="text-sm">{text}</p>;
  };

  // Handle confirmation messages
  if (message.requiresConfirmation) {
    return (
      <div className="mb-2 md:mb-4">
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start space-x-2`}>
          {!isUser && (
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs md:text-sm">AI</span>
            </div>
          )}
          <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 md:p-4 ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-800 shadow-md'
          }`}>
            {formatContent(content)}
            <div className="mt-2">
              <ActionConfirmation 
                action={message.action}
                onConfirm={() => onConfirmAction(message.action)}
                onCancel={onCancelAction}
              />
            </div>
          </div>
          {isUser && (
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs md:text-sm">You</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular message display
  const listings = parseListings(content);
  
  return (
    <div className="mb-2 md:mb-4">
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start space-x-2`}>
        {!isUser && (
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs md:text-sm">AI</span>
          </div>
        )}
        <div className={`${listings ? 'w-full' : 'max-w-[85%] md:max-w-[70%]'} rounded-2xl p-3 md:p-4 ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-white text-gray-800 shadow-md'
        }`}>
          {formatContent(content)}
          {listings && <ListingView listings={listings} />}
        </div>
        {isUser && (
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs md:text-sm">You</span>
          </div>
        )}
      </div>
    </div>
  );
}

function parseBetSlipData(content) {
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

function handleBetSubmit(betSlipData) {
  try {
    return {
      type: 'action',
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