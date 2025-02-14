export default function Header({ onLogout, onMenuToggle, children }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
        {/* Menu button */}
        <div className="w-10 flex items-center">
          {children ? children : (onMenuToggle ? (
            <button onClick={onMenuToggle} className="p-2 rounded-md hover:bg-gray-800">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          ) : null)}
        </div>
        
        {/* Centered title */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg relative group overflow-hidden">
              {/* Animated background gradients */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-x"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              {/* Glowing ring */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"></div>
              {/* Logo text */}
              <span className="relative text-base font-bold bg-gradient-to-br from-blue-400 via-indigo-400 to-blue-400 text-transparent bg-clip-text group-hover:from-blue-300 group-hover:to-indigo-300 transition-all duration-300">BB</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 text-transparent bg-clip-text tracking-tight group-hover:from-blue-300 group-hover:to-indigo-300">BetBot</h1>
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="w-10 h-10 bg-gray-800/90 hover:bg-gray-700/90 text-gray-300 hover:text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg border border-gray-700/50 hover:border-gray-600/50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
} 