import { useEffect, useRef } from 'react';
import NewChatButton from '../chat/NewChatButton';
import TokenBalance from '../wallet/TokenBalance';
import BetStats from '../wallet/BetStats';

export default function SideMenu({ isSideMenuOpen, onNewChat, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isSideMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSideMenuOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 
          ${isSideMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />

      {/* Side Menu */}
      <div
        ref={menuRef}
        className={`fixed left-0 top-0 h-full w-[min(100vw,400px)] bg-gradient-to-b from-gray-900 to-gray-950 
          shadow-2xl z-50 transform transition-transform duration-300 ease-out
          ${isSideMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-800">
          {/* Header with Logo */}
          <div className="sticky top-0 z-10 bg-gradient-to-b from-gray-900 via-gray-900 to-transparent pb-6">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 
                  flex items-center justify-center shadow-lg relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-blue-400/0 
                    opacity-0 group-hover:opacity-100 animate-gradient-x transition-opacity duration-700"></div>
                  <span className="text-lg font-bold text-white">BB</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-100 to-blue-300 
                  bg-clip-text text-transparent">BetBot</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Menu Content */}
          <div className="px-4 space-y-4 pb-8">
            {/* New Chat Button */}
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <NewChatButton onClick={() => {
                onNewChat();
                onClose();
              }} />
            </div>

            {/* Token Balance */}
            <div className="transform transition-all duration-300 hover:scale-[1.01]">
              <TokenBalance />
            </div>

            {/* Stats Section */}
            <div className="transform transition-all duration-300 hover:scale-[1.01]">
              <BetStats />
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 