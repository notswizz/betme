import MessageAvatar from './MessageAvatar';
import ListingView from '../chat/ListingView';

export default function RegularMessage({ message }) {
  const isUser = message.role === 'user';
  
  // Get message content safely
  const content = typeof message === 'string' ? message : message?.content;
  if (!content) return null;

  // Parse listings from message content if it exists
  const parseListings = (text) => {
    if (typeof text !== 'string') return null;
    
    try {
      if (text.includes('Current listings:')) {
        const listingsData = text.split('Current listings:\n')[1];
        if (!listingsData) return null;
        
        return listingsData.split('\n').map(listing => {
          const match = listing.match(/^• "(.*)" for (\d+) tokens$/);
          if (match) {
            return {
              _id: Math.random().toString(),
              title: match[1],
              tokenPrice: parseInt(match[2]),
              createdAt: new Date(),
              status: 'active'
            };
          }
          return null;
        }).filter(Boolean);
      }
      return null;
    } catch (error) {
      console.error('Error parsing listings:', error);
      return null;
    }
  };

  // Format content for display
  const formatContent = (text) => {
    if (typeof text !== 'string') return '';
    
    if (text.includes('Current listings:')) {
      return <p className="text-sm mb-1">Available Listings:</p>;
    }

    if (text.includes('\n')) {
      return text.split('\n').map((line, i) => (
        <p key={i} className="text-sm mb-1">{line}</p>
      ));
    }
    return <p className="text-sm">{text}</p>;
  };

  const listings = parseListings(content);
  
  return (
    <div className="mb-4">
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start space-x-3`}>
        {!isUser && <MessageAvatar isUser={false} />}
        <div className={`${listings ? 'w-full' : 'max-w-[85%] md:max-w-[70%]'} relative group
          ${isUser ? 'ml-4' : 'mr-4'}`}
        >
          {!isUser && (
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-gradient-x opacity-70 blur-[1px]"></div>
          )}
          <div className={`relative rounded-2xl p-4 shadow-xl backdrop-blur-sm border border-gray-700/30
            ${isUser 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
              : 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 text-white'
            }`}
          >
            <div className="space-y-2">
              {formatContent(content)}
              {listings && <ListingView listings={listings} />}
            </div>
          </div>
        </div>
        {isUser && <MessageAvatar isUser={true} />}
      </div>
    </div>
  );
} 