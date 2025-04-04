import React from 'react';
import { FashionColor } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TrendCarouselProps {
  colors: FashionColor[];
}

export default function TrendCarousel({ colors }: TrendCarouselProps) {
  return (
    <ScrollArea className="w-full">
      <div className="overflow-x-auto flex space-x-3 pb-2 -mx-1 px-1 my-2">
        {colors.map((color, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-32 rounded-lg overflow-hidden border border-gray-200"
          >
            <div 
              className="h-24" 
              style={{ backgroundColor: color.hexCode }}
              aria-label={`${color.name} color`}
            />
            <div className="p-2 bg-white">
              <p className="text-xs font-medium">{color.name}</p>
              <p className="text-xs text-[#6B6B6B]">{color.hexCode}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
