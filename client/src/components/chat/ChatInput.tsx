import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3 sticky bottom-0 z-10">
      <div className="relative flex items-center">
        <Input
          type="text"
          placeholder="Ask about fashion trends, styling tips..."
          className="w-full rounded-full bg-[#F5F5F5] py-3 px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5470]/20"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <Button 
          className="absolute right-2 h-9 w-9 rounded-full bg-[#FF5470] text-white flex items-center justify-center"
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
