export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  displayContent?: JSX.Element; // For rendering rich content
}

export interface ChatHistoryItem {
  id: number;
  messages: Message[];
  createdAt: string;
}

export interface FashionColor {
  name: string;
  hexCode: string;
}

export interface FashionOutfit {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface FashionAccessory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface TrendResponse {
  message: string;
  colors?: FashionColor[];
  outfits?: FashionOutfit[];
  accessories?: FashionAccessory[];
}

export interface ChatResponse {
  message: string;
  responseType: 'text' | 'trends' | 'outfits' | 'accessories';
  data?: TrendResponse;
}
