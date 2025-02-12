import React from 'react';

const MessageItem = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`message-item ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-content">{message.content}</div>
    </div>
  );
};

export default MessageItem; 