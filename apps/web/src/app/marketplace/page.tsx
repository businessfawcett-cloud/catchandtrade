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
}

type SortOption = 'newest' | 'oldest' | 'name' | 'price-desc' | 'price-asc';

export default function MarketplacePage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedSet, setSelectedSet] = useState<string>('');

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

  const fetchCards = useCallback(async (query: string = '', sort: string = 'newest', setFilter: string = '') => {
    setLoading(true);
    setError(null);
    try {
      let url: string;
      const params = new URLSearchParams();
      params.set('limit', '100');
      params.set('page', '1');
      
      if (setFilter) {
        params.set('setCode', setFilter);
      }
      if (sort) {
        params.set('sort', sort);
      }
      
      if (query.trim()) {
        url = `${API_URL}/api/cards/search?q=${encodeURIComponent(query)}`;
        if (setFilter) url += `&setCode=${setFilter}`;
        if (sort) url += `&sort=${sort}`;
      } else {
        url = `${API_URL}/api/cards?${params.toString()}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      const data = await response.json();
      let fetchedCards = data.results || data.cards || [];
      
      setCards(fetchedCards);
    } catch (err) {
      setError('Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards(searchQuery, sortBy, selectedSet);
  }, [fetchCards, searchQuery, sortBy, selectedSet]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      fetchCards(searchQuery, sortBy, selectedSet);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchCards, sortBy, selectedSet]);

  const getAffiliateLinks = (card: Card) => {
    const searchTerm = `${card.name} ${card.setName}`;
    const amazonTag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || '';
    const ebayCampaignId = process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID || '';
    const ebaySearchTerm = encodeURIComponent(`${card.name} Pokemon Card`);
    const ebayUrl = ebayCampaignId 
      ? `https://www.ebay.com/sch/i.html?_nkw=${ebaySearchTerm}&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=${ebayCampaignId}&customid=&toolid=10001&mkevt=1`
      : '';
    const amazonSearchTerm = encodeURIComponent(`${searchTerm} Pokemon Card`);
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
    return rarity.toLowerCase().includes('holo') || 
           rarity.toLowerCase().includes('rare') ||
           rarity.toLowerCase().includes('ultra') ||
           rarity.toLowerCase().includes('secret') ||
           rarity.toLowerCase().includes('rainbow');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Pokemon Card Catalog</h1>
        <p className="text-poke-text-muted">Find cards for your collection</p>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search cards by name or set..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                router.push(`/marketplace?q=${encodeURIComponent(searchQuery)}`);
              }
            }}
            className="input-dark flex-1"
          />
          <button
            onClick={() => {
              if (searchQuery.trim()) {
                router.push(`/marketplace?q=${encodeURIComponent(searchQuery)}`);
              }
            }}
            className="btn-primary whitespace-nowrap"
          >
            Search
          </button>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select 
            value={selectedSet} 
            onChange={(e) => setSelectedSet(e.target.value)}
            className="input-dark min-w-[180px]"
            aria-label="Filter by set"
          >
            <option value="">All Sets</option>
            {sets.map(set => (
              <option key={set.code} value={set.code}>{set.name}</option>
            ))}
          </select>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="input-dark min-w-[160px]"
            aria-label="Sort cards"
          >
            <option value="newest">Newest Set First</option>
            <option value="oldest">Oldest Set First</option>
            <option value="name">Name A→Z</option>
            <option value="price-desc">Price High→Low</option>
            <option value="price-asc">Price Low→High</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <PokeballLoader size="lg" />
        </div>
      ) : error ? (
        <div className="card-dark p-8 text-center text-poke-red">{error}</div>
      ) : cards.length === 0 ? (
        <div className="card-dark p-8 text-center text-poke-text-muted">No results found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {cards.map((card) => {
            const links = getAffiliateLinks(card);
            return (
              <div
                key={card.id}
                className={`card-dark card-hover h-full ${isRareHolo(card.rarity) ? 'holo-effect' : ''}`}
              >
                <Link
                  href={`/marketplace/${card.id}`}
                  className="block"
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
                      {card.currentPrice && (
                        <span className="text-sm font-bold text-poke-gold">
                          ${card.currentPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Quick Links - outside the Link */}
                <div className="flex gap-1 px-3 pb-3">
                  <a
                    href={links.tcgplayer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white text-center rounded transition-colors"
                  >
                    TCG
                  </a>
                  <a
                    href={links.amazon}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-400 text-black text-center rounded transition-colors"
                  >
                    Amazon
                  </a>
                  {links.ebay && (
                    <a
                      href={links.ebay}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white text-center rounded transition-colors"
                    >
                      eBay
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
