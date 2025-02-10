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
      if (!isAuthenticated()) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Please login to perform this action.',
          type: 'text'
        }]);
        return;
      }
      
      // Handle bet placement
      if (action.name === 'place_bet') {
        // Add user confirmation message with more details
        setMessages(prev => [...prev, {
          role: 'user',
          content: `Confirming bet:\n` +
                  `Type: ${action.type}\n` +
                  `Sport: ${action.sport}\n` +
                  `${action.team1} vs ${action.team2}\n` +
                  `Line: ${action.line}\n` +
                  `Odds: ${action.odds}\n` +
                  `Stake: $${action.stake}`,
          type: 'text'
        }]);

        // Format bet data
        const betData = {
          type: action.type || 'Spread',
          sport: action.sport || 'NBA',
          team1: action.team1,
          team2: action.team2,
          line: action.line?.toString() || '0',
          odds: parseInt(action.odds?.toString() || '-110'),
          stake: parseFloat(action.stake?.toString() || '0'),
        };

        // Calculate payout
        const calculatePayout = (stake, odds) => {
          let payout = stake;
          if (odds > 0) {
            payout += (stake * odds) / 100;
          } else if (odds < 0) {
            payout += (stake * 100) / Math.abs(odds);
          }
          return parseFloat(payout.toFixed(2));
        };

        // Add calculated payout
        betData.payout = calculatePayout(betData.stake, betData.odds);

        // Validate required fields
        if (!betData.type || !betData.sport || !betData.team1 || !betData.team2 || 
            isNaN(betData.odds) || isNaN(betData.stake) || betData.stake <= 0) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Invalid bet data. Please make sure all fields are filled correctly.',
            type: 'text'
          }]);
          return;
        }

        // Submit bet directly to bets API
        const token = localStorage.getItem('token');
        const betResponse = await fetch('/api/bets/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(betData)
        });

        const responseData = await betResponse.json();
        
        if (!betResponse.ok) {
          if (betResponse.status === 401) {
            localStorage.removeItem('token');
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: 'Your session has expired. Please login again.',
              type: 'text'
            }]);
          } else {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Error: ${responseData.message || 'Failed to place bet'}`,
              type: 'text'
            }]);
          }
          return;
        }

        // Add detailed success message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ Bet placed successfully!\n\n` +
                  `🎯 Bet Details:\n` +
                  `ID: ${responseData.bet._id}\n` +
                  `Type: ${betData.type}\n` +
                  `Sport: ${betData.sport}\n` +
                  `Matchup: ${betData.team1} vs ${betData.team2}\n` +
                  `Line: ${betData.line}\n` +
                  `Odds: ${betData.odds}\n` +
                  `Stake: $${betData.stake}\n` +
                  `Potential Payout: $${betData.payout}`,
          type: 'text'
        }]);

        // Also update the conversation with the bet ID
        if (conversationId) {
          await fetch('/api/chat/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              message: `Bet ${responseData.bet._id} placed successfully`,
              conversationId,
            }),
          });
        }

        return;
      }

      // Handle other actions through chat process
      const response = await fetch('/api/chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          confirmAction: action,
          conversationId: conversationId
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message.content,
          type: data.message.type || 'text'
        }]);
      } else {
        if (response.status === 401) {
          localStorage.removeItem('token');
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Your session has expired. Please login again.',
            type: 'text'
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Error: ${data.error || 'Failed to process action'}`,
            type: 'text'
          }]);
        }
      }
    } catch (error) {
      console.error('Error confirming action:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
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