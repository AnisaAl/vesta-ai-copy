import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Cart } from '@/lib/types';

const CART_KEY = ['/api/cart'];

const EMPTY_CART: Cart = {
  itemCount: 0,
  subtotalCents: 0,
  currency: 'USD',
  hasUnpricedItems: false,
  merchants: [],
};

async function fetchCart(): Promise<Cart> {
  const res = await fetch('/api/cart', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load cart');
  const data = await res.json();
  return data.cart as Cart;
}

export function useCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, isError } = useQuery({
    queryKey: CART_KEY,
    queryFn: fetchCart,
  });

  const writeCart = (payload: { cart: Cart }) => {
    queryClient.setQueryData(CART_KEY, payload.cart);
  };

  const onError = (message: string) => () =>
    toast({ title: message, variant: 'destructive' });

  const addItem = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest('POST', '/api/cart/items', { productId });
      return res.json();
    },
    onSuccess: (payload) => {
      writeCart(payload);
      toast({ title: 'Added to cart' });
    },
    onError: onError('Could not add to cart'),
  });

  const setQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      const res = await apiRequest('PATCH', `/api/cart/items/${itemId}`, { quantity });
      return res.json();
    },
    onSuccess: writeCart,
    onError: onError('Could not update quantity'),
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest('DELETE', `/api/cart/items/${itemId}`);
      return res.json();
    },
    onSuccess: writeCart,
    onError: onError('Could not remove item'),
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', '/api/cart');
      return res.json();
    },
    onSuccess: writeCart,
    onError: onError('Could not clear cart'),
  });

  return {
    cart: data ?? EMPTY_CART,
    isLoading,
    isError,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
  };
}

export function formatPrice(cents: number | null | undefined, currency = 'USD'): string {
  if (typeof cents !== 'number') return 'Price at merchant';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}
