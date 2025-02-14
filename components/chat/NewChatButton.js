export default function NewChatButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full py-4 px-6 rounded-2xl overflow-hidden 
        transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
        shadow-xl hover:shadow-2xl mb-4"
    >
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-300/20 to-blue-400/0 
        opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-x"></div>
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10"></div>
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-300/20 rounded-full blur-3xl group-hover:bg-blue-300/30 transition-colors duration-500"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-300/20 rounded-full blur-3xl group-hover:bg-blue-300/30 transition-colors duration-500"></div>

      {/* Button Content */}
      <div className="relative flex items-center justify-center gap-4">
        {/* Icon Container */}
        <div className="flex items-center justify-center w-9 h-9 rounded-xl 
          bg-white/20 backdrop-blur-sm border border-white/20
          group-hover:border-white/30 transform transition-all duration-300 
          group-hover:rotate-180 group-hover:scale-110 group-hover:bg-white/30"
        >
          {/* Animated Plus Icon */}
          <svg 
            className="w-5 h-5 text-white transform transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.5} 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              className="group-hover:stroke-[3]"
            />
          </svg>
        </div>

        {/* Text */}
        <span className="text-base font-semibold text-white/90 group-hover:text-white
          transition-colors duration-200 tracking-wide"
        >
          Start New Chat
        </span>

        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
        ></div>
      </div>

      {/* Border Glow */}
      <div className="absolute inset-0 rounded-2xl border border-white/20 group-hover:border-white/40
        transition-colors duration-200 group-hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]"></div>
    </button>
  );
}