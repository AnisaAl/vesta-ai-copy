import { Message } from '@shared/schema';
// Using the types from client
import { 
  TrendResponse, 
  FashionColor, 
  FashionOutfit, 
  FashionAccessory 
} from '../../client/src/lib/types';

// Fashion-MNIST categories
const FASHION_CATEGORIES = [
  'T-shirt/top',
  'Trouser',
  'Pullover',
  'Dress',
  'Coat',
  'Sandal',
  'Shirt',
  'Sneaker',
  'Bag',
  'Ankle boot'
];

// Fashion color palettes for different seasons
const SEASONAL_COLORS: Record<string, FashionColor[]> = {
  spring: [
    { name: 'Pastel Pink', hexCode: '#FFD1DC' },
    { name: 'Mint Green', hexCode: '#98FB98' },
    { name: 'Soft Yellow', hexCode: '#FFFFE0' },
    { name: 'Sky Blue', hexCode: '#87CEEB' },
    { name: 'Lavender', hexCode: '#E6E6FA' }
  ],
  summer: [
    { name: 'Coral', hexCode: '#FF7F50' },
    { name: 'Sunshine Yellow', hexCode: '#FFDD33' },
    { name: 'Aqua Blue', hexCode: '#7FDBFF' },
    { name: 'Lime Green', hexCode: '#32CD32' },
    { name: 'Bright Pink', hexCode: '#FF69B4' }
  ],
  fall: [
    { name: 'Burnt Orange', hexCode: '#CC5500' },
    { name: 'Olive Green', hexCode: '#808000' },
    { name: 'Burgundy', hexCode: '#800020' },
    { name: 'Mustard Yellow', hexCode: '#FFDB58' },
    { name: 'Rust Red', hexCode: '#B7410E' }
  ],
  winter: [
    { name: 'Emerald Green', hexCode: '#50C878' },
    { name: 'Navy Blue', hexCode: '#000080' },
    { name: 'Ruby Red', hexCode: '#E0115F' },
    { name: 'Silver', hexCode: '#C0C0C0' },
    { name: 'Forest Green', hexCode: '#228B22' }
  ]
};

// Sample outfits for different categories
const SAMPLE_OUTFITS: Record<string, FashionOutfit[]> = {
  casual: [
    {
      id: 'casual1',
      name: 'Weekend Comfort',
      description: 'Relaxed jeans with a soft tee and sneakers',
      imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8Y2FzdWFsJTIwb3V0Zml0fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=400&q=60'
    },
    {
      id: 'casual2',
      name: 'Athleisure Look',
      description: 'Joggers, hoodie, and white sneakers for an active day',
      imageUrl: 'https://images.unsplash.com/photo-1483118714900-540cf339fd46?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTJ8fGNhc3VhbCUyMG91dGZpdHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=400&q=60'
    }
  ],
  formal: [
    {
      id: 'formal1',
      name: 'Business Professional',
      description: 'Tailored suit with a crisp shirt and oxford shoes',
      imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8Zm9ybWFsJTIwb3V0Zml0fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=400&q=60'
    },
    {
      id: 'formal2',
      name: 'Evening Elegance',
      description: 'Black tie attire with elegant accessories',
      imageUrl: 'https://images.unsplash.com/photo-1553484771-11998c592b9c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Nnx8Zm9ybWFsJTIwZHJlc3N8ZW58MHx8MHx8&auto=format&fit=crop&w=400&q=60'
    }
  ],
  seasonal: [
    {
      id: 'seasonal1',
      name: 'Summer Breeze',
      description: 'Light linen shirt with shorts and sandals',
      imageUrl: 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8c3VtbWVyJTIwb3V0Zml0fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=400&q=60'
    },
    {
      id: 'seasonal2',
      name: 'Autumn Layers',
      description: 'Oversized sweater with jeans and boots',
      imageUrl: 'https://images.unsplash.com/photo-1500643752441-4dc90cda350a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8ZmFsbCUyMG91dGZpdHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=400&q=60'
    }
  ]
};

// Popular accessories categories
const ACCESSORIES: FashionAccessory[] = [
  {
    id: 'acc1',
    name: 'Minimalist Watch',
    description: 'Clean design with leather strap for everyday wear',
    icon: 'ri-watch-line'
  },
  {
    id: 'acc2',
    name: 'Statement Necklace',
    description: 'Bold piece to elevate simple outfits',
    icon: 'ri-heart-line'
  },
  {
    id: 'acc3',
    name: 'Classic Sunglasses',
    description: 'Versatile frames that complement any face shape',
    icon: 'ri-sun-line'
  },
  {
    id: 'acc4',
    name: 'Leather Belt',
    description: 'Quality finish with subtle buckle for longevity',
    icon: 'ri-links-line'
  }
];

/**
 * Get season-appropriate colors
 */
