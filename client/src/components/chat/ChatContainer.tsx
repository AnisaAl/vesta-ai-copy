import React, { forwardRef } from 'react';
import { Message } from '@/lib/types';
import ChatBubble from './ChatBubble';

interface ChatContainerProps {
  messages: Message[];
}

const ChatContainer = forwardRef<HTMLDivElement, ChatContainerProps>(
  ({ messages }, ref) => {
    function formatTime(timestamp: string): string {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return (
      <main className="flex-1 overflow-y-auto px-4 py-6" ref={ref}>
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`flex flex-col ${message.role === 'user' ? 'items-end' : ''} space-y-2 mb-6`}
          >
            <ChatBubble 
              message={message}
            />
            <span 
              className={`text-xs text-[#6B6B6B] ${
                message.role === 'user' ? 'mr-2' : 'ml-10'
              }`}
            >
              {formatTime(message.timestamp)}
            </span>
          </div>
        ))}
      </main>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';

export default ChatContainer;
