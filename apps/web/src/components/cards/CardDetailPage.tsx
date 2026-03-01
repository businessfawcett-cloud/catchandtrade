import Link from 'next/link';
import { GAME_TYPES } from '@catchandtrade/shared';
import PriceHistoryChart from '../PriceHistoryChart';

interface CardPrice {
  date: Date;
  priceMarket: number | null;
}

interface Card {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
  gameType: string;
  prices: CardPrice[];
}

interface Listing {
  id: string;
  title: string;
  buyNowPrice: number;
  condition: string;
  isGraded: boolean;
  gradeValue: number | null;
}

interface Props {
  card: Card;
  listings: Listing[];
  expectedValue: number;
  trend: 'rising' | 'falling' | 'stable';
  isGraded: boolean;
}

export default function CardDetailPage({ card, listings, expectedValue, trend, isGraded }: Props) {
  const currentPrice = card.prices[0]?.priceMarket || 0;

  const trendIcon = trend === 'rising' ? '↑' : trend === 'falling' ? '↓' : '→';
  const trendColor = trend === 'rising' ? 'green' : trend === 'falling' ? 'red' : 'gray';

  const gradedListings = listings.filter(l => l.isGraded);
  const rawListings = listings.filter(l => !l.isGraded);
  const displayListings = isGraded ? gradedListings : rawListings;

  return (
    <div>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <div style={{ 
            backgroundColor: '#f0f0f0', 
            borderRadius: '8px',
            height: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} style={{ maxHeight: '400px' }} />
            ) : (
              <span>Card Image</span>
            )}
          </div>
        </div>

        <div style={{ flex: '1', minWidth: '300px' }}>
          <h1>{card.name}</h1>
          <p style={{ color: '#666' }}>{card.setName} ({card.setCode})</p>
          <p>Card Number: {card.cardNumber}</p>
          {card.rarity && <p>Rarity: {card.rarity}</p>}
          <p>Game Type: {card.gameType}</p>

          <div style={{ marginTop: '2rem' }}>
            <h2>Pricing</h2>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              ${currentPrice.toLocaleString()}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                onClick={() => window.location.href = `/portfolio/add?cardId=${card.id}`}
                style={{ padding: '0.75rem 1.5rem', cursor: 'pointer' }}
              >
                Add to Portfolio
              </button>
              <button 
                onClick={() => window.location.href = `/watchlist/add?cardId=${card.id}`}
                style={{ padding: '0.75rem 1.5rem', cursor: 'pointer' }}
              >
                Add to Watchlist
              </button>
            </div>
          </div>

          <PriceHistoryChart cardId={card.id} currentPrice={currentPrice} />

          <div style={{ marginTop: '2rem' }}>
            <h3>Expected Value</h3>
            <div style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>${expectedValue.toLocaleString()}</span>
              <span style={{ color: trendColor, fontSize: '1.2rem' }}>{trendIcon}</span>
              <span style={{ color: trendColor, fontSize: '0.9rem' }}>
                {trend === 'rising' ? 'Rising' : trend === 'falling' ? 'Falling' : 'Stable'}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3>Graded / Raw</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => window.location.search = '?graded=false'}
                style={{ padding: '0.5rem 1rem', backgroundColor: !isGraded ? '#007AFF' : '#ccc' }}
              >
                Raw
              </button>
              <button 
                onClick={() => window.location.search = '?graded=true'}
                style={{ padding: '0.5rem 1rem', backgroundColor: isGraded ? '#007AFF' : '#ccc' }}
              >
                Graded
              </button>
            </div>
          </div>
        </div>
      </div>

      {displayListings.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2>Marketplace Listings</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {displayListings.map(listing => (
              <div key={listing.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
                <h4>{listing.title}</h4>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  ${listing.buyNowPrice.toLocaleString()}
                </p>
                <p>{listing.isGraded ? `Grade: ${listing.gradeValue}` : listing.condition}</p>
                <Link href={`/marketplace/${listing.id}`}>
                  <button style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}>
                    View Listing
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '3rem' }}>
        <h2>Price History</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button style={{ padding: '0.5rem' }}>30D</button>
          <button style={{ padding: '0.5rem' }}>90D</button>
          <button style={{ padding: '0.5rem' }}>1Y</button>
        </div>
        <div style={{ height: '300px', backgroundColor: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Price Chart
        </div>
      </div>

      <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Buy Links</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {(() => {
            const amazonTag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || '';
            const amazonSearchTerm = encodeURIComponent(`${card.name} Pokemon Card`);
            return amazonTag ? (
              <a href={`https://www.amazon.com/s?k=${amazonSearchTerm}&tag=${amazonTag}`} target="_blank" rel="noopener noreferrer">
                Search on Amazon
              </a>
            ) : null;
          })()}
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', textAlign: 'center' }}>
        Advertisement
      </div>
    </div>
  );
}
