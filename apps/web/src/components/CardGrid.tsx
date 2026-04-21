'use client';

import Link from 'next/link';
import RarityBadge from './RarityBadge';

interface Card {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
}

interface CardGridProps {
  cards: Card[];
  showPrice?: boolean;
  className?: string;
}

export default function CardGrid({ cards, showPrice = true, className = '' }: CardGridProps) {
  const isRareHolo = (rarity: string | null) => {
    if (!rarity) return false;
    return rarity.toLowerCase().includes('holo') || 
           rarity.toLowerCase().includes('rare') ||
           rarity.toLowerCase().includes('ultra') ||
           rarity.toLowerCase().includes('secret') ||
           rarity.toLowerCase().includes('rainbow');
  };

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ${className}`}>
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/marketplace/${card.id}`}
          className="group"
        >
          <div
            className={`card-dark card-hover h-full ${
              isRareHolo(card.rarity) ? 'holo-effect' : ''
            }`}
          >
            {/* Card Image */}
            <div className="aspect-[3/4] bg-gradient-to-br from-poke-bg-light to-poke-bg flex items-center justify-center p-2">
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="max-w-full max-h-full object-contain drop-shadow-lg"
                />
              ) : (
                <div className="text-poke-text-muted text-sm">No Image</div>
              )}
            </div>

            {/* Card Info */}
            <div className="p-3 space-y-2">
              <h3 className="font-semibold text-sm text-white truncate group-hover:text-poke-red transition-colors">
                {card.name}
              </h3>
              
              <p className="text-xs text-poke-text-muted truncate">
                {card.setName}
              </p>

              <div className="flex items-center justify-between">
                <RarityBadge rarity={card.rarity} />
                {showPrice && card.currentPrice && (
                  <span className="text-sm font-bold text-poke-gold">
                    ${card.currentPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
