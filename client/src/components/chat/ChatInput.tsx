import React, { useState, KeyboardEvent, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Image, X } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string, image?: File) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((message.trim() || selectedImage) && !isLoading) {
      onSend(message, selectedImage || undefined);
      setMessage('');
      setSelectedImage(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (jpeg, png, etc)');
        return;
      }
      setSelectedImage(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3 sticky bottom-0 z-10">
      {selectedImage && (
        <div className="mb-2 flex items-center">
          <div className="bg-[#F5F5F5] rounded-md px-2 py-1 flex items-center mr-2">
            <div className="max-w-[150px] truncate text-sm">{selectedImage.name}</div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 ml-1"
              onClick={removeSelectedImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">Image ready to upload</span>
        </div>
      )}
      <div className="relative flex items-center">
        <Input
          type="text"
          placeholder={selectedImage ? "Add a message about this image..." : "Ask about fashion trends, styling tips..."}
          className="w-full rounded-full bg-[#F5F5F5] py-3 px-4 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5470]/20"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <div className="absolute right-12">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full flex items-center justify-center"
            onClick={triggerFileInput}
            disabled={isLoading}
          >
            <Image className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
        <Button 
          className="absolute right-2 h-9 w-9 rounded-full bg-[#FF5470] text-white flex items-center justify-center"
          onClick={handleSend}
          disabled={isLoading || (!message.trim() && !selectedImage)}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
