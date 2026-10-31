import React from 'react';
import { Link } from 'wouter';
import { ShoppingBag, Trash2, ExternalLink, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart, formatPrice } from '@/hooks/useCart';
import { AffiliateDisclosure } from '@/components/fashion/AffiliateDisclosure';

export default function Cart() {
  const { cart, isLoading, setQuantity, removeItem, clearCart } = useCart();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-muted-foreground">
        Loading your bag…
      </div>
    );
  }

  if (cart.itemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">Your bag is empty</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Ask Vesta for outfit ideas and add the pieces you like.
        </p>
        <Link href="/">
          <Button>Start a chat</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Your bag</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => clearCart.mutate()}
          disabled={clearCart.isPending}
        >
          Clear all
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} · subtotal{' '}
        {formatPrice(cart.subtotalCents, cart.currency)}
        {cart.hasUnpricedItems && ' (some prices shown at merchant)'}
      </p>

      {cart.merchants.map((group) => {
        const groupCount = group.items.reduce((sum, item) => sum + item.quantity, 0);

        return (
        <section key={group.merchant} className="mb-8 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{group.merchant}</h2>
            <span className="text-xs text-muted-foreground">
              {groupCount} {groupCount === 1 ? 'item' : 'items'}
            </span>
          </div>

          <ul className="space-y-4">
            {group.items.map((item) => (
              <li key={item.itemId} className="flex gap-3">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-16 h-16 rounded object-cover bg-muted flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.priceCents, item.currency)}
                  </p>
                  {!item.isActive && (
                    <p className="text-xs text-amber-600">
                      No longer listed by the merchant
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={`Decrease quantity of ${item.title}`}
                      disabled={setQuantity.isPending}
                      onClick={() =>
                        setQuantity.mutate({
                          itemId: item.itemId,
                          quantity: item.quantity - 1,
                        })
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={`Increase quantity of ${item.title}`}
                      disabled={setQuantity.isPending || item.quantity >= 20}
                      onClick={() =>
                        setQuantity.mutate({
                          itemId: item.itemId,
                          quantity: item.quantity + 1,
                        })
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      aria-label={`Remove ${item.title}`}
                      disabled={removeItem.isPending}
                      onClick={() => removeItem.mutate(item.itemId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Button asChild size="sm" variant="outline" className="self-start">
                  <a
                    href={item.checkoutUrl}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                  >
                    Buy
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              </li>
            ))}
          </ul>

          <Separator className="my-4" />

          <p className="text-xs text-muted-foreground">
            Each item opens its own product page on {group.merchant}; you pay there,
            not in Vesta.
          </p>
        </section>
        );
      })}

      <AffiliateDisclosure />
    </div>
  );
}
