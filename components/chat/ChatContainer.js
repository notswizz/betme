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
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shadow-lg border border-gray-700"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Side Menu - Hidden on mobile by default, shown when isSideMenuOpen is true */}
      <div className={`fixed md:relative md:flex flex-col w-64 h-full bg-gray-900 border-r border-gray-800 p-4 space-y-4 transition-transform duration-300 ease-in-out z-40
                      ${isSideMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                      md:translate-x-0`}>
        <div className="flex-1 space-y-4">
          <NewChatButton onClick={startNewChat} />
          <TokenBalance />
          <BetStats />
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-all duration-200 flex items-center gap-2 group mt-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>

      {/* Overlay for mobile menu */}
      {isSideMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSideMenuOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Messages Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 snap-y snap-mandatory">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col">
              <div className="w-full mt-12">
                <Scoreboard />
                <div className="mt-12 grid grid-cols-2 gap-3 max-w-2xl mx-auto px-4">
                  <button
                    onClick={() => handleSendMessage("I want to place a bet")}
                    className="p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl text-sm text-gray-300 hover:text-white transition-all duration-200 text-left border border-gray-700/30 hover:border-blue-500/30 group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-blue-400 group-hover:text-blue-300">🎯</span>
                      Place a Bet
                    </span>
                  </button>
                  <button
                    onClick={() => handleSendMessage("Show me today's NBA scores")}
                    className="p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl text-sm text-gray-300 hover:text-white transition-all duration-200 text-left border border-gray-700/30 hover:border-blue-500/30 group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-blue-400 group-hover:text-blue-300">🏀</span>
                      Check Scores
                    </span>
                  </button>
                  <button
                    onClick={() => handleSendMessage("What are the best odds right now?")}
                    className="p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl text-sm text-gray-300 hover:text-white transition-all duration-200 text-left border border-gray-700/30 hover:border-blue-500/30 group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-blue-400 group-hover:text-blue-300">📊</span>
                      Best Odds
                    </span>
                  </button>
                  <button
                    onClick={() => handleSendMessage("What's my token balance?")}
                    className="p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl text-sm text-gray-300 hover:text-white transition-all duration-200 text-left border border-gray-700/30 hover:border-blue-500/30 group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-blue-400 group-hover:text-blue-300">💰</span>
                      Check Balance
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
        <div className="p-4 bg-gray-900/50 border-t border-gray-800">
          <ChatInput 
            onSendMessage={handleSendMessage}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
} 