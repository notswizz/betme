import NewChatButton from '../chat/NewChatButton';
import TokenBalance from '../wallet/TokenBalance';
import BetStats from '../wallet/BetStats';

export default function SideMenu({ isSideMenuOpen, onNewChat }) {
  return (
    <>
      <div className={`fixed md:relative md:flex flex-col w-72 h-full bg-gray-900 border-r border-gray-800 transition-transform duration-300 ease-in-out z-30
                      ${isSideMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                      md:translate-x-0`}>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-20">
          <NewChatButton onClick={onNewChat} />
          <TokenBalance />
          <BetStats />
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isSideMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => onNewChat()}
        />
      )}
    </>
  );
} 