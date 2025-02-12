import React, { useState, useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import MessageList from './MessageList';
import { getConversation, saveMessage } from '../utils/conversation';
import { authenticateUser } from '../utils/auth';

const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

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
        body: JSON.stringify({ message: content }),
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

  return (
    <div className="chat-container">
      <MessageList messages={messages} />
      <div ref={messagesEndRef} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatContainer; 