import React from 'react';
import { Message } from '@/lib/types';
import OutfitGrid from '../fashion/OutfitGrid';
import AccessoryList from '../fashion/AccessoryList';

interface ChatBubbleProps {
  message: Message;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const parseContent = () => {
    try {
      const jsonMatch = message.content.match(/```json([\s\S]*?)```/);

      if (jsonMatch && jsonMatch[1]) {
        const jsonData = JSON.parse(jsonMatch[1].trim());
        const textContent = message.content.replace(/```json[\s\S]*?```/, '').trim();
        const hasOutfits = Array.isArray(jsonData.outfits) && jsonData.outfits.length > 0;
        const hasAccessories = Array.isArray(jsonData.accessories) && jsonData.accessories.length > 0;

        return (
          <>
            {textContent && <p className="text-sm mb-3">{textContent}</p>}
            {hasOutfits && <OutfitGrid outfits={jsonData.outfits} />}
            {hasAccessories && <AccessoryList accessories={jsonData.accessories} />}
            {jsonData.conclusion && <p className="text-sm mt-3">{jsonData.conclusion}</p>}
          </>
        );
      }

      return <p className="text-sm">{message.content}</p>;
    } catch {
      return <p className="text-sm">{message.content}</p>;
    }
  };

  if (message.role === 'user') {
    return (
      <div className={`max-w-[85%] chat-bubble user-bubble p-3 ${message.imageData ? 'space-y-2' : ''}`}>
        {message.imageData && (
          <div className="mb-2">
            <img
              src={message.imageData}
              alt="Uploaded fashion item"
              className="rounded-md max-h-44 w-auto object-contain"
            />
          </div>
        )}
        <p className="text-sm">{message.content}</p>
      </div>
    );
  }

  return (
    <div className="flex items-end">
      <div className="w-8 h-8 rounded-full bg-[#FF5470] text-white flex items-center justify-center mr-2">
        <i className="ri-robot-line"></i>
      </div>
      <div className="max-w-[85%] chat-bubble ai-bubble p-3 mb-1">
        {parseContent()}
      </div>
    </div>
  );
}
