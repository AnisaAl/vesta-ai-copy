import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface TrendCardProps {
  title: string;
  description: string;
  imageUrl: string;
}

const TrendCard = ({ title, description, imageUrl }: TrendCardProps) => (
  <Card className="h-full">
    <div className="h-48 overflow-hidden rounded-t-lg">
      <img 
        src={imageUrl} 
        alt={title} 
        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
      />
    </div>
    <CardContent className="p-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground text-sm mt-1">{description}</p>
    </CardContent>
  </Card>
);

interface ColorTrendProps {
  name: string;
  hexCode: string;
}

const ColorTrend = ({ name, hexCode }: ColorTrendProps) => (
  <div className="flex items-center gap-3">
    <div 
      className="w-8 h-8 rounded-full border"
      style={{ backgroundColor: hexCode }}
    />
    <span>{name}</span>
  </div>
);

export default function Trends() {
  // Sample trend data - in a real app, this would come from the API
  const fashionTrends = [
    {
      id: '1',
      title: 'Oversized Blazers',
      description: 'The structured yet relaxed silhouette continues to dominate casual and formal settings',
      imageUrl: 'https://source.unsplash.com/random/300x200/?blazer,fashion'
    },
    {
      id: '2',
      title: 'Sustainable Materials',
      description: 'Eco-conscious fabrics and production methods are becoming fashion essentials',
      imageUrl: 'https://source.unsplash.com/random/300x200/?sustainable,fashion'
    },
    {
      id: '3',
      title: 'Statement Accessories',
      description: 'Bold jewelry and accessories that elevate even the simplest outfit',
      imageUrl: 'https://source.unsplash.com/random/300x200/?accessories,fashion'
    },
  ];
  
  const colorTrends = [
    { name: 'Digital Lavender', hexCode: '#E6E6FA' },
    { name: 'Viva Magenta', hexCode: '#BB2649' },
    { name: 'Sage Green', hexCode: '#B2AC88' },
    { name: 'Tranquil Blue', hexCode: '#5D8AA8' },
    { name: 'Sunset Orange', hexCode: '#FD5E53' },
  ];
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-2">Fashion Trends</h1>
      <p className="text-muted-foreground mb-6">
        Stay updated on the latest trends in the fashion world
      </p>
      
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Trending Styles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fashionTrends.map(trend => (
            <TrendCard 
              key={trend.id}
              title={trend.title}
              description={trend.description}
              imageUrl={trend.imageUrl}
            />
          ))}
        </div>
      </section>
      
      <Separator className="my-8" />
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Color Trends</h2>
        <Card>
          <CardContent className="p-6">
            <p className="mb-4">This season's color palette features a mix of soothing neutrals and vibrant accents</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {colorTrends.map((color, index) => (
                <ColorTrend 
                  key={index}
                  name={color.name}
                  hexCode={color.hexCode}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}