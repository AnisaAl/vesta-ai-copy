import { useState, useCallback, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Message, ChatResponse } from '@/lib/types';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load initial welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: nanoid(),
      content: "Hi there! 👋 I'm your fashion assistant. I can help with style advice, fashion trends, outfit ideas, and more. What can I help you with today?",
      role: 'assistant',
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    try {
      if (!content.trim()) return;

      // Add user message
      const userMessage: Message = {
        id: nanoid(),
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      // Send to API
      const response = await apiRequest('POST', '/api/chat', {
        message: content,
        history: messages
      });

      const data: ChatResponse = await response.json();

      // Create AI response
      const aiMessage: Message = {
        id: nanoid(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        displayContent: undefined // This will be rendered based on responseType
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast]);

  const clearChat = useCallback(() => {
    setMessages([]);
    
    // Add welcome message back
    const welcomeMessage: Message = {
      id: nanoid(),
      content: "Hi there! 👋 I'm your fashion assistant. I can help with style advice, fashion trends, outfit ideas, and more. What can I help you with today?",
      role: 'assistant',
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    clearChat
  };
}
