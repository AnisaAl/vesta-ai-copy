import React from 'react';
import { FashionOutfit } from '@/lib/types';

interface OutfitGridProps {
  outfits: FashionOutfit[];
}

export default function OutfitGrid({ outfits }: OutfitGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 my-3">
      {outfits.map((outfit) => (
        <div
          key={outfit.id}
          className="rounded-lg overflow-hidden border border-gray-200"
        >
          <div
            className="w-full h-36 bg-gray-100"
            style={{
              backgroundImage: `url(${outfit.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            aria-label={outfit.name}
          />
          <div className="p-2 bg-white">
            <p className="text-xs font-medium">{outfit.name}</p>
            <p className="text-[10px] text-[#6B6B6B]">{outfit.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
