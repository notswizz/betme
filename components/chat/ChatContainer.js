import { useState, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import NewChatButton from './NewChatButton';
import TokenBalance from '../wallet/TokenBalance';
import { isAuthenticated } from '@/utils/auth';

export default function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  const handleSendMessage = async (content) => {
    try {
      setLoading(true);

      // Handle bet slip and image messages locally (no API call needed)
      if (typeof content === 'object' && (content.type === 'image' || content.type === 'betslip')) {
        setMessages(prev => [...prev, content]);
        setLoading(false);
        return;
      }

      // Add user message immediately
      const userMessage = {
        role: 'user',
        content: typeof content === 'string' ? content : content.content,
        type: content.type || 'text'
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Only send text messages to API
      const res = await fetch('/api/chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          message: content,
          conversationId,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setConversationId(data.conversationId);
        // Add AI response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message.content,
          type: data.message.type || 'text'
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your message.',
        type: 'text'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (action) => {
    try {
      setLoading(true);

      // Check authentication first
      const token = localStorage.getItem('token');
      if (!token) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Please login to perform this action.',
          type: 'text'
        }]);
        return;
      }

      // Log for debugging
      console.log('Confirming action with token:', token);
      console.log('Action data:', action);

      // Format bet data if this is a bet action
      let confirmAction = action;
      if (action.name === 'place_bet') {
        // Parse numeric values
        const stake = parseFloat(action.stake);
        const odds = parseInt(action.odds);
        const payout = parseFloat(action.payout);

        confirmAction = {
          name: 'place_bet',
          type: action.type,
          sport: action.sport,
          team1: action.team1,
          team2: action.team2,
          line: action.line,
          odds: odds,
          stake: stake,
          payout: payout
        };
      }

      // Send all actions through chat process
      const response = await fetch(window.location.origin + '/api/chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmAction,
          conversationId: conversationId
        })
      });
      
      const data = await response.json();
      console.log('Action response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm action');
      }

      // Update messages with response
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }

    } catch (error) {
      console.error('Error confirming action:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: error.message || 'Failed to confirm action. Please try again.',
        type: 'text'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAction = () => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Action cancelled.',
      type: 'text'
    }]);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-72 border-r border-gray-700 bg-gray-800/50 backdrop-blur-sm overflow-y-auto">
        <div className="p-6">
          <NewChatButton onClick={startNewChat} />
          <TokenBalance />
        </div>
      </div>
      
      {/* Mobile header - just shows menu button */}
      <div className="md:hidden flex items-center p-4 border-b border-gray-700 bg-gray-800/50">
        <button 
          onClick={() => document.getElementById('mobile-sidebar').classList.toggle('hidden')}
          className="p-2 text-white hover:bg-gray-700 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile sidebar - includes both NewChatButton and TokenBalance */}
      <div id="mobile-sidebar" className="hidden fixed inset-0 z-50 md:hidden">
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => document.getElementById('mobile-sidebar').classList.add('hidden')}
        />
        <div className="absolute left-0 top-0 w-72 h-full bg-gray-800 shadow-lg flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-white font-semibold">Menu</h2>
            <button 
              onClick={() => document.getElementById('mobile-sidebar').classList.add('hidden')}
              className="p-2 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              <NewChatButton 
                onClick={() => {
                  startNewChat();
                  document.getElementById('mobile-sidebar').classList.add('hidden');
                }} 
              />
              <div className="border-t border-gray-700 pt-6">
                <TokenBalance />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-800">
          {messages.map((message, index) => (
            <div key={index} className="w-full transform transition-all duration-200 hover:scale-[1.01]">
              <ChatMessage 
                message={message}
                onConfirmAction={handleConfirmAction}
                onCancelAction={handleCancelAction}
              />
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm p-2 md:p-4">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
} 