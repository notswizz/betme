import ChatMessage from '../chat/ChatMessage';
import ChatInput from '../chat/ChatInput';
import QuickActions from './QuickActions';
import LoadingIndicator from './LoadingIndicator';

export default function ChatArea({ 
  messages, 
  isLoading, 
  error, 
  onNewMessage, 
  onConfirmAction, 
  onCancelAction,
  onAcceptBet,
  messagesEndRef,
  gameState
}) {
  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Messages Section */}
      <div className="flex-1 overflow-y-auto pt-20 pb-20 overscroll-none">
        <div className="w-full max-w-4xl mx-auto px-4">
          {messages.length === 0 ? (
            <QuickActions onAction={onNewMessage} />
          ) : (
            <div className="space-y-2 py-2">
              {messages.map((msg, index) => (
                <div key={index} className="snap-start">
                  <ChatMessage
                    message={msg}
                    onConfirmAction={onConfirmAction}
                    onCancelAction={onCancelAction}
                    onAcceptBet={onAcceptBet}
                    gameState={gameState}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} className="h-2" />
            </div>
          )}
          {isLoading && <LoadingIndicator />}
          {error && (
            <div className="text-red-500 text-sm text-center py-4">{error}</div>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900 to-gray-900/0 pt-4">
        <div className="w-full max-w-4xl mx-auto px-4 pb-4">
          <ChatInput 
            onSubmit={onNewMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
} 