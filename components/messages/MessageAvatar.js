export default function MessageAvatar({ isUser }) {
  if (isUser) {
    return (
      <div className="relative w-9 h-9 rounded-xl shadow-lg">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600"></div>
        <div className="absolute inset-[1px] rounded-xl bg-gray-900 flex items-center justify-center">
          <span className="text-sm font-medium text-blue-400">You</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-9 h-9 rounded-xl shadow-lg group">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-gradient-x opacity-90"></div>
      <div className="absolute inset-[1px] rounded-xl bg-gray-900 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-7 h-7 bg-blue-500/20 rounded-xl animate-ping"></div>
          <span className="relative text-sm font-medium bg-gradient-to-r from-blue-400 to-blue-300 text-transparent bg-clip-text">AI</span>
        </div>
      </div>
    </div>
  );
} 