import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MobileMenuButton from '../container/MobileMenuButton';
import Header from '../container/Header';
import SideMenu from '../container/SideMenu';
import ChatArea from '../container/ChatArea';

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
        setMessages(prev => [...prev, {
          role: 'assistant',
          type: 'text',
          content: errorMessage
        }]);
        return;
      }

      // Update conversation ID
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Handle multiple messages in response
      if (Array.isArray(data.messages)) {
        setMessages(prev => {
          // Filter out any "Analyzing bet slip..." messages and empty messages
          const filteredPrev = prev.filter(msg => 
            !(msg.type === 'image' && msg.content === 'Analyzing bet slip...') &&
            msg.content?.trim()
          );
          return [...filteredPrev, ...data.messages];
        });
      } 
      // Handle single message response
      else if (data.message) {
        // If this is a bet slip, just add the bet slip (no confirmation needed yet)
        if (data.message.type === 'betslip') {
          setMessages(prev => {
            // Remove any previous bet slips and empty messages
            const filteredPrev = prev.filter(msg => 
              msg.type !== 'betslip' && 
              ((typeof msg.content === 'string' && msg.content.trim()) || 
               typeof msg.content === 'object') &&
              !(msg.type === 'text' && typeof msg.content === 'string' && !msg.content.trim())
            );
            return [...filteredPrev, data.message];
          });
        }
        // For all other messages, add them if they're not empty and not just whitespace
        else if ((typeof data.message.content === 'string' && data.message.content.trim()) || 
                 typeof data.message.content === 'object') {
          setMessages(prev => {
            // Filter out any "Analyzing bet slip..." messages, empty messages, and plain text messages without content
            const filteredPrev = prev.filter(msg => 
              !(msg.type === 'image' && msg.content === 'Analyzing bet slip...') &&
              ((typeof msg.content === 'string' && msg.content.trim()) || 
               typeof msg.content === 'object') &&
              !(msg.type === 'text' && typeof msg.content === 'string' && !msg.content.trim())
            );
            return [...filteredPrev, data.message];
          });
        }
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