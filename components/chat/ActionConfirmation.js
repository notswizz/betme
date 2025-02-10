export default function ActionConfirmation({ action, onConfirm, onCancel }) {
  const getActionDescription = (action) => {
    if (action.name === 'add_tokens') {
      return `Add ${action.amount} tokens to your balance`;
    }
    if (action.name === 'create_listing') {
      return `Create listing "${action.listingTitle}" for ${action.listingPrice} tokens`;
    }
    if (action.name === 'place_bet') {
      const stake = parseFloat(action.stake) || 0;
      const odds = parseInt(action.odds) || -110;
      const payout = calculatePayout(stake, odds);
      
      return `Place bet:\n` +
             `Type: ${action.type || 'Unknown'}\n` +
             `Sport: ${action.sport || 'Unknown'}\n` +
             `Teams: ${action.team1 || 'Unknown'} vs ${action.team2 || 'Unknown'}\n` +
             `Line: ${action.line || 'N/A'}\n` +
             `Odds: ${odds}\n` +
             `Stake: $${stake.toFixed(2)}\n` +
             `Potential Payout: $${payout}`;
    }
    return action.description || 'Unknown action';
  };

  const calculatePayout = (stake, odds) => {
    const numStake = parseFloat(stake) || 0;
    const numOdds = parseInt(odds) || 0;
    
    let payout = numStake;
    if (numOdds > 0) {
      payout += (numStake * numOdds) / 100;
    } else if (numOdds < 0) {
      payout += (numStake * 100) / Math.abs(numOdds);
    }
    return payout.toFixed(2);
  };

  return (
    <div className="border border-gray-700 rounded-lg p-4 mb-4 bg-gray-800 text-white">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">Confirm Action</h3>
        <div className="text-sm text-gray-300 whitespace-pre-line">
          {getActionDescription(action)}
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-lg hover:from-green-400 hover:to-green-300 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-500 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 