export function getSeasonalColors(season: string): FashionColor[] {
  const normalizedSeason = season.toLowerCase();
  
  // Default to current season if not specified
  if (!normalizedSeason || !SEASONAL_COLORS[normalizedSeason]) {
    const month = new Date().getMonth();
    // 0-2: Winter, 3-5: Spring, 6-8: Summer, 9-11: Fall
    if (month >= 2 && month <= 4) return SEASONAL_COLORS.spring;
    if (month >= 5 && month <= 7) return SEASONAL_COLORS.summer;
    if (month >= 8 && month <= 10) return SEASONAL_COLORS.fall;
    return SEASONAL_COLORS.winter;
  }
  
  return SEASONAL_COLORS[normalizedSeason];
}

/**
 * Get outfit recommendations based on type
 */
export function getOutfitRecommendations(type: string): FashionOutfit[] {
  const normalizedType = type.toLowerCase();
  
  if (SAMPLE_OUTFITS[normalizedType]) {
    return SAMPLE_OUTFITS[normalizedType];
  }
  
  // Return mix of outfits if type not found
  return [
    ...SAMPLE_OUTFITS.casual.slice(0, 1),
    ...SAMPLE_OUTFITS.formal.slice(0, 1),
    ...SAMPLE_OUTFITS.seasonal.slice(0, 1)
  ];
}

/**
 * Get accessory recommendations
 */
export function getAccessoryRecommendations(): FashionAccessory[] {
  // Return a random subset of accessories
  return ACCESSORIES.sort(() => 0.5 - Math.random()).slice(0, 3);
}

// Small talk responses
const SMALL_TALK_RESPONSES: Record<string, string[]> = {
  greeting: [
    "Hello! I'm your fashion assistant. How can I help with your style today?",
    "Hi there! Looking for fashion advice or trend updates?",
    "Welcome! I'm here to help with all your fashion questions."
  ],
  thanks: [
    "You're welcome! Let me know if you need more fashion advice.",
    "Anytime! Fashion is my passion, and I'm happy to help.",
    "My pleasure! Is there anything else about your style I can assist with?"
  ],
  goodbye: [
    "Goodbye! Come back when you need more style inspiration!",
    "Take care! Looking forward to our next fashion chat.",
    "See you later! Stay stylish!"
  ],
  how_are_you: [
    "I'm doing great! Always excited to talk about fashion. How can I help with your style today?",
    "I'm wonderful, thanks for asking! Now, let's talk about your fashion needs.",
    "I'm excellent and ready to discuss the latest trends or help with your outfit choices!"
  ]
};

// Common fashion questions and answers
const FASHION_FAQ: Record<string, string> = {
  "how to determine my body type": "To determine your body type, measure your shoulders, bust/chest, waist, and hips. The proportions between these measurements will help identify whether you have an apple, pear, rectangle, hourglass, or inverted triangle shape. Each body type has specific styles that complement it best.",
  
  "how to build a capsule wardrobe": "A capsule wardrobe consists of essential, timeless pieces that mix and match well. Start with neutral basics: well-fitting jeans, simple t-shirts, a versatile blazer, a white button-down shirt, and a little black dress. Add seasonal pieces and accessories to expand your outfit options while keeping the collection minimal.",
  
  "how to dress for my age": "Instead of focusing on age-appropriate dressing, consider your personal style, body type, and comfort level. Quality fabrics, good fit, and proper proportions matter more than age. Express yourself through fashion while maintaining a balance that makes you feel confident.",
  
  "how to mix patterns": "To mix patterns successfully, vary the pattern scale (pair large with small), maintain a cohesive color palette, and consider adding a solid-colored piece to break up the patterns. Start with classic combinations like stripes and florals before experimenting with bolder mixes.",
  
  "sustainable fashion tips": "To shop more sustainably, look for quality pieces that last longer, choose natural or recycled fabrics, support ethical brands, consider secondhand options, repair items instead of replacing them, and wash clothes less frequently and in cold water to extend their lifespan."
};

/**
 * Generate a fashion response based on a query without using external API
 */
