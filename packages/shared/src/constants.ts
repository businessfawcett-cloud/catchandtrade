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
