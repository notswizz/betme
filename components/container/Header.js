export default function Header({ onLogout }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
        {/* Left spacer for menu button on mobile */}
        <div className="w-10 md:w-0"></div>
        
        {/* Centered title */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">BetChat</h1>
              <p className="text-xs text-gray-500">AI-Powered Betting Assistant</p>
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="w-10 h-10 bg-gray-800/90 hover:bg-gray-700/90 text-gray-300 hover:text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
} 