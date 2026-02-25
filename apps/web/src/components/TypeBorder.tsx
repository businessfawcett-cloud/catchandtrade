'use client';

interface TypeBorderProps {
  type?: string;
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

const typeColors: Record<string, string> = {
  fire: 'border-type-fire shadow-[0_0_15px_rgba(240,128,48,0.4)]',
  water: 'border-type-water shadow-[0_0_15px_rgba(104,144,240,0.4)]',
  grass: 'border-type-grass shadow-[0_0_15px_rgba(120,200,80,0.4)]',
  electric: 'border-type-electric shadow-[0_0_15px_rgba(248,208,48,0.4)]',
  psychic: 'border-type-psychic shadow-[0_0_15px_rgba(248,88,136,0.4)]',
  fighting: 'border-type-fighting shadow-[0_0_15px_rgba(192,48,40,0.4)]',
  poison: 'border-type-poison shadow-[0_0_15px_rgba(160,64,160,0.4)]',
  ground: 'border-type-ground shadow-[0_0_15px_rgba(224,192,104,0.4)]',
  rock: 'border-type-rock shadow-[0_0_15px_rgba(184,160,56,0.4)]',
  bug: 'border-type-bug shadow-[0_0_15px_rgba(168,184,32,0.4)]',
  ghost: 'border-type-ghost shadow-[0_0_15px_rgba(112,88,152,0.4)]',
  dragon: 'border-type-dragon shadow-[0_0_15px_rgba(112,56,248,0.4)]',
  dark: 'border-type-dark shadow-[0_0_15px_rgba(112,88,72,0.4)]',
  steel: 'border-type-steel shadow-[0_0_15px_rgba(184,184,208,0.4)]',
  fairy: 'border-type-fairy shadow-[0_0_15px_rgba(238,153,172,0.4)]',
  ice: 'border-type-ice shadow-[0_0_15px_rgba(152,216,216,0.4)]',
  normal: 'border-type-normal shadow-[0_0_10px_rgba(168,168,120,0.3)]',
};

export default function TypeBorder({ type, children, className = '', hoverEffect = false }: TypeBorderProps) {
  const colorClass = type ? typeColors[type.toLowerCase()] || '' : '';
  
  return (
    <div
      className={`border-2 rounded-xl overflow-hidden transition-all duration-300 ${
        hoverEffect ? 'hover:scale-105 hover:z-10' : ''
      } ${colorClass} ${className}`}
    >
      {children}
    </div>
  );
}
