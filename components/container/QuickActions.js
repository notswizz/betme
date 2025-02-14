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
        <div className="mt-8 grid grid-cols-2 gap-3 max-w-md mx-auto px-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => onAction(action.message)}
              className="group relative aspect-[2/1] overflow-hidden"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20 animate-gradient-xy"></div>
              
              {/* Glass morphism effect */}
              <div className="absolute inset-[1px] rounded-xl bg-gray-900/90 backdrop-blur-xl border border-gray-700/30 group-hover:border-blue-500/50 transition-all duration-300">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl"></div>
                </div>
                
                {/* Content */}
                <div className="relative h-full flex items-center justify-center gap-3 p-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <span className="text-lg group-hover:animate-bounce">{action.icon}</span>
                  </div>
                  <div className="font-medium text-gray-300 group-hover:text-white text-center text-sm tracking-wide">
                    {action.label}
                  </div>
                </div>
              </div>

              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-blue-500/30 rounded-tl"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-blue-500/30 rounded-br"></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 