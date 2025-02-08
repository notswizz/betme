export default function NewChatButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl 
      hover:from-emerald-600 hover:to-green-700 transform transition-all duration-200 
      hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl 
      flex items-center justify-center gap-2 mb-4"
    >
      <svg 
        className="w-5 h-5" 
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
      Start New Chat
    </button>
  );
}