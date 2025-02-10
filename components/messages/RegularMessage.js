import React from 'react';
import ListingView from '../chat/ListingView';

export default function RegularMessage({ message, content: directContent }) {
  // Get role from message object, defaulting to 'assistant' if not found
  const role = message?.role || 'assistant';
  const isUser = role === 'user';
  
  // Get content safely
  const content = directContent || (typeof message === 'string' ? message : message?.content);

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
    <div className={`relative ${isUser ? 'ml-auto' : ''}`}>
      <div className={`relative rounded-2xl px-4 py-2 shadow-xl
        ${isUser 
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
          : 'bg-gray-800/60 backdrop-blur-sm text-gray-100'
        }`}
      >
        <div className="space-y-1">
          {formatContent(content)}
          {listings && <ListingView listings={listings} />}
        </div>
      </div>
    </div>
  );
} 