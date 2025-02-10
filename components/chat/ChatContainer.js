import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import NewChatButton from './NewChatButton';
import TokenBalance from '../wallet/TokenBalance';
import BetStats from '../wallet/BetStats';
import Scoreboard from '../scoreboard/Scoreboard';
import { isAuthenticated } from '@/utils/auth';
import { useRouter } from 'next/router';

export default function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();

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

  const handleNewMessage = async (message, type = 'text') => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user message to UI immediately
      const userMessage = typeof message === 'object' ? message : {
        role: 'user',
        type: type,
        content: message
      };
      
      // Debug logging
      console.log('Sending message:', userMessage);
      
      setMessages(prev => [...prev, userMessage]);

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Send message to API
      const response = await fetch('/api/chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          type
        })
      });

      // Debug logging
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process message');
      }

      // Update conversation ID
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Handle multiple messages in response
      if (Array.isArray(data.messages)) {
        setMessages(prev => [...prev, ...data.messages]);
      } 
      // Handle single message response
      else if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setError(error.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        type: 'text',
        content: 'Sorry, there was an error processing your message. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async (action) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          confirmAction: action,
          conversationId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process action');
      }

      // Update messages with confirmation response
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }

    } catch (error) {
      console.error('Action error:', error);
      setError(error.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        type: 'text',
        content: 'Sorry, there was an error processing your action. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAction = () => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      type: 'text',
      content: 'Action cancelled. What would you like to do instead?'
    }]);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="flex h-[100dvh] bg-gray-900 overflow-hidden">
      {/* Mobile Menu Toggle Button */}
      <button 
        onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-gray-800/90 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-lg border border-gray-700/50"
      >
        <div className="relative w-5 h-5 flex flex-col justify-center gap-1">
          <span className={`block h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${
            isSideMenuOpen ? 'w-5 -rotate-45 translate-y-1.5' : 'w-5'
          }`}></span>
          <span className={`block h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${
            isSideMenuOpen ? 'w-0 opacity-0' : 'w-3.5'
          }`}></span>
          <span className={`block h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${
            isSideMenuOpen ? 'w-5 rotate-45 -translate-y-1.5' : 'w-4'
          }`}></span>
        </div>
      </button>

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
          {/* Left spacer for menu button on mobile */}
          <div className="w-10 md:w-0"></div>
          
          {/* Centered title */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">BetChat</h1>
                <p className="text-xs text-gray-500">AI-Powered Betting Assistant</p>
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-10 h-10 bg-gray-800/90 hover:bg-gray-700/90 text-gray-300 hover:text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Side Menu */}
      <div className={`fixed md:relative md:flex flex-col w-72 h-full bg-gray-900 border-r border-gray-800 transition-transform duration-300 ease-in-out z-30
                      ${isSideMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                      md:translate-x-0`}>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-20">
          <NewChatButton onClick={startNewChat} />
          <TokenBalance />
          <BetStats />
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isSideMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsSideMenuOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Messages Section */}
        <div className="flex-1 overflow-y-auto pt-14 pb-20 overscroll-none">
          <div className="w-full max-w-4xl mx-auto px-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center -mt-16">
                <div className="w-full max-w-full overflow-x-hidden">
                  <Scoreboard />
                  <div className="mt-4 grid grid-cols-2 gap-3 max-w-xl mx-auto px-4">
                    <button
                      onClick={() => handleNewMessage("I want to place a bet")}
                      className="aspect-[4/3] bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/70 hover:to-gray-900/70 rounded-2xl border border-gray-700/30 hover:border-blue-500/30 p-4 group transition-all duration-200 hover:scale-[1.02]"
                    >
                      <div className="h-full flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <span className="text-xl">🎯</span>
                        </div>
                        <div className="font-medium text-gray-300 group-hover:text-white text-center text-sm">Place a Bet</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleNewMessage("Show me today's best bets")}
                      className="aspect-[4/3] bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/70 hover:to-gray-900/70 rounded-2xl border border-gray-700/30 hover:border-blue-500/30 p-4 group transition-all duration-200 hover:scale-[1.02]"
                    >
                      <div className="h-full flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <span className="text-xl">🔥</span>
                        </div>
                        <div className="font-medium text-gray-300 group-hover:text-white text-center text-sm">Best Bets</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleNewMessage("Show me open bets")}
                      className="aspect-[4/3] bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/70 hover:to-gray-900/70 rounded-2xl border border-gray-700/30 hover:border-blue-500/30 p-4 group transition-all duration-200 hover:scale-[1.02]"
                    >
                      <div className="h-full flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <span className="text-xl">📊</span>
                        </div>
                        <div className="font-medium text-gray-300 group-hover:text-white text-center text-sm">Open Bets</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleNewMessage("What's my token balance?")}
                      className="aspect-[4/3] bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/70 hover:to-gray-900/70 rounded-2xl border border-gray-700/30 hover:border-blue-500/30 p-4 group transition-all duration-200 hover:scale-[1.02]"
                    >
                      <div className="h-full flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <span className="text-xl">💰</span>
                        </div>
                        <div className="font-medium text-gray-300 group-hover:text-white text-center text-sm">Check Balance</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                {messages.map((msg, index) => (
                  <div key={index} className="snap-start">
                    <ChatMessage
                      message={msg}
                      onConfirmAction={handleConfirmAction}
                      onCancelAction={handleCancelAction}
                    />
                  </div>
                ))}
                <div ref={messagesEndRef} className="h-2" />
              </div>
            )}
            {isLoading && (
              <div className="flex items-center justify-center space-x-2 py-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
              </div>
            )}
            {error && (
              <div className="text-red-500 text-sm text-center py-4">{error}</div>
            )}
          </div>
        </div>

        {/* Input Section */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900 to-gray-900/0 pt-4">
          <div className="w-full max-w-4xl mx-auto px-4 pb-4">
            <ChatInput 
              onSubmit={handleNewMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 