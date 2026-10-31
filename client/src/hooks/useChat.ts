import { useState, useCallback, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Message, ChatResponse } from '@/lib/types';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { LOCAL_USER_ID } from '@/lib/localUser';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistoryId, setChatHistoryId] = useState<number | null>(null);
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
  
  // Save chat history to database
  const saveChatHistory = async (messagesToSave: Message[]) => {
    try {
      // Skip saving if only welcome message exists
      if (messagesToSave.length <= 1) return;
      
      if (chatHistoryId) {
        // Update existing chat history
        const response = await apiRequest('PUT', `/api/chat/history/${chatHistoryId}`, {
          messages: messagesToSave
        });
        
        if (!response.ok) {
          console.error('Failed to update chat history');
        }
      } else {
        // Create new chat history
        const response = await apiRequest('POST', '/api/chat/history', {
          messages: messagesToSave,
          userId: LOCAL_USER_ID,
        });
        
        if (response.ok) {
          const data = await response.json();
          setChatHistoryId(data.chatHistoryId);
        } else {
          console.error('Failed to create chat history');
        }
      }
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };
  
  // Load chat history from database
  const loadChatHistory = useCallback(async (historyId: number) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('GET', `/api/chat/history/${historyId}`);
      
      if (response.ok) {
        const chatHistory = await response.json();
        setMessages(chatHistory.messages);
        setChatHistoryId(chatHistory.id);
      } else {
        console.error('Failed to load chat history');
        toast({
          title: "Error",
          description: "Failed to load chat history.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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

      // Create user message
      const userMessage: Message = {
        id: nanoid(),
        content: userMessageDisplay,
        role: 'user',
        timestamp: new Date().toISOString(),
        imageData
      };
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

      // Include both the user message and AI message in the updated messages
      const updatedMessages = [...messages, userMessage, aiMessage];
      setMessages(updatedMessages);
      
      // Save chat history to database
      await saveChatHistory(updatedMessages);
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
  }, [messages, toast, chatHistoryId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setChatHistoryId(null);
    
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
    clearChat,
    loadChatHistory,
    chatHistoryId
  };
}
