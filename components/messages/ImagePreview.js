import React from 'react';

const ImagePreview = ({ message }) => {
  // Early return with null if no message
  if (!message) {
    return null;
  }

  // Extract bet data
  const betData = message.content && typeof message.content === 'object' ? message.content : null;
  const isLoading = message.type === 'image' && (!betData || message.content === 'Analyzing bet slip...');

  return (
    <div className="relative max-w-sm mx-auto">
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
        <div className="text-sm text-gray-400">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <span className="mr-2">Processing bet slip...</span>
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : betData ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-blue-400">{betData.sport} - {betData.type}</p>
                <p className="text-green-400">Stake: ${betData.stake}</p>
              </div>
              <div className="border-t border-gray-700 my-2"></div>
              <div className="space-y-1">
                <p className="font-medium">{betData.team1} vs {betData.team2}</p>
                <p>Line: {betData.line}</p>
                <p>Odds: {betData.odds}</p>
                <p className="text-blue-400">Pick: {betData.pick}</p>
                {betData.payout && (
                  <p className="text-green-400 font-medium">Potential Payout: ${betData.payout}</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ImagePreview; 