export function generateLocalFashionResponse(query: string): TrendResponse {
  const lowerQuery = query.toLowerCase().trim();
  
  // Check if query is empty or unclear
  if (!lowerQuery || lowerQuery.length < 3 || lowerQuery === "?") {
    return {
      message: "I'm not sure I understood your question. Could you please provide more details about what fashion advice you're looking for?"
    };
  }
  
  // Check for small talk patterns
  if (lowerQuery.match(/^(hi|hello|hey|greetings)/i)) {
    return { message: SMALL_TALK_RESPONSES.greeting[Math.floor(Math.random() * SMALL_TALK_RESPONSES.greeting.length)] };
  }
  
  if (lowerQuery.match(/^(thanks|thank you|thx)/i)) {
    return { message: SMALL_TALK_RESPONSES.thanks[Math.floor(Math.random() * SMALL_TALK_RESPONSES.thanks.length)] };
  }
  
  if (lowerQuery.match(/^(bye|goodbye|see you|farewell)/i)) {
    return { message: SMALL_TALK_RESPONSES.goodbye[Math.floor(Math.random() * SMALL_TALK_RESPONSES.goodbye.length)] };
  }
  
  if (lowerQuery.match(/how are you|how('s| is) it going|what('s| is) up/i)) {
    return { message: SMALL_TALK_RESPONSES.how_are_you[Math.floor(Math.random() * SMALL_TALK_RESPONSES.how_are_you.length)] };
  }
  
  // Check for common fashion FAQ
  for (const [question, answer] of Object.entries(FASHION_FAQ)) {
    if (lowerQuery.includes(question.toLowerCase())) {
      return { message: answer };
    }
  }
  
  // Check for out-of-scope questions
  const nonFashionTopics = [
    'politics', 'religion', 'sports', 'recipe', 'cook', 'food', 'travel', 
    'hotel', 'flight', 'vacation', 'weather', 'stock', 'invest', 'finance',
    'math', 'solve', 'calculate', 'programming', 'code', 'health', 'medical',
    'disease', 'illness', 'medicine'
  ];
  
  if (nonFashionTopics.some(topic => lowerQuery.includes(topic))) {
    return { 
      message: "I'm a fashion assistant and can't provide advice on this topic. I'd be happy to help with style tips, outfit recommendations, or fashion trends instead!" 
    };
  }
  
  // Identify query type
  const isColorQuery = lowerQuery.includes('color') || lowerQuery.includes('palette') || lowerQuery.includes('trend');
  const isOutfitQuery = lowerQuery.includes('outfit') || lowerQuery.includes('wear') || lowerQuery.includes('dress');
  const isAccessoryQuery = lowerQuery.includes('accessory') || lowerQuery.includes('accessories') || lowerQuery.includes('jewelry');
  
  // Identify season if mentioned
  let season = 'summer'; // Default to summer
  if (lowerQuery.includes('spring')) season = 'spring';
  if (lowerQuery.includes('summer')) season = 'summer';
  if (lowerQuery.includes('fall') || lowerQuery.includes('autumn')) season = 'fall';
  if (lowerQuery.includes('winter')) season = 'winter';
  
  // Identify outfit type if mentioned
  let outfitType = 'casual'; // Default to casual
  if (lowerQuery.includes('formal') || lowerQuery.includes('business') || lowerQuery.includes('professional')) {
    outfitType = 'formal';
  } else if (lowerQuery.includes('party') || lowerQuery.includes('evening') || lowerQuery.includes('night out')) {
    outfitType = 'formal';
  } else if (lowerQuery.includes('seasonal') || lowerQuery.includes(season)) {
    outfitType = 'seasonal';
  }
  
  // Prepare response
  const response: TrendResponse = {
    message: `Here are some fashion recommendations based on the Fashion-MNIST dataset:`
  };
  
  if (isColorQuery) {
    response.colors = getSeasonalColors(season);
    response.message += ` The trending colors for ${season} include ${response.colors.map((c: FashionColor) => c.name).join(', ')}.`;
  }
  
  if (isOutfitQuery) {
    response.outfits = getOutfitRecommendations(outfitType);
    response.message += ` For ${outfitType} wear, consider options like ${response.outfits.map((o: FashionOutfit) => o.name).join(' or ')}.`;
  }
  
  if (isAccessoryQuery) {
    response.accessories = getAccessoryRecommendations();
    response.message += ` Popular accessories include ${response.accessories.map((a: FashionAccessory) => a.name).join(', ')}.`;
  }
  
  // If no specific query type identified, try to give general fashion advice
  if (!isColorQuery && !isOutfitQuery && !isAccessoryQuery) {
    // Check if it's a fashion-related query despite not having any specific keywords
    const fashionTerms = ['style', 'fashion', 'clothes', 'clothing', 'wardrobe', 'dress', 'shirt', 'pants', 'shoes'];
    const isFashionRelated = fashionTerms.some(term => lowerQuery.includes(term));
    
    if (isFashionRelated) {
      response.colors = getSeasonalColors(season);
      response.outfits = getOutfitRecommendations(outfitType);
      response.accessories = getAccessoryRecommendations().slice(0, 2);
      response.message = `Here's a fashion suggestion for you: Try wearing colors like ${response.colors.slice(0, 2).map((c: FashionColor) => c.name).join(' or ')} with ${response.outfits[0].description.toLowerCase()}. Add ${response.accessories[0].name.toLowerCase()} to complete the look.`;
    } else {
      // If we can't determine if it's fashion related, give a prompt to clarify
      response.message = "I'm not sure I understand your fashion question. Could you ask about specific trends, outfit recommendations, color palettes, or styling advice?";
    }
  }
  
  return response;
}