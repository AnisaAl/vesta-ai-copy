import React from 'react';
import { FashionAccessory } from '@/lib/types';

interface AccessoryListProps {
  accessories: FashionAccessory[];
}

export default function AccessoryList({ accessories }: AccessoryListProps) {
  return (
    <ul className="space-y-3 my-3">
      {accessories.map((accessory) => (
        <li key={accessory.id} className="flex items-center">
          <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center mr-3">
            <i className={`${accessory.icon} text-lg text-gray-500`}></i>
          </div>
          <div>
            <p className="text-xs font-medium">{accessory.name}</p>
            <p className="text-[10px] text-[#6B6B6B]">{accessory.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
