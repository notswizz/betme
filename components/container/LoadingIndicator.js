export default function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
    </div>
  );
} 