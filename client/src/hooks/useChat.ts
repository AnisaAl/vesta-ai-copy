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

  // Helper function to convert image file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const sendMessage = useCallback(async (content: string, imageFile?: File) => {
    try {
      if (!content.trim() && !imageFile) return;

      let imageData: string | undefined = undefined;
      let userMessageDisplay = content;

      // Convert image to base64 if provided
      if (imageFile) {
        imageData = await fileToBase64(imageFile);
        userMessageDisplay = content.trim() ? content : "Here's an image for style advice";
      }

      // Add user message
      const userMessage: Message = {
        id: nanoid(),
        content: userMessageDisplay,
        role: 'user',
        timestamp: new Date().toISOString(),
        imageData
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      // Prepare request data
      const requestData: any = {
        message: content || "Please analyze this image and provide styling advice",
        history: messages
      };

      // Add image data if present
      if (imageData) {
        requestData.imageData = imageData;
      }

      // Send to API
      const response = await apiRequest('POST', '/api/chat', requestData);

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
