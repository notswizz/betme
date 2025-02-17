const BetList = ({ message, onAction }) => {
  console.log('BetList received message:', message);
  
  if (!message?.content || !Array.isArray(message.content)) {
    console.error('Invalid bet list data:', message);
    return null;
  }

  const bets = message.content;
  console.log('Rendering bets:', bets);

  if (bets.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No bets found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message.text && (
        <div className="text-lg font-semibold mb-4">
          {message.text}
        </div>
      )}
      {bets.map((bet) => (
        <BetCard
          key={bet.id}
          bet={bet}
          onAction={onAction}
        />
      ))}
    </div>
  );
};

export default BetList; 