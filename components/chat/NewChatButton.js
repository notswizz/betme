export default function NewChatButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl 
      hover:from-blue-600 hover:to-blue-700 transform transition-all duration-200 
      hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl 
      flex items-center justify-center gap-2 mb-4 group"
    >
      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all duration-200">
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
      <span className="text-sm tracking-wide">Start New Chat</span>
    </button>
  );
}