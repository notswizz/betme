export default function MobileMenuButton({ isOpen, onClick, className = '' }) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.();
  };

  return (
    <button 
      onClick={handleClick}
      className={`block md:hidden w-10 h-10 bg-gray-800/90 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-lg border border-gray-700/50 ${className}`}
    >
      <div className="relative w-5 h-5 flex flex-col justify-center gap-1">
        <span className={`block h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${
          isOpen ? 'w-5 -rotate-45 translate-y-1.5' : 'w-5'
        }`}></span>
        <span className={`block h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${
          isOpen ? 'w-0 opacity-0' : 'w-3.5'
        }`}></span>
        <span className={`block h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${
          isOpen ? 'w-5 rotate-45 -translate-y-1.5' : 'w-4'
        }`}></span>
      </div>
    </button>
  );
} 