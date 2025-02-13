import React, { useState, useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import MessageList from './MessageList';
import { getConversation, saveMessage } from '../utils/conversation';
import { authenticateUser } from '../utils/auth';
import { useRouter } from 'next/router';

const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  // Load conversation on component mount
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        // Authenticate the user
        const token = localStorage.getItem('jwtToken');
        const user = await authenticateUser(token);

        if (!user) {
          // Redirect to login or show error
          console.error('User not authenticated');
          return;
        }

        // Load existing conversation
        const conversation = await getConversation(user._id);
        setMessages(conversation);
      } catch (error) {
        console.error('Error loading conversation:', error);
      }
    };

    fetchConversation();
  }, []);

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to handle sending a message
  const handleSendMessage = async (content) => {
    try {
      const token = localStorage.getItem('jwtToken');

      // Add user's message to the state
      const newMessages = [...messages, { role: 'user', content }];
      setMessages(newMessages);

      // Send message to backend API
      const response = await fetch('/api/chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: [{ role: 'user', content }] }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add assistant's response to the state
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: 'assistant', content: data.message },
        ]);

        // Save messages to the conversation
        await saveMessage(newMessages);
      } else {
        console.error('Error from API:', data.error);
        // Handle error (e.g., show notification)
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error (e.g., show notification)
    }
  };

  const handleConfirmAction = async (action) => {
    // Ignore actions that are already marked as successful
    if (action.name && action.name.toLowerCase() === 'bet_success') {
      return;
    }

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
        const errorMessage = data.message || data.error || 'Failed to process action';
        console.error('Action error:', errorMessage);
        throw new Error(errorMessage);
      }

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

  return (
    <div className="chat-container">
      <MessageList messages={messages} />
      <div ref={messagesEndRef} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatContainer; 