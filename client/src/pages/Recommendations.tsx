import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';

interface OutfitCardProps {
  name: string;
  description: string;
  imageUrl: string;
}

const OutfitCard = ({ name, description, imageUrl }: OutfitCardProps) => (
  <Card className="overflow-hidden h-full">
    <div className="h-48 overflow-hidden">
      <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
    </div>
    <CardContent className="p-4">
      <h3 className="font-semibold text-lg">{name}</h3>
      <p className="text-muted-foreground text-sm mt-1">{description}</p>
    </CardContent>
  </Card>
);

export default function Recommendations() {
  // Sample recommendation data - in a real app, this would come from API
  const recommendations = [
    {
      id: '1',
      name: 'Summer Casual',
      description: 'Light and breezy outfit perfect for warm summer days',
      imageUrl: 'https://source.unsplash.com/random/300x200/?summer,fashion'
    },
    {
      id: '2',
      name: 'Office Smart',
      description: 'Professional attire that maintains comfort throughout the day',
      imageUrl: 'https://source.unsplash.com/random/300x200/?office,attire'
    },
    {
      id: '3',
      name: 'Evening Elegance',
      description: 'Sophisticated ensemble for dinner or special occasions',
      imageUrl: 'https://source.unsplash.com/random/300x200/?evening,dress'
    },
    {
      id: '4',
      name: 'Weekend Relaxed',
      description: 'Comfortable yet stylish outfit for weekend activities',
      imageUrl: 'https://source.unsplash.com/random/300x200/?weekend,casual'
    },
    {
      id: '5',
      name: 'Fitness Focus',
      description: 'Athletic wear that performs as good as it looks',
      imageUrl: 'https://source.unsplash.com/random/300x200/?fitness,clothes'
    },
    {
      id: '6',
      name: 'Autumn Layers',
      description: 'Layered look perfect for transitional weather',
      imageUrl: 'https://source.unsplash.com/random/300x200/?autumn,fashion'
    }
  ];
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Your Outfit Recommendations</h1>
      <p className="text-muted-foreground mb-6">
        Personalized outfit suggestions based on your style preferences and recent conversations.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map(outfit => (
          <OutfitCard 
            key={outfit.id}
            name={outfit.name}
            description={outfit.description}
            imageUrl={outfit.imageUrl}
          />
        ))}
      </div>
    </div>
  );
}