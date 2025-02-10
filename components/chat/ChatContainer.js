import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MobileMenuButton from '../container/MobileMenuButton';
import Header from '../container/Header';
import SideMenu from '../container/SideMenu';
import ChatArea from '../container/ChatArea';
import PlayerStatsCard from '../messages/PlayerStatsCard';

export default function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const [loadingStats, setLoadingStats] = useState(false);

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
        // For bet slips, replace any existing bet slips
        else if (newMessage.type === 'betslip') {
          setMessages(prev => {
            const filteredMessages = prev.filter(msg => msg.type !== 'betslip');
            return [...filteredMessages, newMessage];
          });
        }
        // For all other messages, add if they have content
        else if (newMessage.content?.trim()) {
          setMessages(prev => [...prev, newMessage]);
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
        body: JSON.stringify({
          confirmAction: action,
          conversationId
        })
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

  return (
    <div className="flex h-[100dvh] bg-gray-900 overflow-hidden">
      <MobileMenuButton 
        isSideMenuOpen={isSideMenuOpen}
        onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
      />
      
      <Header onLogout={handleLogout} />
      
      <SideMenu 
        isSideMenuOpen={isSideMenuOpen}
        onNewChat={startNewChat}
      />
      
      <ChatArea 
        messages={messages}
        isLoading={isLoading}
        error={error}
        onNewMessage={handleNewMessage}
        onConfirmAction={handleConfirmAction}
        onCancelAction={handleCancelAction}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
} 