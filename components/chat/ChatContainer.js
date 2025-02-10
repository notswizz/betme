import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import NewChatButton from './NewChatButton';
import TokenBalance from '../wallet/TokenBalance';
import BetStats from '../wallet/BetStats';
import Scoreboard from '../scoreboard/Scoreboard';
import { isAuthenticated } from '@/utils/auth';

export default function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      // Handle bet placement directly if it's a bet action
      if (action.name === 'place_bet') {
        try {
          const result = await fetch('/api/bets/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              type: action.type,
              sport: action.sport,
              team1: action.team1,
              team2: action.team2,
              line: action.line,
              odds: parseInt(action.odds),
              stake: parseFloat(action.stake),
              payout: parseFloat(action.payout)
            })
          });

          const data = await result.json();

          if (!result.ok) {
            throw new Error(data.message || 'Failed to place bet');
          }

          // Add success message with bet details
          setMessages(prev => [...prev, {
            role: 'assistant',
            type: 'bet_success',
            content: data.bet
          }]);
          return;
        } catch (error) {
          console.error('Error placing bet:', error);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: error.message || 'Failed to place bet. Please try again.',
            type: 'text'
          }]);
          return;
        }
      }

      // Handle other actions through chat process
      const response = await fetch('/api/chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmAction: action,
          conversationId: conversationId
        })
      });
      
      const data = await response.json();

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="relative flex h-full">
      {/* Mobile Menu Toggle Button */}
      <button 
        onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-11 h-11 bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-lg border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 hover:scale-105"
      >
        <div className="relative w-5 h-5 flex flex-col justify-center gap-1">
          <span className={`block h-0.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-300 ${
            isSideMenuOpen ? 'w-5 -rotate-45 translate-y-1.5' : 'w-5'
          }`}></span>
          <span className={`block h-0.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-300 ${
            isSideMenuOpen ? 'w-0 opacity-0' : 'w-3.5'
          }`}></span>
          <span className={`block h-0.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-300 ${
            isSideMenuOpen ? 'w-5 rotate-45 -translate-y-1.5' : 'w-4'
          }`}></span>
        </div>
      </button>

      {/* Header Bar with Title - Sticky */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[72px] bg-gradient-to-b from-gray-900 to-gray-900/0 backdrop-blur-xl z-40">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group transition-all duration-300 hover:scale-110">
            <div className="relative">
              <div className="absolute inset-0 w-4 h-4 bg-blue-400/20 rounded-full animate-ping"></div>
              <span className="text-xl relative">🎯</span>
            </div>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 text-transparent bg-clip-text tracking-wide">
            BetChat
          </h1>
        </div>
      </div>

      {/* Mobile Logout Button - Always visible */}
      <button
        onClick={handleLogout}
        className="md:hidden fixed top-4 right-4 z-50 w-11 h-11 bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-lg border border-gray-700/50 hover:border-red-500/30 transition-all duration-300 hover:scale-105 group"
      >
        <div className="relative w-5 h-5">
          <svg className="absolute inset-0 w-5 h-5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rotate-180 scale-75 group-hover:scale-100 group-hover:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <svg className="absolute inset-0 w-5 h-5 text-gray-400 group-hover:opacity-0 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
      </button>

      {/* Side Menu - Hidden on mobile by default, shown when isSideMenuOpen is true */}
      <div className={`fixed md:relative md:flex flex-col w-64 h-full bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 border-r border-gray-800 p-4 space-y-4 transition-all duration-300 ease-in-out z-40
                      ${isSideMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} 
                      md:translate-x-0 md:shadow-none`}>
        <div className="flex-1 space-y-4">
          <NewChatButton onClick={startNewChat} />
          <TokenBalance />
          <BetStats />
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isSideMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsSideMenuOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-[100dvh] md:h-full">
        {/* Messages Section */}
        <div className="flex-1 overflow-y-auto p-4 pt-16 md:pt-8 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col">
              <div className="w-full mt-4">
                <Scoreboard />
                <div className="mt-6 grid grid-cols-2 gap-3 max-w-2xl mx-auto px-4">
                  <button
                    onClick={() => handleSendMessage("I want to place a bet")}
                    className="p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl text-sm text-gray-300 hover:text-white transition-all duration-200 text-left border border-gray-700/30 hover:border-blue-500/30 group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-blue-400 group-hover:text-blue-300">🎯</span>
                      <div className="font-medium">Place a Bet</div>
                    </span>
                  </button>
                  <button
                    onClick={() => handleSendMessage("Show me today's best bets")}
                    className="p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl text-sm text-gray-300 hover:text-white transition-all duration-200 text-left border border-gray-700/30 hover:border-blue-500/30 group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-blue-400 group-hover:text-blue-300">🔥</span>
                      <div className="font-medium">Best Bets</div>
                    </span>
                  </button>
                  <button
                    onClick={() => handleSendMessage("Show me today's scores")}
                    className="p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl text-sm text-gray-300 hover:text-white transition-all duration-200 text-left border border-gray-700/30 hover:border-blue-500/30 group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-blue-400 group-hover:text-blue-300">📊</span>
                      <div className="font-medium">Check Scores</div>
                    </span>
                  </button>
                  <button
                    onClick={() => handleSendMessage("What's my token balance?")}
                    className="p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl text-sm text-gray-300 hover:text-white transition-all duration-200 text-left border border-gray-700/30 hover:border-blue-500/30 group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-blue-400 group-hover:text-blue-300">📸</span>
                      <div className="font-medium">Upload Betslip</div>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className="snap-start">
                  <ChatMessage
                    message={msg}
                    onConfirmAction={handleConfirmAction}
                    onCancelAction={() => {
                      setMessages(prev => prev.slice(0, -1));
                    }}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </>
          )}
        </div>

        {/* Input Section */}
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-gray-900/80 backdrop-blur-lg border-t border-gray-800">
          <ChatInput 
            onSendMessage={handleSendMessage}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
} 