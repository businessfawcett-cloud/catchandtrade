'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PricePoint {
  date: string;
  price: number;
}

interface Props {
  cardId: string;
  currentPrice: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export default function PriceHistoryChart({ cardId, currentPrice }: Props) {
  const [period, setPeriod] = useState<'7' | '30' | '90' | '365'>('30');
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [change, setChange] = useState<string>('0');
  const [hasRealData, setHasRealData] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/cards/${cardId}/price-history?period=${period}`);
        const json = await res.json();
        setData(json.data || []);
        setChange(json.change || '0');
        setHasRealData(json.hasRealData || false);
      } catch (e) {
        console.error('Failed to fetch price history:', e);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [cardId, period]);

  const isPositive = parseFloat(change) >= 0;
  const displayPrice = currentPrice || (data.length > 0 ? data[data.length - 1].price : 0);

  const periods = [
    { value: '7', label: '7D' },
    { value: '30', label: '30D' },
    { value: '90', label: '90D' },
    { value: '365', label: '1Y' }
  ];

  return (
    <div style={{ 
      background: '#1a2332', 
      borderRadius: '12px', 
      padding: '1.5rem',
      marginTop: '1.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffd700' }}>
              ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ 
              fontSize: '1rem', 
              color: isPositive ? '#10b981' : '#ef4444',
              display: 'flex', alignItems: 'center', gap: '0.25rem'
            }}>
              {isPositive ? '▲' : '▼'} {Math.abs(parseFloat(change)).toFixed(1)}%
            </span>
          </div>
          {!hasRealData && (
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
              Showing estimated prices
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as any)}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                background: period === p.value ? '#e63946' : 'rgba(255,255,255,0.1)',
                color: period === p.value ? 'white' : '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          Loading...
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={11}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={11}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              width={50}
            />
            <Tooltip
              contentStyle={{ 
                background: '#111827', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#ffd700" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#ffd700' }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          No price history available
        </div>
      )}
    </div>
  );
}
