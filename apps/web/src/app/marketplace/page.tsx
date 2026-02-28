'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PokeballLoader from '@/components/PokeballLoader';
import RarityBadge from '@/components/RarityBadge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

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

interface Set {
  id: string;
  name: string;
  code: string;
  cardCount?: number;
}

type SortOption = 'newest' | 'oldest' | 'name' | 'price-desc' | 'price-asc';

const TOTAL_CARDS = 20078;
const TOTAL_SETS = 173;

function SkeletonCard() {
  return (
    <div className="bg-[#111827] rounded-xl overflow-hidden">
      <div className="aspect-[3/4] skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
        <div className="h-3 skeleton rounded w-1/4" />
      </div>
    </div>
  );
}

function normalizeRarity(rarity: string | null): string {
  if (!rarity) return '';
  if (rarity.toUpperCase().includes('MEGA') && rarity.toUpperCase().includes('RARE')) {
    return 'Mega Rare';
  }
  return rarity;
}

export default function MarketplacePage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCards, setTotalCards] = useState(TOTAL_CARDS);
  const cardsPerPage = 50;

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const res = await fetch(`${API_URL}/api/sets`);
        const data = await res.json();
        setSets(data.sets || []);
      } catch (err) {
        console.error('Failed to fetch sets:', err);
      }
    };
    fetchSets();
  }, []);

  const fetchCards = useCallback(async (query: string = '', sort: string = 'newest', setFilter: string = '', page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(cardsPerPage));
      params.set('page', String(page));
      
      if (setFilter) params.set('setCode', setFilter);
      if (sort) params.set('sort', sort);
      
      let url: string;
      if (query.trim()) {
        url = `${API_URL}/api/cards/search?q=${encodeURIComponent(query)}&${params.toString()}`;
      } else {
        url = `${API_URL}/api/cards?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch cards');
      
      const data = await response.json();
      const fetchedCards = data.results || data.cards || [];
      
      setCards(fetchedCards);
      setTotalCards(data.total || fetchedCards.length);
    } catch (err) {
      setError('Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards(searchQuery, sortBy, selectedSet, currentPage);
  }, [fetchCards, searchQuery, sortBy, selectedSet, currentPage]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchCards(searchQuery, sortBy, selectedSet, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, sortBy, selectedSet, fetchCards]);

  const getAffiliateLinks = (card: Card) => {
    const searchTerm = `${card.name} ${card.setName} ${card.cardNumber} Pokemon Card`;
    const amazonTag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || '';
    const ebayCampaignId = process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID || '';
    const ebaySearchTerm = encodeURIComponent(`${card.name} ${card.setName} ${card.cardNumber} Pokemon Card`);
    const ebayUrl = ebayCampaignId 
      ? `https://www.ebay.com/sch/i.html?_nkw=${ebaySearchTerm}&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=${ebayCampaignId}&customid=&toolid=10001&mkevt=1`
      : `https://www.ebay.com/sch/i.html?_nkw=${ebaySearchTerm}`;
    const amazonSearchTerm = encodeURIComponent(`${card.name} ${card.setName} ${card.cardNumber} Pokemon Card`);
    const amazonUrl = amazonTag 
      ? `https://www.amazon.com/s?k=${amazonSearchTerm}&tag=${amazonTag}`
      : '';
    return {
      tcgplayer: `https://www.tcgplayer.com/search?affiliate=true&q=${encodeURIComponent(searchTerm)}`,
      amazon: amazonUrl,
      ebay: ebayUrl
    };
  };

  const isRareHolo = (rarity: string | null) => {
    if (!rarity) return false;
    const r = rarity.toLowerCase();
    return r.includes('holo') || r.includes('rare') || r.includes('ultra') || r.includes('secret') || r.includes('rainbow');
  };

  const getTypeColor = (rarity: string | null) => {
    if (!rarity) return 'border-gray-700';
    const r = rarity.toLowerCase();
    if (r.includes('fire')) return 'border-orange-500';
    if (r.includes('water')) return 'border-blue-500';
    if (r.includes('grass')) return 'border-green-500';
    if (r.includes('electric')) return 'border-yellow-500';
    if (r.includes('psychic')) return 'border-pink-500';
    if (r.includes('dragon')) return 'border-purple-500';
    if (r.includes('ghost')) return 'border-purple-700';
    if (r.includes('steel')) return 'border-gray-400';
    if (r.includes('fairy')) return 'border-pink-300';
    if (r.includes('ice')) return 'border-cyan-400';
    if (r.includes('fighting')) return 'border-red-700';
    if (r.includes('poison')) return 'border-purple-500';
    if (r.includes('ground')) return 'border-yellow-600';
    if (r.includes('rock')) return 'border-yellow-700';
    if (r.includes('bug')) return 'border-green-600';
    return 'border-gray-700';
  };

  const startNum = (currentPage - 1) * cardsPerPage + 1;
  const endNum = Math.min(currentPage * cardsPerPage, totalCards);

  return (
    <div className="min-h-screen relative" style={{ zIndex: 1 }}>
      {/* Hero Bar */}
      <div className="glass border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-rajdhani text-3xl md:text-4xl font-bold text-white">
                Pokemon Card Catalog
              </h1>
              <p className="text-poke-gold mt-1">
                {totalCards.toLocaleString()} cards across {TOTAL_SETS} sets
              </p>
            </div>
            <div className="flex items-center gap-3 text-poke-text-muted">
              <svg className="w-6 h-6 animate-pokeball-spin" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="#e63946" stroke="#0a0f1e" strokeWidth="4" />
                <rect x="2" y="46" width="96" height="8" fill="#0a0f1e" />
                <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0a0f1e" strokeWidth="4" />
                <circle cx="50" cy="50" r="6" fill="#0a0f1e" />
              </svg>
              <span className="font-rajdhani text-xl font-bold">{totalCards.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="glass border-b border-gray-800 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <svg 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search cards by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setCurrentPage(1);
                    fetchCards(searchQuery, sortBy, selectedSet, 1);
                  }
                }}
                className="premium-input pl-12"
              />
            </div>

            {/* Set Dropdown */}
            <select 
              value={selectedSet} 
              onChange={(e) => { setSelectedSet(e.target.value); setCurrentPage(1); }}
              className="premium-select min-w-[200px]"
              aria-label="Filter by set"
            >
              <option value="">All Sets</option>
              {sets.map(set => (
                <option key={set.code} value={set.code}>{set.name}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select 
              value={sortBy} 
              onChange={(e) => { setSortBy(e.target.value as SortOption); setCurrentPage(1); }}
              className="premium-select min-w-[180px]"
              aria-label="Sort cards"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A→Z</option>
              <option value="price-desc">Price High→Low</option>
              <option value="price-asc">Price Low→High</option>
            </select>

            {/* Search Button */}
            <button
              onClick={() => { setCurrentPage(1); fetchCards(searchQuery, sortBy, selectedSet, 1); }}
              className="px-8 py-3 bg-gradient-to-r from-poke-red to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold rounded-lg transition-all shadow-lg shadow-poke-red/30 hover:shadow-poke-red/50 whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="glass p-8 text-center text-poke-red">{error}</div>
        ) : cards.length === 0 ? (
          <div className="glass p-8 text-center text-poke-text-muted">No results found.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cards.map((card) => {
                const links = getAffiliateLinks(card);
                const normalizedRarity = normalizeRarity(card.rarity);
                return (
                  <div
                    key={card.id}
                    className={`card-wrapper bg-[#111827] rounded-xl overflow-hidden border ${getTypeColor(normalizedRarity)} card-lift ${isRareHolo(normalizedRarity) ? 'holo-effect' : ''}`}
                  >
                    <Link href={`/marketplace/${card.id}`} className="block">
                      <div className="aspect-[3/4] bg-gradient-to-br from-[#1a2332] to-[#0a0f1e] flex items-center justify-center p-3">
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
                      <div className="p-3 space-y-2">
                        <h3 className="font-rajdhani font-bold text-white truncate">
                          {card.name}
                        </h3>
                        <p className="text-xs text-poke-text-muted truncate font-dm-sans">
                          {card.setName}
                        </p>
                        <div className="flex items-center justify-between">
                          <RarityBadge rarity={normalizedRarity} />
                          {card.currentPrice && (
                            <span className="text-sm font-bold text-poke-gold">
                              ${card.currentPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="quick-links flex gap-1 px-3 pb-3">
                      <a href={links.tcgplayer} target="_blank" rel="noopener noreferrer" className="flex-1 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white text-center rounded transition-colors">TCG</a>
                      <a href={links.amazon} target="_blank" rel="noopener noreferrer" className="flex-1 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-400 text-black text-center rounded transition-colors">Amazon</a>
                      <a href={links.ebay} target="_blank" rel="noopener noreferrer" className="flex-1 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white text-center rounded transition-colors">eBay</a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-poke-text-muted font-dm-sans">
                Showing {startNum.toLocaleString()}–{endNum.toLocaleString()} of {totalCards.toLocaleString()} cards
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="px-4 py-2 bg-poke-red rounded-lg text-white font-bold">
                  {currentPage}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={endNum >= totalCards}
                  className="pagination-btn disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
