'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RarityBadge from '@/components/RarityBadge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

// Styles will be applied directly using Tailwind classes in JSX

interface Card {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
  prices?: { priceMarket: number | null }[];
}

interface PortfolioItem {
  id: string;
  quantity: number;
  condition: string;
  isGraded: boolean;
  gradeCompany: string | null;
  gradeValue: number | null;
  valuationOverride: number | null;
  purchasePrice: number | null;
  card: Card;
}

interface Portfolio {
  id: string;
  name: string;
  items: PortfolioItem[];
}

const PokeballDecorative = () => (
  <svg width="120" height="120" viewBox="0 0 100 100" style={{ opacity: 0.15 }}>
    <circle cx="50" cy="50" r="45" fill="#e63946" stroke="#0a0f1e" strokeWidth="4" />
    <rect x="4" y="46" width="92" height="8" fill="#0a0f1e" />
    <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0a0f1e" strokeWidth="4" />
    <circle cx="50" cy="50" r="6" fill="#0a0f1e" />
  </svg>
);

export default function PortfolioPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const [portfolioValue, setPortfolioValue] = useState<{ totalValue: number; cardCount: number; uniqueCards: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [condition, setCondition] = useState('NEAR_MINT');
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [addPortfolioId, setAddPortfolioId] = useState('');
  const [adding, setAdding] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPortfolioId, setDeletingPortfolioId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'graded' | 'ungraded'>('all');

  const fetchPortfolios = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/portfolios`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data);
        if (data.length > 0 && !selectedPortfolio) {
          setSelectedPortfolio(data[0].id);
          setAddPortfolioId(data[0].id);
        }
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Failed to fetch portfolios:', err);
    }
  }, [selectedPortfolio]);

  const fetchPortfolioValue = useCallback(async (portfolioId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/portfolios/${portfolioId}/value`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPortfolioValue(data);
      }
    } catch (err) {
      console.error('Failed to fetch portfolio value:', err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token) {
      try {
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);
        }
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchPortfolios();
    }
  }, [fetchPortfolios]);

  useEffect(() => {
    if (selectedPortfolio) {
      fetchPortfolioValue(selectedPortfolio);
    }
  }, [selectedPortfolio, fetchPortfolioValue]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/api/cards/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddToPortfolio = async () => {
    if (!selectedCard) return;

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const portfolioId = addPortfolioId || portfolios[0]?.id;
    if (!portfolioId) {
      alert('No portfolio found');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(`${API_URL}/api/portfolios/${portfolioId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: selectedCard.id,
          condition,
          quantity: quantity,
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined
        })
      });

      if (response.ok) {
        const priceMsg = selectedCard.currentPrice ? ` +$${selectedCard.currentPrice.toFixed(2)}` : '';
        setSuccessMessage(`✓ Added to Portfolio${priceMsg}`);
        setShowModal(false);
        setSelectedCard(null);
        setSearchQuery('');
        setSearchResults([]);
        setCondition('NEAR_MINT');
        setQuantity(1);
        setPurchasePrice('');
        fetchPortfolios();
        if (selectedPortfolio) fetchPortfolioValue(selectedPortfolio);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Failed to add card');
      }
    } catch (err) {
      console.error('Add failed:', err);
      alert('Failed to add card');
    } finally {
    setAdding(false);
    }
  };

  const handleRemoveItem = async (itemId: string, portfolioId: string, cardName: string) => {
    if (!confirm(`Remove "${cardName}" from portfolio?`)) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/portfolios/${portfolioId}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccessMessage(`✓ Removed from Portfolio`);
        fetchPortfolios();
        if (selectedPortfolio) fetchPortfolioValue(selectedPortfolio);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Failed to remove card');
      }
    } catch (err) {
      console.error('Remove failed:', err);
      alert('Failed to remove card');
    }
  };

  const handleCreatePortfolio = async () => {
    const token = localStorage.getItem('token');
    if (!token || !newPortfolioName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/portfolios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newPortfolioName.trim(), isPublic: false })
      });

      if (response.ok) {
        const newPortfolio = await response.json();
        await fetchPortfolios();
        setSelectedPortfolio(newPortfolio.id);
        setAddPortfolioId(newPortfolio.id);
        setShowCreateModal(false);
        setNewPortfolioName('');
      } else {
        alert('Failed to create portfolio');
      }
    } catch (err) {
      console.error('Create failed:', err);
      alert('Failed to create portfolio');
    } finally {
      setCreating(false);
    }
  };

  const handleRenamePortfolio = async (portfolioId: string) => {
    const token = localStorage.getItem('token');
    if (!token || !editName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/portfolios/${portfolioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName.trim() })
      });

      if (response.ok) {
        await fetchPortfolios();
        setEditingPortfolioId(null);
        setEditName('');
      } else {
        alert('Failed to rename portfolio');
      }
    } catch (err) {
      console.error('Rename failed:', err);
      alert('Failed to rename portfolio');
    }
  };

  const handleDeletePortfolio = async () => {
    if (!deletingPortfolioId) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/portfolios/${deletingPortfolioId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchPortfolios();
        if (selectedPortfolio === deletingPortfolioId) {
          const remaining = portfolios.filter(p => p.id !== deletingPortfolioId);
          if (remaining.length > 0) {
            setSelectedPortfolio(remaining[0].id);
            setAddPortfolioId(remaining[0].id);
          }
        }
        setShowMenuFor(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete portfolio');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete portfolio');
    } finally {
      setShowDeleteModal(false);
      setDeletingPortfolioId(null);
    }
  };

  const confirmDeletePortfolio = (portfolioId: string) => {
    setDeletingPortfolioId(portfolioId);
    setShowDeleteModal(true);
    setShowMenuFor(null);
  };

  const currentPortfolio = portfolios.find(p => p.id === selectedPortfolio);

  // Filter items based on view mode
  const filteredItems = currentPortfolio?.items.filter(item => {
    if (viewMode === 'graded') return item.isGraded;
    if (viewMode === 'ungraded') return !item.isGraded;
    return true;
  }) || [];

  const normalizeRarity = (rarity: string | null): string => {
    if (!rarity) return '';
    if (rarity.toUpperCase().includes('MEGA') && rarity.toUpperCase().includes('RARE')) {
      return 'Mega Rare';
    }
    return rarity;
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
      amazon: amazonUrl,
      ebay: ebayUrl
    };
  };

  const getConditionColor = (condition: string) => {
    const c = condition.toUpperCase();
    if (c === 'MINT' || c === 'NEAR_MINT') return 'bg-green-600';
    if (c === 'LIGHTLY_PLAYED') return 'bg-yellow-600';
    if (c === 'MODERATELY_PLAYED') return 'bg-orange-600';
    if (c === 'HEAVILY_PLAYED') return 'bg-red-600';
    if (c === 'DAMAGED') return 'bg-gray-600';
    return 'bg-gray-600';
  };

  const getSlabCompanyColor = (company: string) => {
    const c = company?.toLowerCase() || '';
    if (c.includes('psa')) return '#ef4444';
    if (c.includes('cgc')) return '#60a5fa';
    if (c.includes('bgs') || c.includes('beckett')) return '#d4af37';
    if (c.includes('sgc')) return '#22c55e';
    return '#ffffff';
  };

  const getRawCardPrice = (item: PortfolioItem): number | null => {
    if (item.card?.currentPrice != null) {
      return item.card?.currentPrice;
    }
    return item.card?.prices?.[0]?.priceMarket ?? null;
  };

  const getDisplayUnitValue = (item: PortfolioItem): number | null => {
    if (item.valuationOverride != null) {
      return item.valuationOverride;
    }
    return getRawCardPrice(item);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-poke-bg p-6 flex items-center justify-center">
        <div className="bg-poke-bg-light/50 backdrop-blur-md border border-poke-border/20 rounded-xl p-8 text-center">
          <p className="text-poke-text-muted animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

    const token = localStorage.getItem('token');
    if (!token) {
      return (
        <div className="min-h-screen bg-poke-bg p-6 flex items-center justify-center">
          <div className="bg-poke-bg-light/50 backdrop-blur-md border border-poke-border/20 rounded-xl p-8 max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Portfolio</h1>
            <p className="text-poke-text-muted mb-4">Please <a href="/login" className="text-poke-red hover:underline">login</a> to view your portfolio.</p>
          </div>
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-poke-bg p-6">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedPortfolio}
                onChange={(e) => {
                  setSelectedPortfolio(e.target.value);
                  setAddPortfolioId(e.target.value);
                  setShowMenuFor(null);
                }}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(230,57,70,0.5)', 
                  color: '#e63946',
                  padding: '0.5rem 2rem 0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  appearance: 'none',
                  minWidth: '180px'
                }}
              >
                {portfolios.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#1a2332' }}>{p.name}</option>
                ))}
              </select>
              <svg 
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#e63946', pointerEvents: 'none', width: '16px', height: '16px' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <button
              onClick={() => setShowMenuFor(showMenuFor ? null : selectedPortfolio)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg style={{ color: '#94a3b8', width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
            {showMenuFor === selectedPortfolio && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.5rem',
                background: '#1a2332',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '0.5rem',
                zIndex: 1000,
                minWidth: '150px'
              }}>
                {editingPortfolioId === selectedPortfolio ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenamePortfolio(selectedPortfolio)}
                      autoFocus
                      style={{ 
                        background: '#0a0f1e', 
                        border: '1px solid rgba(255,255,255,0.2)', 
                        color: 'white',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        width: '120px'
                      }}
                    />
                    <button
                      onClick={() => handleRenamePortfolio(selectedPortfolio)}
                      style={{ background: '#22c55e', border: 'none', borderRadius: '4px', color: 'white', padding: '0.5rem', cursor: 'pointer' }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => { setEditingPortfolioId(null); setEditName(''); }}
                      style={{ background: '#666', border: 'none', borderRadius: '4px', color: 'white', padding: '0.5rem', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditingPortfolioId(selectedPortfolio); setEditName(currentPortfolio?.name || ''); setShowMenuFor(null); }}
                      style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: 'white', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}
                    >
                      Rename
                    </button>
                    {portfolios.length > 1 && (
                      <button
                        onClick={() => confirmDeletePortfolio(selectedPortfolio)}
                        style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#ef4444', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              + New Portfolio
            </button>
            {portfolioValue && (
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.15))', 
                border: '1px solid rgba(255,215,0,0.3)', 
                borderRadius: '12px', 
                padding: '1rem 1.5rem',
                textAlign: 'right'
              }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portfolio Value</div>
                <div style={{ color: '#ffd700', fontSize: '1.75rem', fontWeight: 'bold' }}>${portfolioValue.totalValue.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>

        {successMessage && (
          <div style={{ 
            backgroundColor: 'rgba(34, 197, 94, 0.1)', 
            color: '#22c55e', 
            padding: '1rem', 
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            {successMessage}
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search for a card..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-poke-bg-light border border-poke-border/20 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-poke-red"
            />
            <svg 
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: '20px', height: '20px' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#1a2332',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                marginTop: '0.25rem'
              }}>
                {searchResults.map(card => (
                  <div
                    key={card.id}
                    onClick={() => {
                      setSelectedCard(card);
                      setSearchResults([]);
                      setSearchQuery('');
                      setShowModal(true);
                    }}
                    style={{
                      padding: '0.75rem',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    {card.imageUrl && (
                      <img src={card.imageUrl} alt={card.name} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: '4px' }} />
                    )}
                    <div>
                      <div style={{ color: 'white', fontWeight: 'bold' }}>{card.name}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        {card.setName} ({card.setCode} #{card.cardNumber})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded text-sm font-medium transition-all 
              ${viewMode === 'all' ? 'bg-poke-red text-white' : 'bg-poke-bg-light text-gray-400 hover:text-white hover:bg-poke-bg-medium'}`}
          >
            All Cards ({currentPortfolio?.items.length || 0})
          </button>
          <button
            onClick={() => setViewMode('graded')}
            className={`px-4 py-2 rounded text-sm font-medium transition-all 
              ${viewMode === 'graded' ? 'bg-poke-red text-white' : 'bg-poke-bg-light text-gray-400 hover:text-white hover:bg-poke-bg-medium'}`}
          >
            Graded ({currentPortfolio?.items.filter(i => i.isGraded).length || 0})
          </button>
          <button
            onClick={() => setViewMode('ungraded')}
            className={`px-4 py-2 rounded text-sm font-medium transition-all 
              ${viewMode === 'ungraded' ? 'bg-poke-red text-white' : 'bg-poke-bg-light text-gray-400 hover:text-white hover:bg-poke-bg-medium'}`}
          >
            Ungraded ({currentPortfolio?.items.filter(i => !i.isGraded).length || 0})
          </button>
        </div>

        {!filteredItems || filteredItems.length === 0 ? (
           <div className="bg-poke-bg-light/50 backdrop-blur-md border border-poke-border/20 rounded-xl p-12 text-center">
             <div className="flex items-center justify-center mb-6">
               <PokeballDecorative />
             </div>
             <h2 className="text-xl font-bold text-white mb-2">
               Your portfolio is empty
             </h2>
             <p className="text-poke-text-muted mb-6">
               Start adding cards to track your collection!
             </p>
             <Link href="/marketplace" className="bg-poke-red hover:bg-poke-red-dark text-white font-medium px-6 py-2 rounded-lg transition-colors">
               Browse Marketplace
             </Link>
           </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-visible">
            {filteredItems.map(item => {
              const links = getAffiliateLinks(item.card || {});
              const normalizedRarity = normalizeRarity(item.card?.rarity);
              const itemUnitValue = getDisplayUnitValue(item);
              return (
                <div
                  key={item.id}
                  className={`card-wrapper bg-[#111827] rounded-xl overflow-visible border ${getTypeColor(normalizedRarity)} card-lift ${isRareHolo(normalizedRarity) ? 'holo-effect' : ''}`}
                  style={{ maxWidth: '100%', boxSizing: 'border-box' }}
                >
                  <Link href={`/marketplace/${item.card?.id}`} className="block">
                    <div className="relative min-h-[200px] bg-gradient-to-br from-[#1a2332] to-[#0a0f1e] flex items-center justify-center p-3">
                      {item.isGraded ? (
                        <div style={{ 
                          position: 'relative', 
                          width: '100%', 
                          aspectRatio: '334/522',  
                          maxHeight: '100%',
                          background: '#0d0d18',
                          overflow: 'hidden',
                          borderRadius: '8px',
                        }}>
                          <img
                            src={item.card?.imageUrl}
                            alt={item.card?.name || 'Card'}
                            style={{
                              position: 'absolute',
                              top: '29%',
                              left: '8%',
                              width: '84%',
                              height: '65%',
                              objectFit: 'cover',
                              objectPosition: 'center top',
                              overflow: 'hidden',
                              borderRadius: '3px',
                              zIndex: 1,
                            }}
                          />
                          <img
                            src="/images/slab_overlay.png"
                            alt="graded slab"
                            style={{
                              position: 'absolute',
                              top: 0, left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              zIndex: 2,
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '3.6%',
                            left: '8%',
                            width: '84%',
                            zIndex: 3,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0 4px',
                          }}>
                            <span style={{
                              fontSize: '9px', fontWeight: '900', 
                              letterSpacing: '1px',
                              color: getSlabCompanyColor(item.gradeCompany || ''),
                              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                            }}>
                              {item.gradeCompany?.toUpperCase()}
                            </span>
                            <span style={{
                              fontSize: '12px', fontWeight: '900',
                              color: '#f0c040',
                              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                            }}>
                              {item.gradeValue}
                            </span>
                          </div>
                        </div>
                      ) : (
                        item.card?.imageUrl ? (
                          <img
                            src={item.card?.imageUrl}
                            alt={item.card?.name}
                            className="max-w-full max-h-full object-contain drop-shadow-lg"
                          />
                        ) : (
                          <div className="text-poke-text-muted text-sm">No Image</div>
                        )
                      )}
                      {!item.isGraded && (
                        <span className={`absolute top-2 left-2 ${getConditionColor(item.condition)} text-white text-xs px-2 py-0.5 rounded`}>
                          {item.condition.replace('_', ' ')}
                        </span>
                      )}
                      {item.quantity > 1 && (
                        <span className="absolute top-2 right-2 bg-poke-red text-white text-xs px-2 py-0.5 rounded">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <h3 className="font-rajdhani font-bold text-white truncate">
                        {item.card?.name}
                      </h3>
                        <p className="text-xs text-poke-text-muted truncate font-dm-sans">
                          {item.card?.setName || 'Unknown Set'}
                        </p>
                      <div className="flex items-center justify-between">
                        <RarityBadge rarity={normalizedRarity} />
                        {itemUnitValue != null && (
                          <span className="text-sm font-bold text-poke-gold">
                            ${itemUnitValue.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {item.purchasePrice && (
                        <div className="text-xs text-poke-text-muted">
                          Paid: <span className="text-poke-gold font-bold">${item.purchasePrice.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="quick-links flex gap-1 px-3 pb-3">
                    <a href={links.amazon} target="_blank" rel="noopener noreferrer" className="flex-1 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-400 text-black text-center rounded transition-colors">Amazon</a>
                    <a href={links.ebay} target="_blank" rel="noopener noreferrer" className="flex-1 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white text-center rounded transition-colors">eBay</a>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveItem(item.id, currentPortfolio?.id ?? '', item.card?.name);
                      }}
                      className="flex-1 py-1.5 text-xs bg-gray-600 hover:bg-red-500 text-white text-center rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && selectedCard && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: '#1a2332',
              padding: '2rem',
              borderRadius: '16px',
              maxWidth: '400px',
              width: '90%',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h3 style={{ color: 'white', margin: '0 0 0.5rem' }}>Add {selectedCard.name} to Portfolio</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
                {selectedCard.setName} ({selectedCard.setCode} #{selectedCard.cardNumber})
              </p>

              {portfolios.length > 1 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Portfolio</label>
                  <select
                    value={addPortfolioId}
                    onChange={(e) => setAddPortfolioId(e.target.value)}
                    className="w-full bg-poke-bg-light border border-poke-border/20 rounded-lg p-3 text-white cursor-pointer"
                  >
                    {portfolios.map(p => (
                      <option key={p.id} value={p.id} style={{ background: '#1a2332' }}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full bg-poke-bg-light border border-poke-border/20 rounded-lg p-3 text-white cursor-pointer"
                >
                  <option value="MINT" style={{ background: '#1a2332' }}>Mint</option>
                  <option value="NEAR_MINT" style={{ background: '#1a2332' }}>Near Mint</option>
                  <option value="LIGHTLY_PLAYED" style={{ background: '#1a2332' }}>Lightly Played</option>
                  <option value="MODERATELY_PLAYED" style={{ background: '#1a2332' }}>Moderately Played</option>
                  <option value="HEAVILY_PLAYED" style={{ background: '#1a2332' }}>Heavily Played</option>
                  <option value="DAMAGED" style={{ background: '#1a2332' }}>Damaged</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-poke-bg-light border border-poke-border/20 rounded-lg p-3 text-white"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Purchase Price (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-poke-bg-light border border-poke-border/20 rounded-lg p-3 text-white"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToPortfolio}
                  disabled={adding}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: adding ? '#666' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: adding ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {adding ? 'Adding...' : 'Add to Portfolio'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: '#1a2332',
              padding: '2rem',
              borderRadius: '16px',
              maxWidth: '400px',
              width: '90%',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h3 style={{ color: 'white', margin: '0 0 1.5rem' }}>Create New Portfolio</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Portfolio Name</label>
                <input
                  type="text"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  placeholder="My Collection"
                  className="w-full bg-poke-bg-light border border-poke-border/20 rounded-lg p-3 text-white"
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => { setShowCreateModal(false); setNewPortfolioName(''); }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePortfolio}
                  disabled={creating || !newPortfolioName.trim()}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: creating || !newPortfolioName.trim() ? '#666' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: creating || !newPortfolioName.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: 'rgba(26, 35, 50, 0.95)',
              backdropFilter: 'blur(20px)',
              padding: '2rem',
              borderRadius: '16px',
              maxWidth: '400px',
              width: '90%',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h3 style={{ color: 'white', margin: '0 0 1rem', fontSize: '1.25rem' }}>Delete Portfolio</h3>
              <p style={{ color: '#94a3b8', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong style={{ color: 'white' }}>{currentPortfolio?.name}</strong>? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingPortfolioId(null); }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePortfolio}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
