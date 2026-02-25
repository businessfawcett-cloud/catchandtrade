import { GAME_TYPES, COMMISSION_PERCENT, CONDITIONS } from '../constants';

describe('shared constants', () => {
  it('exports GAME_TYPES with POKEMON', () => {
    expect(GAME_TYPES).toContain('POKEMON');
  });

  it('exports COMMISSION_PERCENT as 8', () => {
    expect(COMMISSION_PERCENT).toBe(8);
  });

  it('exports all game types', () => {
    expect(GAME_TYPES).toContain('MTG');
    expect(GAME_TYPES).toContain('YUGIOH');
    expect(GAME_TYPES).toContain('SPORTS');
    expect(GAME_TYPES).toContain('ONE_PIECE');
    expect(GAME_TYPES).toContain('LORCANA');
  });

  it('exports all conditions', () => {
    expect(CONDITIONS).toContain('MINT');
    expect(CONDITIONS).toContain('NEAR_MINT');
    expect(CONDITIONS).toContain('LIGHTLY_PLAYED');
    expect(CONDITIONS).toContain('MODERATELY_PLAYED');
    expect(CONDITIONS).toContain('HEAVILY_PLAYED');
    expect(CONDITIONS).toContain('DAMAGED');
  });
});
