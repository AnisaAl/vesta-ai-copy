import React from 'react';

/**
 * Required disclosure for affiliate links (FTC / EU consumer rules).
 * Render wherever outbound product links appear.
 */
export function AffiliateDisclosure({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-snug text-muted-foreground ${className}`}>
      Vesta AI may earn a commission when you buy through these links. Prices and
      availability are set by the merchant and can change.
    </p>
  );
}
