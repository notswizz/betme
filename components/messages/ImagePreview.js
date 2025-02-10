export default function ImagePreview({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className="mb-2 md:mb-4">
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[70%] rounded-lg overflow-hidden bg-white shadow-md">
          <img 
            src={message.imageUrl} 
            alt="Uploaded bet slip"
            className="w-full h-auto"
          />
          <div className="mt-2 text-sm text-gray-500 p-2">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
} 