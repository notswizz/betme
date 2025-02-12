import React, { useState } from 'react';

const ChatInput = ({ onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    await onSendMessage(inputValue);
    setInputValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input">
      <input
        type="text"
        placeholder="Type your message..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="input-field"
      />
      <button type="submit" className="send-button">
        Send
      </button>
    </form>
  );
};

export default ChatInput; 