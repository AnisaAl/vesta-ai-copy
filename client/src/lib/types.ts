export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  displayContent?: JSX.Element; // For rendering rich content
  imageData?: string; // Base64 encoded image data
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
  /** Present on affiliate catalog rows; enables add-to-cart and merchant handoff. */
  productId?: number;
  affiliateUrl?: string;
  priceCents?: number;
  currency?: string;
  merchant?: string;
  source?: "affiliate" | "deepfashion" | "sample";
}

export interface CartItem {
  itemId: number;
  productId: number;
  quantity: number;
  title: string;
  imageUrl: string;
  priceCents: number | null;
  currency: string;
  isActive: boolean;
  checkoutUrl: string;
}

export interface CartMerchantGroup {
  merchant: string;
  items: CartItem[];
}

export interface Cart {
  itemCount: number;
  subtotalCents: number;
  currency: string;
  hasUnpricedItems: boolean;
  merchants: CartMerchantGroup[];
}

export interface FashionAccessory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface TrendResponse {
  message: string;
  intent?: string;
  colors?: FashionColor[];
  outfits?: FashionOutfit[];
  accessories?: FashionAccessory[];
}

export interface ChatResponse {
  message: string;
  responseType: 'text' | 'trends' | 'outfits' | 'accessories';
  data?: TrendResponse;
}
