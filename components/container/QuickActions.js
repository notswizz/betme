import Scoreboard from '../scoreboard/Scoreboard';

export default function QuickActions({ onAction }) {
  const actions = [
    {
      message: "I want to place a bet",
      icon: "🎯",
      label: "Place Bet"
    },
    {
      message: "Show me open bets",
      icon: "🎲",
      label: "View Bets" 
    },
    {
      message: "Show me my bets",
      icon: "📊",
      label: "My Bets"
    },
    {
      message: "How does this work?",
      icon: "❓", 
      label: "WTF?"
    }
  ];

  return (
    <div className="h-full flex flex-col justify-start">
      <div className="w-full max-w-full">
        <Scoreboard />
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-md mx-auto px-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => onAction(action.message)}
              className="group relative aspect-[2/1] overflow-hidden rounded-2xl"
            >
              {/* Rich gradient background with subtle animation */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-800/40 via-indigo-700/40 to-purple-800/40 animate-gradient-xy"></div>
              
              {/* Enhanced glass morphism */}
              <div className="absolute inset-[1px] rounded-2xl bg-gray-900/95 backdrop-blur-2xl border border-gray-700/50 group-hover:border-blue-400/60 transition-all duration-500 shadow-lg">
                {/* Enhanced glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-blue-500/30 blur-2xl"></div>
                </div>
                
                {/* Refined content layout */}
                <div className="relative h-full flex items-center justify-center gap-4 p-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/40 to-indigo-600/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <span className="text-xl group-hover:animate-pulse">{action.icon}</span>
                  </div>
                  <div className="font-semibold text-gray-200 group-hover:text-white text-center text-sm tracking-wider transition-colors duration-300">
                    {action.label}
                  </div>
                </div>
              </div>

              {/* Enhanced corner accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400/40 rounded-tl group-hover:border-blue-400/80 transition-colors duration-300"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-400/40 rounded-tr group-hover:border-blue-400/80 transition-colors duration-300"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-400/40 rounded-bl group-hover:border-blue-400/80 transition-colors duration-300"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400/40 rounded-br group-hover:border-blue-400/80 transition-colors duration-300"></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 