import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MobileMenuButton from '../container/MobileMenuButton';
import Header from '../container/Header';
import SideMenu from '../container/SideMenu';
import ChatArea from '../container/ChatArea';
import PlayerStatsCard from '../messages/PlayerStatsCard';
import BetList from '../messages/BetList';

export default function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [currentGameState, setCurrentGameState] = useState(null);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const [loadingStats, setLoadingStats] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTokenBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/actions/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTokenBalance(data.balance);
      } else {
        console.error('Error fetching token balance:', res.status);
      }
    } catch (error) {
      console.error('Error fetching token balance in ChatContainer:', error);
    }
  };

  useEffect(() => {
    fetchTokenBalance();
  }, []);

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setCurrentGameState(null);
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
      
      // Only add user message to UI if it's not a betslip and not empty
      if (userMessage.type !== 'betslip' && userMessage.content?.trim()) {
        setMessages(prev => [...prev, userMessage]);
      }

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Send message to API with messages array
      const response = await fetch('/api/chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [userMessage],
          conversationId,
          type,
          gameState: currentGameState
        })
      });

      // Debug logging
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        const errorMessage = data.message || data.error || 'Failed to process message';
        console.error('Chat error:', errorMessage);
        setError(errorMessage);
        return;
      }

      // Update conversation ID
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Handle the response message
      if (data.message) {
        const newMessage = data.message;
        
        // For player stats, show loading state while stats are being processed
        if (newMessage.type === 'player_stats') {
          setLoadingStats(true);
          setMessages(prev => {
            // Remove any previous stats cards and loading messages
            const filteredMessages = prev.filter(msg => 
              msg.type !== 'player_stats' && 
              !(msg.type === 'text' && msg.content === 'Loading stats...')
            );
            return [...filteredMessages, newMessage];
          });
          setLoadingStats(false);
        }
        // For bet slips, don't add to messages - they'll be rendered directly by ChatMessage
        else if (newMessage.type === 'betslip') {
          // Just update the latest message to be the betslip without any text
          setMessages(prev => {
            const withoutLastBetslip = prev.filter(msg => msg.type !== 'betslip');
            return [...withoutLastBetslip, { ...newMessage, text: null }];
          });
        }
        // For bet lists, just add the message
        else if (newMessage.type === 'bet_list') {
          console.log('Adding bet list message:', newMessage);
          // Remove any previous bet lists
          setMessages(prev => {
            const withoutBetLists = prev.filter(msg => msg.type !== 'bet_list');
            return [...withoutBetLists, newMessage];
          });
        }
        // For all other messages, add if they have content
        else if (typeof newMessage.content === 'string' ? newMessage.content.trim() : newMessage.content) {
          setMessages(prev => [...prev, newMessage]);
        }

        // Update current game state if provided
        if (newMessage.gameState) {
          setCurrentGameState(newMessage.gameState);
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setError(error.message || 'An error occurred while processing your message');
    } finally {
      setIsLoading(false);
      setLoadingStats(false);
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
        body: JSON.stringify({ messages: [], confirmAction: action, conversationId, gameState: currentGameState })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Action error:', data);
        throw new Error(data.message || data.error || 'Failed to process action');
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
        content: error.message || 'Sorry, there was an error processing your action. Please try again.'
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

  const handleAcceptBet = async (bet) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/actions/acceptBet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ betId: bet._id })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept bet');
      }

      // Add success message
      setMessages(prev => [...prev, {
        role: 'assistant',
        type: 'text',
        content: `✅ Bet accepted successfully! You've matched the bet for ${bet.team1} vs ${bet.team2}.`
      }]);

      // Refresh token balance
      fetchTokenBalance();

    } catch (error) {
      console.error('Error accepting bet:', error);
      setError(error.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        type: 'text',
        content: `❌ ${error.message || 'Failed to accept bet. Please try again.'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBetAction = async (action, data) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Handling bet action in ChatContainer:', { action, data });

      if (action === 'accept_bet') {
        const response = await fetch('/api/actions/acceptBet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ betId: data.betId })
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to accept bet');
        }

        // Add success message
        setMessages(prev => [...prev, {
          role: 'assistant',
          type: 'text',
          content: `✅ Bet accepted successfully!`
        }]);

        // Refresh token balance
        fetchTokenBalance();

        // Refresh the bets list
        handleNewMessage('Show open bets');
      } 
      else if (action === 'choose_winner' || action === 'game_not_over') {
        const response = await fetch('/api/actions/judge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            action,
            betId: data.betId,
            winner: data.winner // only for choose_winner action
          })
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to process judging action');
        }

        // Add success message
        setMessages(prev => [...prev, {
          role: 'assistant',
          type: 'text',
          content: action === 'choose_winner' 
            ? `✅ Vote recorded for ${data.winner}`
            : '✅ Marked game as not over yet'
        }]);

        // Refresh the bets list
        handleNewMessage('Show bets to judge');
      }
    } catch (error) {
      console.error('Error handling bet action:', error);
      setError(error.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        type: 'text',
        content: `❌ ${error.message || 'Failed to process action. Please try again.'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message) => {
    switch (message.type) {
      case 'bet_list':
        return (
          <BetList
            bets={message.content}
            text={message.text}
            onAction={handleBetAction}
          />
        );
      case 'player_stats':
        return <PlayerStatsCard stats={message.content} />;
      default:
        return message.content;
    }
  };

  return (
    <div className="flex h-full relative w-full overflow-hidden">
      <SideMenu 
        isSideMenuOpen={isSideMenuOpen} 
        onNewChat={startNewChat}
        onClose={() => {
          setIsSideMenuOpen(false);
          // Add a small delay before allowing the menu to be reopened
          const button = document.querySelector('.mobile-menu-button');
          if (button) {
            button.disabled = true;
            setTimeout(() => {
              button.disabled = false;
            }, 300); // Match the duration of the menu animation
          }
        }}
      />
      
      <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden">
        <Header onLogout={handleLogout} onMenuToggle={() => setIsSideMenuOpen(!isSideMenuOpen)} />
        
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          error={error}
          onNewMessage={handleNewMessage}
          onConfirmAction={handleConfirmAction}
          onCancelAction={handleCancelAction}
          onAcceptBet={handleAcceptBet}
          onBetAction={handleBetAction}
          loadingStats={loadingStats}
          messagesEndRef={messagesEndRef}
          gameState={currentGameState}
        />
      </div>
    </div>
  );
} 