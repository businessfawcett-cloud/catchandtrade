export const GAME_TYPES = [
  'POKEMON',
  'MTG',
  'YUGIOH',
  'SPORTS',
  'ONE_PIECE',
  'LORCANA',
  'OTHER',
] as const;

export type GameType = (typeof GAME_TYPES)[number];

export const COMMISSION_PERCENT = 8;

export const CONDITIONS = [
  'MINT',
  'NEAR_MINT',
  'LIGHTLY_PLAYED',
  'MODERATELY_PLAYED',
  'HEAVILY_PLAYED',
  'DAMAGED',
] as const;

export type Condition = (typeof CONDITIONS)[number];

export const LISTING_STATUSES = [
  'ACTIVE',
  'SOLD',
  'CANCELLED',
  'EXPIRED',
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'DISPUTED',
  'REFUNDED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ALERT_TYPES = [
  'PRICE_ABOVE',
  'PRICE_BELOW',
  'PERCENT_CHANGE',
] as const;

export type AlertType = (typeof ALERT_TYPES)[number];

export type GradingService = 'PSA' | 'CGC' | 'BGS' | 'SGC';
export type GradingTier = 'economy' | 'standard' | 'express';
export type Grade = 10 | 9 | 8 | 7 | 6;

export const GRADING_FEES: Record<GradingService, Record<GradingTier, number>> = {
  PSA: { economy: 40, standard: 75, express: 150 },
  CGC: { economy: 14, standard: 25, express: 75 },
  BGS: { economy: 35, standard: 75, express: 150 },
  SGC: { economy: 19, standard: 39, express: 79 },
};

export const GRADING_TURNAROUND: Record<GradingService, Record<GradingTier, string>> = {
  PSA: { economy: '2–6 months', standard: '30–45 days', express: '10 days' },
  CGC: { economy: '40–80 days', standard: '20–30 days', express: '10 days' },
  BGS: { economy: '3–8 weeks', standard: '2–3 weeks', express: '5 days' },
  SGC: { economy: '2–4 weeks', standard: '1–2 weeks', express: '3–5 days' },
};

export const GRADE_MULTIPLIERS: Record<GradingService, Record<Grade, number>> = {
  PSA: { 10: 6.0, 9: 1.8, 8: 1.2, 7: 0.9, 6: 0.7 },
  CGC: { 10: 3.5, 9: 1.5, 8: 1.1, 7: 0.8, 6: 0.6 },
  BGS: { 10: 4.0, 9: 1.6, 8: 1.1, 7: 0.8, 6: 0.6 },
  SGC: { 10: 2.5, 9: 1.4, 8: 1.0, 7: 0.8, 6: 0.6 },
};

export const GRADING_VERDICT_THRESHOLDS = {
  STRONG: 1.0,
  MARGINAL: 0.3,
} as const;
