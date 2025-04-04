import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { ChatHistoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useChatHistories() {
  const [chatHistories, setChatHistories] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // For simplicity, we're using a dummy user ID (1)
  // In a real app, this would come from authentication
  const dummyUserId = 1;

  const fetchChatHistories = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('GET', `/api/chat/histories/${dummyUserId}`);
      
      if (response.ok) {
        const data = await response.json();
        setChatHistories(data);
      } else {
        console.error('Failed to fetch chat histories');
        toast({
          title: "Error",
          description: "Failed to load chat histories.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching chat histories:', error);
      toast({
        title: "Error",
        description: "Failed to load chat histories.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    chatHistories,
    isLoading,
    fetchChatHistories
  };
}