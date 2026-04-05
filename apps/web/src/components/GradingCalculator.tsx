'use client';

import { useState } from 'react';
import { GRADING_FEES, GradingService, GradingTier, Grade } from '@/lib/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

interface GradingResult {
  cardName: string;
  rawPrice: number;
  expectedGrade: number;
  service: string;
  tier: string;
  gradedValue: number;
  gradingFee: number;
  netProfit: number;
  roi: number;
  turnaround: string;
  verdict: 'strong' | 'marginal' | 'skip';
  verdictText: string;
  verdictColor: 'green' | 'yellow' | 'red';
  priceSource?: 'psa_population' | 'multiplier';
  rarityInfo?: {
    totalGraded: number;
    gradeCount: number;
    percentage: number;
  };
}

interface GradingCalculatorProps {
  cardId: string;
  cardName: string;
  currentPrice?: number;
}

const services: GradingService[] = ['PSA', 'CGC', 'BGS', 'SGC'];
const tiers: GradingTier[] = ['economy', 'standard', 'express'];
const grades: Grade[] = [10, 9, 8, 7, 6];

const tierLabels: Record<GradingTier, string> = {
  economy: 'Economy',
  standard: 'Standard',
  express: 'Express',
};

const serviceColors: Record<GradingService, string> = {
  PSA: 'bg-poke-red',
  CGC: 'bg-blue-500',
  BGS: 'bg-yellow-500',
  SGC: 'bg-green-500',
};

export default function GradingCalculator({ cardId, cardName, currentPrice }: GradingCalculatorProps) {
  const [selectedService, setSelectedService] = useState<GradingService>('PSA');
  const [selectedTier, setSelectedTier] = useState<GradingTier>('economy');
  const [selectedGrade, setSelectedGrade] = useState<Grade>(9);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateROI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const cardValue = currentPrice || 50;
    console.log('Calculating ROI for card value:', cardValue);

    try {
      const response = await fetch('/api/grading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardValue: cardValue,
          service: selectedService,
          tier: selectedTier,
          expectedGrade: selectedGrade
        })
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        setError(data.error || 'Failed to calculate');
        return;
      }

      setResult({
        cardName,
        rawPrice: cardValue,
        expectedGrade: selectedGrade,
        service: selectedService,
        tier: selectedTier,
        gradedValue: data.potentialValue || 0,
        gradingFee: data.gradingCost || 0,
        netProfit: data.profit || 0,
        roi: data.roi || 0,
        turnaround: selectedTier === 'economy' ? '45-60 days' : selectedTier === 'standard' ? '30-40 days' : '15-20 days',
        verdict: data.recommended ? 'strong' : data.roi > 20 ? 'marginal' : 'skip',
        verdictText: data.recommended ? 'Great ROI potential!' : data.roi > 20 ? 'Marginal returns' : 'Not worth grading',
        verdictColor: data.recommended ? 'green' : data.roi > 20 ? 'yellow' : 'red'
      });
    } catch (err) {
      console.error('Grading calc error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictBgColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-500/20 border-green-500';
      case 'yellow':
        return 'bg-yellow-500/20 border-yellow-500';
      case 'red':
        return 'bg-red-500/20 border-red-500';
      default:
        return 'bg-gray-500/20 border-gray-500';
    }
  };

  const getVerdictTextColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-400';
      case 'yellow':
        return 'text-yellow-400';
      case 'red':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="mt-8 p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <h2 className="text-2xl font-rajdhani font-bold text-white mb-6">Is This Worth Grading?</h2>

      <div className="space-y-4">
        <div>
          <label className="text-poke-text-muted text-sm mb-2 block">Service</label>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <button
                key={service}
                onClick={() => setSelectedService(service)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedService === service
                    ? serviceColors[service] + ' text-white'
                    : 'bg-poke-bg-light text-poke-text-muted hover:text-white'
                }`}
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-poke-text-muted text-sm mb-2 block">Tier</label>
          <div className="flex flex-wrap gap-2">
            {tiers.map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedTier === tier
                    ? 'bg-poke-gold text-black'
                    : 'bg-poke-bg-light text-poke-text-muted hover:text-white'
                }`}
              >
                {tierLabels[tier]} (${GRADING_FEES[selectedService][tier]})
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-poke-text-muted text-sm mb-2 block">Expected Grade</label>
          <div className="flex flex-wrap gap-2">
            {grades.map((grade) => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedGrade === grade
                    ? 'bg-poke-red text-white'
                    : 'bg-poke-bg-light text-poke-text-muted hover:text-white'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={calculateROI}
          disabled={loading}
          className="w-full mt-4 py-3 rounded-lg font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(to right, #e63946, #c1121f)' }}
        >
          {loading ? 'Calculating...' : 'Calculate ROI'}
        </button>

        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}

        {result && (
          <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-poke-text-muted">Raw value:</span>
                <span className="text-white">${result.rawPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-poke-text-muted">Grading fee:</span>
                <span className="text-red-400">-${result.gradingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-poke-text-muted">Est. graded value:</span>
                <span className="text-white">${result.gradedValue.toFixed(2)}</span>
              </div>
              {result.rarityInfo && (
                <div className="flex justify-between text-xs">
                  <span className="text-poke-text-muted">PSA Pop:</span>
                  <span className="text-blue-400">
                    {result.rarityInfo.gradeCount} / {result.rarityInfo.totalGraded} ({result.rarityInfo.percentage.toFixed(1)}%)
                  </span>
                </div>
              )}
              {result.priceSource === 'psa_population' && (
                <div className="text-xs text-blue-400">Based on real PSA population data</div>
              )}
              <div className="border-t border-poke-border my-2"></div>
              <div className="flex justify-between">
                <span className="text-poke-text-muted">Net profit:</span>
                <span className={result.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {result.netProfit >= 0 ? '+' : ''}${result.netProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-poke-text-muted">ROI:</span>
                <span className={result.roi >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {result.roi.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-poke-text-muted">Est. turnaround:</span>
                <span className="text-white">{result.turnaround}</span>
              </div>
            </div>

            <div className={`mt-4 p-3 rounded-lg text-center border ${getVerdictBgColor(result.verdictColor)}`}>
              <span className={`font-bold ${getVerdictTextColor(result.verdictColor)}`}>
                {result.verdictText}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
