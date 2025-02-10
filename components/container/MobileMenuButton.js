export default function MobileMenuButton({ isSideMenuOpen, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-gray-800/90 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-lg border border-gray-700/50"
    >
      <div className="relative w-5 h-5 flex flex-col justify-center gap-1">
        <span className={`block h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${
          isSideMenuOpen ? 'w-5 -rotate-45 translate-y-1.5' : 'w-5'
        }`}></span>
        <span className={`block h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${
          isSideMenuOpen ? 'w-0 opacity-0' : 'w-3.5'
        }`}></span>
        <span className={`block h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${
          isSideMenuOpen ? 'w-5 rotate-45 -translate-y-1.5' : 'w-4'
        }`}></span>
      </div>
    </button>
  );
} 