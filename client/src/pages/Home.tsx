import { useState, useRef, useEffect } from 'react';
import ChatContainer from '@/components/chat/ChatContainer';
import ChatInput from '@/components/chat/ChatInput';
import Header from '@/components/chat/Header';
import { useChat } from '@/hooks/useChat';

export default function Home() {
  const { messages, sendMessage, isLoading, clearChat } = useChat();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onClearChat={clearChat} />
      <ChatContainer 
        messages={messages} 
        ref={chatContainerRef}
      />
      <ChatInput 
        onSend={sendMessage} 
        isLoading={isLoading} 
      />
    </div>
  );
}
