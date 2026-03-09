import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@catchandtrade/db';
import { authenticate } from '../../middleware/auth';
import { getPokemonIdFromCardName, getPokemonName, getGeneration, getGenerationName, getPokemonSpriteUrl, POKEMON_SPECIES } from '@catchandtrade/shared';

export const pokedexRouter = Router();

// GET /api/pokedex/overview
// Returns all Pokemon with owned status for current user
pokedexRouter.get('/overview', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    // Get all cards the user owns with their portfolio items
    const portfolioItems = await prisma.portfolioItem.findMany({
      where: {
        portfolio: { userId }
      },
      include: {
        card: {
          include: {
            prices: {
              orderBy: { date: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    // Group cards by Pokemon species
    const ownedPokemon = new Map<number, {
      pokemonId: number;
      name: string;
      owned: boolean;
      cardCount: number;
      hasGraded: boolean;
      hasPSA10: boolean;
      marketValue: number;
    }>();

    for (const item of portfolioItems) {
      const cardName = item.card.name;
      const pokemonId = getPokemonIdFromCardName(cardName);

      if (pokemonId) {
        const existing = ownedPokemon.get(pokemonId);
        const cardValue = item.valuationOverride ?? item.card.prices[0]?.priceMarket ?? 0;
        const hasPSA10 = item.isGraded && item.gradeCompany === 'PSA' && item.gradeValue === 10;

        if (existing) {
          existing.cardCount += item.quantity;
          existing.marketValue += cardValue * item.quantity;
          if (item.isGraded) existing.hasGraded = true;
          if (hasPSA10) existing.hasPSA10 = true;
        } else {
          ownedPokemon.set(pokemonId, {
            pokemonId,
            name: getPokemonName(pokemonId),
            owned: true,
            cardCount: item.quantity,
            hasGraded: item.isGraded || false,
            hasPSA10: hasPSA10,
            marketValue: cardValue * item.quantity
          });
        }
      }
    }

    // Build response for all 1025 Pokemon
    const totalPokemon = 1025;
    const pokemonList = [];

    for (let i = 1; i <= totalPokemon; i++) {
      const owned = ownedPokemon.get(i);
      const generation = getGeneration(i);
      
      pokemonList.push({
        pokemonId: i,
        name: getPokemonName(i),
        generation,
        generationName: getGenerationName(generation),
        owned: !!owned,
        cardCount: owned?.cardCount || 0,
        hasGraded: owned?.hasGraded || false,
        hasPSA10: owned?.hasPSA10 || false,
        marketValue: owned?.marketValue || 0,
        imageUrl: getPokemonSpriteUrl(i)
      });
    }

    // Calculate stats
    const totalOwned = pokemonList.filter(p => p.owned).length;
    const totalCards = pokemonList.reduce((sum, p) => sum + p.cardCount, 0);
    const totalValue = pokemonList.reduce((sum, p) => sum + p.marketValue, 0);
    const masteredCount = pokemonList.filter(p => p.hasPSA10).length;

    // Group by generation
    const byGeneration = pokemonList.reduce((acc, p) => {
      if (!acc[p.generation]) {
        acc[p.generation] = {
          generation: p.generation,
          name: p.generationName,
          owned: 0,
          total: 0
        };
      }
      acc[p.generation].total++;
      if (p.owned) acc[p.generation].owned++;
      return acc;
    }, {} as Record<number, { generation: number; name: string; owned: number; total: number }>);

    res.json({
      overview: {
        totalOwned,
        totalPokemon,
        totalCards,
        totalValue,
        mastered: masteredCount,
        percentage: Math.round((totalOwned / totalPokemon) * 100)
      },
      byGeneration: Object.values(byGeneration),
      pokemon: pokemonList
    });
  } catch (error) {
    console.error('Error in pokedex overview:', error);
    next(error);
  }
});

// GET /api/pokedex/:pokemonId
// Returns Pokemon detail with all card variants
pokedexRouter.get('/:pokemonId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pokemonId } = req.params;
    const userId = (req as any).userId;
    const pokemonNum = parseInt(pokemonId);

    if (isNaN(pokemonNum) || pokemonNum < 1 || pokemonNum > 1025) {
      return res.status(400).json({ error: 'Invalid Pokemon ID' });
    }

    const pokemonName = getPokemonName(pokemonNum);
    const generation = getGeneration(pokemonNum);

    // Get all cards from database that match this Pokemon name
    const allCards = await prisma.card.findMany({
      where: {
        name: {
          contains: pokemonName,
          mode: 'insensitive'
        }
      },
      include: {
        prices: {
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      orderBy: { setName: 'asc' }
    });

    // Get user's portfolio items for these cards
    const portfolioItems = await prisma.portfolioItem.findMany({
      where: {
        portfolio: { userId },
        cardId: { in: allCards.map(c => c.id) }
      },
      include: {
        card: {
          include: {
            prices: {
              orderBy: { date: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    // Create a map of owned cards
    const ownedCardsMap = new Map<string, typeof portfolioItems[0]>();
    for (const item of portfolioItems) {
      ownedCardsMap.set(item.cardId, item);
    }

    // Build card variants list
    const cardVariants = allCards.map(card => {
      const owned = ownedCardsMap.get(card.id);
      const latestPrice = card.prices[0];
      
      return {
        id: card.id,
        name: card.name,
        setName: card.setName,
        setCode: card.setCode,
        cardNumber: card.cardNumber,
        rarity: card.rarity,
        imageUrl: card.imageUrl,
        owned: !!owned,
        ownedQuantity: owned?.quantity || 0,
        isGraded: owned?.isGraded || false,
        gradeCompany: owned?.gradeCompany || null,
        gradeValue: owned?.gradeValue || null,
        valuationOverride: owned?.valuationOverride || null,
        marketPrice: latestPrice?.priceMarket || null
      };
    });

    // Calculate stats
    const totalVariants = cardVariants.length;
    const ownedVariants = cardVariants.filter(c => c.owned).length;
    const totalMarketValue = cardVariants.reduce((sum, c) => {
      const value = c.valuationOverride ?? c.marketPrice ?? 0;
      return sum + (value * c.ownedQuantity);
    }, 0);
    const ownedMarketValue = cardVariants
      .filter(c => c.owned)
      .reduce((sum, c) => {
        const value = c.valuationOverride ?? c.marketPrice ?? 0;
        return sum + (value * c.ownedQuantity);
      }, 0);

    // Find most expensive card
    const mostExpensive = cardVariants
      .filter(c => c.marketPrice)
      .sort((a, b) => (b.marketPrice || 0) - (a.marketPrice || 0))[0];

    // Get most recently owned
    const ownedCards = cardVariants.filter(c => c.owned);
    const mostRecentlyOwned = ownedCards.length > 0 ? ownedCards[0] : null;

    // Distribution by energy type (approximate based on Pokemon type)
    const energyDistribution = {
      fire: cardVariants.filter(c => c.name.toLowerCase().includes('charizard') || c.name.toLowerCase().includes('vulpix')).length,
      water: cardVariants.filter(c => c.name.toLowerCase().includes('blastoise') || c.name.toLowerCase().includes('squirtle')).length,
      grass: cardVariants.filter(c => c.name.toLowerCase().includes('venusaur') || c.name.toLowerCase().includes('bulbasaur')).length,
      electric: cardVariants.filter(c => c.name.toLowerCase().includes('pikachu') || c.name.toLowerCase().includes('raichu')).length,
      other: cardVariants.length
    };

    // Distribution by rarity
    const rarityDistribution = {
      common: cardVariants.filter(c => c.rarity?.toLowerCase().includes('common')).length,
      uncommon: cardVariants.filter(c => c.rarity?.toLowerCase().includes('uncommon')).length,
      rare: cardVariants.filter(c => c.rarity && !c.rarity.toLowerCase().includes('common') && !c.rarity.toLowerCase().includes('uncommon')).length
    };

    res.json({
      pokemon: {
        pokemonId: pokemonNum,
        name: pokemonName,
        generation,
        generationName: getGenerationName(generation),
        spriteUrl: getPokemonSpriteUrl(pokemonNum)
      },
      stats: {
        totalVariants,
        ownedVariants,
        totalMarketValue,
        ownedMarketValue,
        mostExpensive: mostExpensive ? {
          name: mostExpensive.name,
          setName: mostExpensive.setName,
          price: mostExpensive.marketPrice
        } : null,
        mostRecentlyOwned: mostRecentlyOwned ? {
          name: mostRecentlyOwned.name,
          setName: mostRecentlyOwned.setName
        } : null
      },
      energyDistribution,
      rarityDistribution,
      cards: cardVariants
    });
  } catch (error) {
    console.error('Error in pokedex detail:', error);
    next(error);
  }
});

export default pokedexRouter;
