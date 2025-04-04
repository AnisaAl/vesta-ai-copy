import { useEffect } from 'react';
import { useChatHistories } from '@/hooks/useChatHistories';
import { ChatHistoryItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HistorySidebarProps {
  onSelectHistory: (historyId: number) => void;
  currentHistoryId: number | null;
}

export default function HistorySidebar({ onSelectHistory, currentHistoryId }: HistorySidebarProps) {
  const { chatHistories, isLoading, fetchChatHistories } = useChatHistories();
  
  useEffect(() => {
    fetchChatHistories();
  }, [fetchChatHistories]);
  
  // Get a preview of the conversation (first few words)
  const getPreviewText = (history: ChatHistoryItem): string => {
    const userMessages = history.messages.filter(msg => msg.role === 'user');
    if (userMessages.length === 0) return "No messages";
    
    const firstUserMessage = userMessages[0].content;
    const words = firstUserMessage.split(' ');
    const preview = words.slice(0, 5).join(' ');
    
    return words.length > 5 ? `${preview}...` : preview;
  };
  
  // Format the date to be more readable
  const formatDate = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "Unknown date";
    }
  };
  
  return (
    <div className="w-full h-full flex flex-col p-3 border-r">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchChatHistories}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>
      
      <ScrollArea className="flex-1 pr-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chatHistories.length > 0 ? (
          <div className="space-y-2">
            {chatHistories.map((history) => (
              <Button
                key={history.id}
                variant={currentHistoryId === history.id ? "default" : "ghost"}
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => onSelectHistory(history.id)}
              >
                <div className="flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-2 w-full">
                    <MessageCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium truncate">
                      {getPreviewText(history)}
                    </span>
                  </div>
                  <div className="flex justify-between w-full items-center">
                    <Badge variant="outline" className="text-xs">
                      {history.messages.filter(m => m.role === 'user').length} messages
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(history.createdAt)}
                    </span>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No chat history found
          </div>
        )}
      </ScrollArea>
    </div>
  );
}