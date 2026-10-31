import React, { useState } from 'react';
import { FashionOutfit } from '@/lib/types';
import VirtualTryOn from './VirtualTryOn';
import { AffiliateDisclosure } from './AffiliateDisclosure';
import { useCart, formatPrice } from '@/hooks/useCart';

interface OutfitGridProps {
  outfits: FashionOutfit[];
}

export default function OutfitGrid({ outfits }: OutfitGridProps) {
  const [selectedOutfit, setSelectedOutfit] = useState<FashionOutfit | null>(null);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const { addItem } = useCart();

  const handleTryOn = (outfit: FashionOutfit) => {
    setSelectedOutfit(outfit);
    setIsTryOnOpen(true);
  };

  const hasShoppableItems = outfits.some((outfit) => outfit.productId);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 my-3">
        {outfits.map((outfit) => {
          const isShoppable = Boolean(outfit.productId);

          return (
            <div
              key={outfit.id}
              className="rounded-lg overflow-hidden border border-gray-200 bg-white flex flex-col items-center p-2 w-36 mx-auto"
            >
              <div
                className="w-28 h-28 bg-gray-100 rounded-md mb-2"
                style={{
                  backgroundImage: `url(${outfit.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                aria-label={outfit.name}
              />
              <p className="text-xs font-semibold text-center mt-1 mb-0.5">{outfit.name}</p>

              {isShoppable ? (
                <>
                  <p className="text-xs font-medium text-center text-gray-900">
                    {formatPrice(outfit.priceCents, outfit.currency)}
                  </p>
                  {outfit.merchant && (
                    <p className="text-[10px] text-[#6B6B6B] text-center mb-2">
                      at {outfit.merchant}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-[#6B6B6B] text-center mb-2">
                  {outfit.description}
                </p>
              )}

              <div className="flex flex-col gap-1 w-full">
                {isShoppable && (
                  <>
                    <button
                      type="button"
                      className="bg-primary text-white text-xs px-2 py-1 rounded hover:opacity-90 transition-opacity w-full disabled:opacity-60"
                      disabled={addItem.isPending}
                      onClick={() => addItem.mutate(outfit.productId!)}
                    >
                      Add to bag
                    </button>
                    <a
                      className="text-[10px] text-center text-primary underline"
                      href={`/api/go/${outfit.productId}?source=chat`}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                    >
                      View at merchant
                    </a>
                  </>
                )}
                <button
                  type="button"
                  className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-300 transition-colors w-full"
                  onClick={() => handleTryOn(outfit)}
                >
                  Try it on
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hasShoppableItems && <AffiliateDisclosure className="mb-2" />}

      {selectedOutfit && (
        <VirtualTryOn
          open={isTryOnOpen}
          onOpenChange={setIsTryOnOpen}
          productImageUrl={selectedOutfit.imageUrl}
          productName={selectedOutfit.name}
        />
      )}
    </>
  );
}
