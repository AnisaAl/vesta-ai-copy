import { useState, useRef, useEffect } from 'react';
import ChatContainer from '@/components/chat/ChatContainer';
import ChatInput from '@/components/chat/ChatInput';
import Header from '@/components/chat/Header';
import HistorySidebar from '@/components/chat/HistorySidebar';
import { useChat } from '@/hooks/useChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { History, X } from 'lucide-react';

export default function Home() {
  const { messages, sendMessage, isLoading, clearChat, loadChatHistory, chatHistoryId } = useChat();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const isMobile = useIsMobile();

  // Handle selecting a chat history from the sidebar
  const handleSelectHistory = (historyId: number) => {
    loadChatHistory(historyId);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-screen flex bg-background">
      {/* History sidebar - hidden on mobile by default */}
      {showSidebar && (
        <div className={`${isMobile ? 'fixed inset-0 z-50 bg-background' : 'w-80'}`}>
          <HistorySidebar 
            onSelectHistory={handleSelectHistory} 
            currentHistoryId={chatHistoryId} 
          />
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setShowSidebar(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>
      )}
      
      {/* Main chat area */}
      <div className={`flex flex-col flex-1 ${showSidebar && !isMobile ? 'ml-80' : ''}`}>
        <Header 
          onClearChat={clearChat}
          onToggleHistory={() => setShowSidebar(!showSidebar)}
          showingHistory={showSidebar}
        />
        <ChatContainer 
          messages={messages} 
          ref={chatContainerRef}
        />
        <ChatInput 
          onSend={sendMessage} 
          isLoading={isLoading} 
        />
        
        {/* Mobile history toggle button */}
        {isMobile && !showSidebar && (
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-20 right-4 rounded-full h-12 w-12 shadow-md"
            onClick={() => setShowSidebar(true)}
          >
            <History className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
