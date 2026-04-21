'use client';

interface RarityBadgeProps {
  rarity: string | null;
  className?: string;
}

const rarityConfig: Record<string, { label: string; color: string; stars: string }> = {
  'Common': { label: 'Common', color: 'text-gray-400', stars: '◆' },
  'Uncommon': { label: 'Uncommon', color: 'text-gray-300', stars: '◆◆' },
  'Rare': { label: 'Rare', color: 'text-poke-gold', stars: '★' },
  'Rare Holo': { label: 'Rare Holo', color: 'text-poke-gold', stars: '★' },
  'Rare Ultra': { label: 'Ultra Rare', color: 'text-red-400', stars: '★★' },
  'Rare Prime': { label: 'Ultra Rare', color: 'text-red-400', stars: '★★' },
  'Rare BREAK': { label: 'BREAK Rare', color: 'text-purple-400', stars: '★★★' },
  'Rare Shiny': { label: 'Shiny Rare', color: 'text-poke-gold', stars: '★' },
  'Rare Shiny BREAK': { label: 'Shiny BREAK', color: 'text-purple-400', stars: '★★★' },
  'Rare Secret': { label: 'Secret Rare', color: 'text-poke-fairy', stars: '★★★★' },
  'Rare Rainbow': { label: 'Rainbow Rare', color: 'text-poke-gold', stars: '★★★★★' },
  'Rare Prism': { label: 'Prism Rare', color: 'text-cyan-400', stars: '★★★★' },
  'Rare Holo EX': { label: 'Holo EX', color: 'text-poke-gold', stars: '★' },
  'Rare Holo GX': { label: 'Holo GX', color: 'text-poke-gold', stars: '★★' },
  'Rare Ultra EX': { label: 'Ultra EX', color: 'text-red-400', stars: '★★' },
};

export default function RarityBadge({ rarity, className = '' }: RarityBadgeProps) {
  if (!rarity) return null;

  const config = rarityConfig[rarity] || { label: rarity, color: 'text-gray-400', stars: '★' };

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${config.color} ${className}`}
    >
      <span>{config.stars}</span>
      <span>{config.label}</span>
    </span>
  );
}
