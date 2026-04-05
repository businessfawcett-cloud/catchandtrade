'use client';

import { useState } from 'react';
import Link from 'next/link';

const GRADING_SERVICES = {
  'PSA': { name: 'PSA', baseCost: 30 },
  'BGS': { name: 'BGS', baseCost: 40 },
  'CGC': { name: 'CGC', baseCost: 25 }
};

const GRADE_VALUES = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1];

const VALUE_TIERS = [
  { max: 100, psa10: 1.5, psa9: 1.2, bgs95: 1.8, bgs9: 1.4, cgc10: 1.6, cgc9: 1.3 },
  { max: 500, psa10: 2.0, psa9: 1.5, bgs95: 2.5, bgs9: 1.8, cgc10: 2.2, cgc9: 1.6 },
  { max: 1000, psa10: 3.0, psa9: 2.0, bgs95: 3.5, bgs9: 2.5, cgc10: 3.0, cgc9: 2.0 },
  { max: 5000, psa10: 4.0, psa9: 2.5, bgs95: 5.0, bgs9: 3.0, cgc10: 4.0, cgc9: 2.5 },
  { max: 10000, psa10: 5.0, psa9: 3.0, bgs95: 6.0, bgs9: 4.0, cgc10: 5.0, cgc9: 3.0 },
  { max: 999999, psa10: 6.0, psa9: 3.5, bgs95: 7.0, bgs9: 5.0, cgc10: 6.0, cgc9: 3.5 }
];

function getTier(value) {
  for (let i = 0; i < VALUE_TIERS.length; i++) {
    if (value < VALUE_TIERS[i].max) return VALUE_TIERS[i];
  }
  return VALUE_TIERS[VALUE_TIERS.length - 1];
}

export default function GradingPage() {
  const [cardValue, setCardValue] = useState(100);
  const [selectedService, setSelectedService] = useState('PSA');
  const [targetGrade, setTargetGrade] = useState(10);
  const [showResults, setShowResults] = useState(false);

  const calculateGradingCost = (service, value) => {
    const baseCost = GRADING_SERVICES[service]?.baseCost || 30;
    const valueMultiplier = value > 5000 ? 1.5 : value > 1000 ? 1.3 : 1;
    return Math.round(baseCost * valueMultiplier);
  };

  const calculatePotentialValue = (service, grade, value) => {
    const tier = getTier(value);
    let multiplier = 1;
    
    if (service === 'PSA') {
      multiplier = grade === 10 ? tier.psa10 : grade === 9 ? tier.psa9 : 1;
    } else if (service === 'BGS') {
      multiplier = grade === 9.5 ? tier.bgs95 : grade === 9 ? tier.bgs9 : 1;
    } else if (service === 'CGC') {
      multiplier = grade === 10 ? tier.cgc10 : grade === 9 ? tier.cgc9 : 1;
    }
    
    return value * multiplier;
  };

  const gradingCost = calculateGradingCost(selectedService, cardValue);
  const potentialValue = calculatePotentialValue(selectedService, targetGrade, cardValue);
  const potentialProfit = potentialValue - cardValue - gradingCost;
  const roi = ((potentialProfit / gradingCost) * 100).toFixed(0);
  const isWorthIt = potentialProfit > 0;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>← Back</Link>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>Grading ROI Calculator</h1>
          <div style={{ width: '80px' }} />
        </div>

        <div style={{ 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: '16px', 
          padding: '24px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Card Current Value ($)
            </label>
            <input
              type="number"
              value={cardValue}
              onChange={(e) => setCardValue(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Grading Service
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {Object.keys(GRADING_SERVICES).map(service => (
                <button
                  key={service}
                  onClick={() => setSelectedService(service)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: selectedService === service ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
                    background: selectedService === service ? 'rgba(255,215,0,0.1)' : 'rgba(0,0,0,0.3)',
                    color: selectedService === service ? '#ffd700' : 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Target Grade
            </label>
            <select
              value={targetGrade}
              onChange={(e) => setTargetGrade(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '16px'
              }}
            >
              {GRADE_VALUES.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowResults(true)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              background: '#ffd700',
              color: '#0a0f1e',
              fontSize: '16px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Calculate ROI
          </button>

          {showResults && (
            <div style={{ marginTop: '24px', padding: '20px', borderRadius: '12px', background: isWorthIt ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${isWorthIt ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
              <h3 style={{ color: isWorthIt ? '#22c55e' : '#ef4444', fontSize: '18px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
                {isWorthIt ? '✓ Worth Grading!' : '✗ Not Worth Grading'}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>Grading Cost</div>
                  <div style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>${gradingCost}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>Potential Value</div>
                  <div style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>${Math.round(potentialValue)}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>Potential Profit</div>
                  <div style={{ color: potentialProfit > 0 ? '#22c55e' : '#ef4444', fontSize: '20px', fontWeight: '700' }}>
                    {potentialProfit > 0 ? '+' : ''}${Math.round(potentialProfit)}
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>ROI</div>
                  <div style={{ color: Number(roi) > 0 ? '#22c55e' : '#ef4444', fontSize: '20px', fontWeight: '700' }}>{roi}%</div>
                </div>
              </div>

              <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center' }}>
                * Estimates based on typical market multipliers. Actual values may vary.
              </p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '24px', padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Quick Tips</h3>
          <ul style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>Cards under $100 typically not worth grading</li>
            <li>PSA 10 and BGS 9.5 command the highest premiums</li>
            <li>Modern cards (2000+) need gem mint for premium</li>
            <li>Pre-2000 cards can benefit from any graded copy</li>
          </ul>
        </div>
      </div>
    </div>
  );
}