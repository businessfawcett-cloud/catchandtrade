'use client';

import { useEffect, useState } from 'react';

interface CatchAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

const PokeballCatch = () => (
  <svg width="80" height="80" viewBox="0 0 100 100" className="animate-catch">
    <defs>
      <linearGradient id="catchBallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ff6b6b" />
        <stop offset="50%" stopColor="#e63946" />
        <stop offset="100%" stopColor="#c1121f" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#catchBallGrad)" stroke="#0f1724" strokeWidth="4" />
    <rect x="4" y="46" width="92" height="8" fill="#0f1724" />
    <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0f1724" strokeWidth="4" />
    <circle cx="50" cy="50" r="6" fill="#0f1724" />
  </svg>
);

export default function CatchAnimation({ show, onComplete }: CatchAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-black/50 backdrop-blur-sm absolute inset-0" />
      <div className="relative z-10">
        <PokeballCatch />
      </div>
    </div>
  );
}
