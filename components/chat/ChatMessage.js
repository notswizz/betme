import ActionConfirmation from './ActionConfirmation';
import ListingView from './ListingView';
import BetSlipMessage from './BetSlipMessage';

// Add this new component for open bets display
function OpenBetsView({ bets, onPlaceSimilar }) {
  // Parse the stringified bets if needed
  const parsedBets = typeof bets === 'string' ? JSON.parse(bets) : bets;
  
  if (!parsedBets || parsedBets.length === 0) {
    return (
      <div className="w-full p-6 rounded-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 text-center">
        <div className="text-gray-400">No open bets available right now</div>
        <div className="text-sm text-gray-500 mt-2">Check back later for new bets</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[95vw] mx-auto">
      {/* Scrollable Container */}
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
          {parsedBets.map((bet) => (
            <div 
              key={bet._id}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 hover:from-gray-800/70 hover:to-gray-900/70 
                         transition-all duration-200 cursor-pointer group border border-gray-700/30 backdrop-blur-sm
                         w-[280px] flex-shrink-0 transform hover:scale-[1.02]"
            >
              {/* Sport & Type Badge */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-400">{bet.sport}</span>
                </div>
                <div className="text-xs font-medium text-purple-400">
                  {bet.type}
                </div>
              </div>

              {/* Teams */}
              <div className="space-y-3 mb-4">
                {/* Team 1 */}
                <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                  <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    {bet.team1}
                  </span>
                </div>
                
                {/* Team 2 */}
                <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                  <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    {bet.team2}
                  </span>
                </div>
              </div>

              {/* Bet Details */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black/20 p-2 rounded-lg">
                  <div className="text-xs text-gray-500">Line</div>
                  <div className="text-sm font-medium text-white">{bet.line || '-'}</div>
                </div>
                <div className="bg-black/20 p-2 rounded-lg">
                  <div className="text-xs text-gray-500">Odds</div>
                  <div className="text-sm font-medium text-white">{bet.odds}</div>
                </div>
                <div className="bg-black/20 p-2 rounded-lg">
                  <div className="text-xs text-gray-500">Stake</div>
                  <div className="text-sm font-medium text-white">${bet.stake}</div>
                </div>
                <div className="bg-black/20 p-2 rounded-lg">
                  <div className="text-xs text-gray-500">Payout</div>
                  <div className="text-sm font-medium text-green-400">${bet.payout}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-[1fr,auto,1fr] gap-3 pt-3 border-t border-gray-700/30">
                {/* Bet Button */}
                <button 
                  onClick={() => onPlaceSimilar(bet)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-400/10 to-blue-500/10 animate-gradient-x"></div>
                  <span className="text-xl mb-0.5 transform group-hover:scale-110 transition-transform duration-300">🎯</span>
                  <span className="text-[11px] font-medium text-blue-400 group-hover:text-blue-300">Bet</span>
                </button>

                {/* Time */}
                <div className="flex flex-col items-center justify-center px-3">
                  <span className="text-[10px] text-gray-500">{bet.formattedTime || new Date(bet.createdAt).toLocaleTimeString()}</span>
                </div>
                
                {/* Share Button */}
                <button 
                  onClick={() => navigator.clipboard.writeText(bet._id)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 hover:from-indigo-500/30 hover:to-purple-600/30 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-400/10 to-indigo-500/10 animate-gradient-x"></div>
                  <span className="text-xl mb-0.5 transform group-hover:scale-110 transition-transform duration-300">🔗</span>
                  <span className="text-[11px] font-medium text-indigo-400 group-hover:text-indigo-300">Share</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
          initialData={typeof message.content === 'string' ? JSON.parse(message.content) : message.content}
          onSubmit={(data) => {
            onConfirmAction({
              name: 'place_bet',
              ...data
            });
          }}
        />
      </div>
    );
  }

  // Handle successful bet message
  if (message.role === 'assistant' && message.type === 'bet_success') {
    const betData = typeof message.content === 'string' ? JSON.parse(message.content) : message.content;
    return (
      <div className="mb-3">
        <div className={`flex justify-start items-start space-x-3`}>
          <div className="relative w-9 h-9 rounded-xl shadow-lg group">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-gradient-x opacity-90"></div>
            <div className="absolute inset-[1px] rounded-xl bg-gray-900 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-7 h-7 bg-blue-500/20 rounded-xl animate-ping"></div>
                <span className="relative text-sm font-medium bg-gradient-to-r from-blue-400 to-blue-300 text-transparent bg-clip-text">AI</span>
              </div>
            </div>
          </div>
          <div className="flex-1 max-w-[320px] rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 text-white shadow-xl border border-gray-700/30 backdrop-blur-sm">
            <div className="p-3 space-y-2">
              {/* Success Header */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-400">Bet Placed Successfully!</span>
              </div>
              
              {/* Main Bet Info */}
              <div className="bg-gray-900/50 rounded-xl p-3 space-y-3 border border-gray-800">
                {/* Type & Sport */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Type</div>
                    <div className="text-sm font-medium text-white">{betData.type}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Sport</div>
                    <div className="text-sm font-medium text-white">{betData.sport}</div>
                  </div>
                </div>

                {/* Matchup */}
                <div>
                  <div className="text-xs text-gray-500">Matchup</div>
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    <span>{betData.team1}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700">VS</span>
                    <span>{betData.team2}</span>
                  </div>
                </div>

                {/* Line & Odds */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Line</div>
                    <div className="text-sm font-medium text-white">{betData.line}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Odds</div>
                    <div className="text-sm font-medium text-white">{betData.odds}</div>
                  </div>
                </div>
              </div>

              {/* Stake & Payout */}
              <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-800">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Your Stake</div>
                    <div className="text-base font-semibold text-white">${parseFloat(betData.stake).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Potential Payout</div>
                    <div className="text-base font-semibold text-green-400">${betData.payout}</div>
                  </div>
                </div>
              </div>

              {/* Bet ID */}
              <div className="bg-gray-900/50 rounded-xl p-2 border border-gray-800">
                <div className="text-xs text-gray-500">Bet ID</div>
                <div className="font-mono text-xs text-gray-400 truncate">{betData._id}</div>
              </div>
            </div>
          </div>
        </div>
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
      <div className="mb-4 md:mb-6">
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start space-x-3`}>
          {!isUser && (
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white text-sm md:text-base font-medium">AI</span>
            </div>
          )}
          <div className={`max-w-[90%] md:max-w-[75%] rounded-2xl ${
            isUser 
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' 
              : 'bg-gradient-to-br from-gray-50 to-white text-gray-800'
          } shadow-xl border border-gray-700/10`}>
            <div className="p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-400">Bet Confirmation</span>
              </div>
              
              <div className="space-y-4">
                {/* Bet Details Section */}
                <div className="bg-black/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs opacity-70 mb-1">Type</div>
                      <div className="font-medium">{message.action.type}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-70 mb-1">Sport</div>
                      <div className="font-medium">{message.action.sport}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-xs opacity-70 mb-1">Matchup</div>
                    <div className="font-medium flex items-center gap-2">
                      <span>{message.action.team1}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-black/20">VS</span>
                      <span>{message.action.team2}</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs opacity-70 mb-1">Line</div>
                      <div className="font-medium">{message.action.line}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-70 mb-1">Odds</div>
                      <div className="font-medium">{message.action.odds}</div>
                    </div>
                  </div>
                </div>

                {/* Stake and Payout Section */}
                <div className="bg-black/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs opacity-70 mb-1">Your Stake</div>
                      <div className="text-lg font-semibold">${parseFloat(message.action.stake).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-70 mb-1">Potential Payout</div>
                      <div className="text-lg font-semibold text-green-400">${message.action.payout}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => onConfirmAction(message.action)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-lg hover:from-green-400 hover:to-green-300 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Confirm Bet
                </button>
                <button
                  onClick={onCancelAction}
                  className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-500 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          {isUser && (
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white text-sm md:text-base font-medium">You</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Add this new condition for open bets display
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
  const listings = parseListings(content);
  
  return (
    <div className="mb-4">
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start space-x-3`}>
        {!isUser && (
          <div className="relative w-9 h-9 rounded-xl shadow-lg group">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-gradient-x opacity-90"></div>
            <div className="absolute inset-[1px] rounded-xl bg-gray-900 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-7 h-7 bg-blue-500/20 rounded-xl animate-ping"></div>
                <span className="relative text-sm font-medium bg-gradient-to-r from-blue-400 to-blue-300 text-transparent bg-clip-text">AI</span>
              </div>
            </div>
          </div>
        )}
        <div className={`${listings ? 'w-full' : 'max-w-[85%] md:max-w-[70%]'} relative group
          ${isUser ? 'ml-4' : 'mr-4'}`}
        >
          {!isUser && (
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-gradient-x opacity-70 blur-[1px]"></div>
          )}
          <div className={`relative rounded-2xl p-4 shadow-xl backdrop-blur-sm border border-gray-700/30
            ${isUser 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
              : 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 text-white'
            }`}
          >
            <div className="space-y-2">
              {formatContent(content)}
              {listings && <ListingView listings={listings} />}
            </div>
          </div>
        </div>
        {isUser && (
          <div className="relative w-9 h-9 rounded-xl shadow-lg">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600"></div>
            <div className="absolute inset-[1px] rounded-xl bg-gray-900 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-400">You</span>
            </div>
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