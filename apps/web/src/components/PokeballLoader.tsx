'use client';

interface PokeballLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PokeballLoader({ size = 'md', className = '' }: PokeballLoaderProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  };

  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full animate-pokeball-spin">
        <defs>
          <linearGradient id="pokeballLoaderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff6b6b" />
            <stop offset="50%" stopColor="#e63946" />
            <stop offset="100%" stopColor="#c1121f" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#pokeballLoaderGrad)" stroke="#0f1724" strokeWidth="4" />
        <rect x="4" y="46" width="92" height="8" fill="#0f1724" />
        <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0f1724" strokeWidth="4" />
        <circle cx="50" cy="50" r="6" fill="#0f1724" />
      </svg>
    </div>
  );
}
