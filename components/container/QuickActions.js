import Scoreboard from '../scoreboard/Scoreboard';

export default function QuickActions({ onAction }) {
  const actions = [
    {
      message: "I want to place a bet",
      icon: "🎯",
      label: "Place a Bet"
    },
    {
      message: "Show me today's best bets",
      icon: "🔥",
      label: "Best Bets"
    },
    {
      message: "Show me open bets",
      icon: "📊",
      label: "Open Bets"
    },
    {
      message: "What's my token balance?",
      icon: "💰",
      label: "Check Balance"
    }
  ];

  return (
    <div className="h-full flex flex-col justify-start">
      <div className="w-full max-w-full">
        <Scoreboard />
        <div className="mt-8 grid grid-cols-2 gap-2 max-w-md mx-auto px-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => onAction(action.message)}
              className="aspect-[2/1] bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/70 hover:to-gray-900/70 rounded-xl border border-gray-700/30 hover:border-blue-500/30 p-2 group transition-all duration-200 hover:scale-[1.02]"
            >
              <div className="h-full flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <span className="text-base">{action.icon}</span>
                </div>
                <div className="font-medium text-gray-300 group-hover:text-white text-center text-sm">{action.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 