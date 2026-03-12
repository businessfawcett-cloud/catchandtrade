import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@catchandtrade/db';

export const scanRouter = Router();

// ── Name extraction ─────────────────────────────────────────────────────

const NOISE_WORDS = new Set([
  'pokemon', 'tcg', 'hp', 'stage', 'basic', 'weakness', 'resistance',
  'retreat', 'cost', 'damage', 'energy', 'trainer', 'supporter', 'item',
  'ability', 'rule', 'does', 'not', 'apply', 'the', 'this', 'your',
  'each', 'one', 'and', 'for', 'from', 'with', 'that', 'its', 'you',
  'may', 'put', 'into', 'all', 'any', 'has', 'have', 'been', 'are',
  'was', 'can', 'will', 'also', 'more', 'than', 'when', 'then',
  'flip', 'coin', 'heads', 'tails', 'draw', 'card', 'cards', 'deck',
  'hand', 'discard', 'pile', 'bench', 'active', 'attack', 'turn',
  'opponent', 'defending', 'evolves', 'evolved', 'place', 'attach',
  'attached', 'between', 'turns', 'once', 'during', 'before', 'after',
  'end', 'next', 'take', 'choose', 'switch', 'search', 'shuffle',
  'remaining', 'total', 'type', 'types', 'colorless', 'fire', 'water',
  'grass', 'lightning', 'psychic', 'fighting', 'darkness', 'metal',
  'fairy', 'dragon', 'normal',
  'illus', 'illustrator', 'rarity', 'common', 'uncommon', 'rare',
  'holo', 'ultra', 'secret', 'promo', 'special', 'illustration',
]);

function extractCandidateNames(text: string): string[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const candidateNames: string[] = [];

  for (const line of lines) {
    if (/^\d+\s*[\/\\]\s*\d+$/.test(line)) continue;
    if (/^\d+$/.test(line)) continue;
    if (line.length < 3) continue;
    if (/^\d+\s*HP$/i.test(line)) continue;
    if (/^\d+[x×+]?$/.test(line)) continue;

    const alphaRatio = (line.match(/[a-zA-Z]/g) || []).length / line.length;
    if (alphaRatio < 0.4) continue;

    let cleaned = line.replace(/[^a-zA-Z0-9\s\-'é]/g, '').trim();
    cleaned = cleaned.replace(/^\d+\s*/, '');

    if (cleaned.length >= 2) candidateNames.push(cleaned);
  }

  // Generate shorter sub-candidates
  const shortCandidates: string[] = [];
  for (const name of candidateNames) {
    const words = name.split(/\s+/);
    if (words.length > 2) {
      shortCandidates.push(words.slice(0, 2).join(' '));
      shortCandidates.push(words.slice(0, 3).join(' '));
    }
    if (words.length > 1) shortCandidates.push(words[0]);
  }

  // Deduplicate and filter
  const seen = new Set<string>();
  const ranked: string[] = [];
  for (const name of [...candidateNames, ...shortCandidates]) {
    const lower = name.toLowerCase();
    if (!seen.has(lower) && lower.length >= 2) {
      const words = lower.split(/\s+/);
      if (words.some(w => !NOISE_WORDS.has(w))) {
        seen.add(lower);
        ranked.push(name);
      }
    }
  }

  return ranked.slice(0, 15);
}

// ── Card search ─────────────────────────────────────────────────────────

const CARD_INCLUDE = {
  prices: { orderBy: { date: 'desc' as const }, take: 1 },
};

// Include set info for disambiguation scoring
const CARD_INCLUDE_WITH_SET = {
  prices: { orderBy: { date: 'desc' as const }, take: 1 },
  set: { select: { releaseYear: true } },
};

/**
 * Generate card number variants for matching (e.g., "45", "045", "0045")
 */
function cardNumberVariants(cardNumber: string): string[] {
  const variants = [cardNumber, cardNumber.replace(/^0+/, '') || cardNumber];
  if (cardNumber.length < 3) variants.push(cardNumber.padStart(3, '0'));
  if (cardNumber.length < 2) variants.push(cardNumber.padStart(2, '0'));
  return Array.from(new Set(variants));
}

/**
 * Language filter helper — returns empty object if no language specified.
 */
function languageWhere(language?: string) {
  return language ? { language } : {};
}

/**
 * Search by candidate names using multiple strategies.
 */
async function findByName(candidateNames: string[], language?: string): Promise<any[]> {
  // Strategy 1: Full candidate name contains
  for (const name of candidateNames.slice(0, 5)) {
    const cards = await prisma.card.findMany({
      where: { name: { contains: name, mode: 'insensitive' }, ...languageWhere(language) },
      take: 10,
      include: CARD_INCLUDE,
    });
    if (cards.length > 0) return cards;
  }

  // Strategy 2: All significant words must match
  for (const name of candidateNames.slice(0, 5)) {
    const words = name.split(/\s+/).filter(w => w.length >= 3 && !NOISE_WORDS.has(w.toLowerCase()));
    if (words.length === 0) continue;

    const cards = await prisma.card.findMany({
      where: {
        AND: words.map(word => ({
          name: { contains: word, mode: 'insensitive' as const },
        })),
        ...languageWhere(language),
      },
      take: 10,
      include: CARD_INCLUDE,
    });
    if (cards.length > 0) return cards;
  }

  // Strategy 3: Single OR query for all words, then score in memory
  const allWords: string[] = [];
  for (const name of candidateNames.slice(0, 5)) {
    for (const word of name.split(/\s+/)) {
      if (word.length >= 3 && !NOISE_WORDS.has(word.toLowerCase())) {
        allWords.push(word);
      }
    }
  }
  const uniqueWords = Array.from(new Set(allWords)).slice(0, 8);

  if (uniqueWords.length > 0) {
    const cards = await prisma.card.findMany({
      where: {
        OR: uniqueWords.map(word => ({
          name: { contains: word, mode: 'insensitive' as const },
        })),
        ...languageWhere(language),
      },
      take: 20,
      include: CARD_INCLUDE,
    });

    if (cards.length > 0) {
      const scored = cards.map(card => {
        const nameLower = card.name.toLowerCase();
        const matchCount = uniqueWords.filter(w => nameLower.includes(w.toLowerCase())).length;
        return { card, score: matchCount };
      });
      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(s => s.card);
    }
  }

  return [];
}

/**
 * Score cards against rawText for disambiguation.
 * Uses word-level partial matching + recency boost.
 */
function disambiguateByRawText(cards: any[], rawText: string): any[] {
  const rawLower = rawText.toLowerCase();
  const scored = cards.map((card: any) => {
    const nameLower = card.name.toLowerCase();
    // Split on spaces AND hyphens so "Thundurus-EX" → ["thundurus", "ex"]
    const nameWords = nameLower.split(/[\s\-]+/);

    let score = 0;
    // Full name match (also try hyphen→space variant)
    if (rawLower.includes(nameLower) || rawLower.includes(nameLower.replace(/-/g, ' '))) score += 10;
    // Partial: count how many name words appear in raw text
    score += nameWords.filter(w => w.length > 2 && rawLower.includes(w)).length * 3;
    // Boost newer sets (more likely to be scanned)
    const releaseYear = card.set?.releaseYear;
    if (releaseYear && releaseYear >= 2020) score += 1;

    return { card, score };
  });

  scored.sort((a: any, b: any) => b.score - a.score);
  console.log(`[Scan/match] Disambiguation scores:`, scored.map((s: any) => `${s.card.name}=${s.score}`));

  if (scored[0].score > 0) {
    return scored.map((s: any) => s.card);
  }
  return cards;
}

// ── Text-based match endpoint (on-device OCR) ──────────────────────────

scanRouter.post(
  '/match',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cardNumber, setTotal, setCode, name, rawText, language } = req.body;

      console.log('[Scan/match] Input:', { cardNumber, setTotal, setCode, name, language, rawText: rawText?.slice(0, 100) });

      let cards: any[] | null = null;

      // Priority 1: cardNumber + setCode (exact match)
      if (cardNumber && setCode) {
        for (const num of cardNumberVariants(cardNumber)) {
          const found = await prisma.card.findMany({
            where: { cardNumber: num, setCode: setCode, ...languageWhere(language) },
            include: CARD_INCLUDE,
            take: 5,
          });
          if (found.length > 0) {
            cards = found;
            console.log(`[Scan/match] Matched via cardNumber+setCode: ${num} + ${setCode} → ${found[0].name}`);
            break;
          }
        }
      }

      // Priority 2: cardNumber + name
      if ((!cards || cards.length === 0) && cardNumber && name) {
        for (const v of cardNumberVariants(cardNumber)) {
          const found = await prisma.card.findMany({
            where: {
              cardNumber: v,
              name: { contains: name, mode: 'insensitive' },
              ...languageWhere(language),
            },
            take: 5,
            include: CARD_INCLUDE,
          });
          if (found.length > 0) {
            cards = found;
            console.log(`[Scan/match] Matched via cardNumber+name: ${v} + "${name}" → ${found[0].name}`);
            break;
          }
        }
      }

      // Priority 3: cardNumber + setTotal (using printedTotal for exact match)
      if ((!cards || cards.length === 0) && cardNumber && setTotal) {
        const isSecretRare = parseInt(cardNumber, 10) > setTotal;

        if (isSecretRare) {
          // Secret rares (e.g., 201/198): use printedTotal to find the right set
          // The set's printedTotal should equal the denominator (198 for "201/198")
          let secretSets = await prisma.pokemonSet.findMany({
            where: { printedTotal: setTotal, ...languageWhere(language) },
            orderBy: { releaseYear: 'desc' },
          });
          // Fallback: sets where totalCards >= cardNumber (set must contain this card)
          if (secretSets.length === 0) {
            secretSets = await prisma.pokemonSet.findMany({
              where: { totalCards: { gte: parseInt(cardNumber, 10) }, ...languageWhere(language) },
              orderBy: { releaseYear: 'desc' },
              take: 10,
            });
          }
          const secretSetCodes = secretSets.map((s: any) => s.code);
          console.log(`[Scan/match] Secret rare: sets with printedTotal=${setTotal}:`, secretSets.map((s: any) => `${s.code} (${s.name})`));

          for (const num of cardNumberVariants(cardNumber)) {
            const where: any = { cardNumber: num, ...languageWhere(language) };
            if (secretSetCodes.length > 0) where.setCode = { in: secretSetCodes };
            const found = await prisma.card.findMany({
              where,
              include: CARD_INCLUDE_WITH_SET,
              take: 20,
            });
            if (found.length > 0) {
              cards = found;
              console.log(`[Scan/match] Secret rare: found ${found.length} cards for #${num}: ${found.map((c: any) => `${c.name} (${c.setCode})`).join(', ')}`);
              break;
            }
          }
        } else {
          // Normal cards: match via printedTotal
          let matchingSets = await prisma.pokemonSet.findMany({
            where: { printedTotal: setTotal, ...languageWhere(language) },
            orderBy: { releaseYear: 'desc' },
          });
          // Fallback to narrow range on totalCards
          if (matchingSets.length === 0) {
            matchingSets = await prisma.pokemonSet.findMany({
              where: { totalCards: { gte: setTotal, lte: setTotal + 10 }, ...languageWhere(language) },
              orderBy: { releaseYear: 'desc' },
            });
          }
          console.log(`[Scan/match] Sets matching total=${setTotal}:`, matchingSets.map((s: any) => `${s.code} (${s.name}, printed=${s.printedTotal}, total=${s.totalCards})`));

          if (matchingSets.length > 0) {
            const setCodes = matchingSets.map((s: any) => s.code);

            for (const num of cardNumberVariants(cardNumber)) {
              const found = await prisma.card.findMany({
                where: { cardNumber: num, setCode: { in: setCodes } },
                include: CARD_INCLUDE_WITH_SET,
                take: 20,
              });
              if (found.length > 0) {
                cards = found;
                console.log(`[Scan/match] Found ${found.length} cards for #${num} across ${setCodes.length} sets: ${found.map((c: any) => `${c.name} (${c.setCode})`).join(', ')}`);
                break;
              }
            }
          }
        }

        // Disambiguate using rawText if multiple cards found
        if (cards && cards.length > 1 && rawText) {
          cards = disambiguateByRawText(cards, rawText);
        }

        if (cards && cards.length > 0) {
          console.log(`[Scan/match] Matched via cardNumber+setTotal: ${cardNumber}/${setTotal} → ${cards[0].name}`);
        }
      }

      // Priority 4: name alone
      if ((!cards || cards.length === 0) && name) {
        cards = await findByName([name], language);
        if (cards && cards.length > 0) {
          console.log(`[Scan/match] Matched via name: "${name}" → ${cards[0].name}`);
        }
      }

      // Priority 5: rawText → extract candidate names
      if ((!cards || cards.length === 0) && rawText) {
        const candidates = extractCandidateNames(rawText);
        console.log('[Scan/match] Extracted candidates from rawText:', candidates.slice(0, 5));
        cards = await findByName(candidates, language);
        if (cards && cards.length > 0) {
          console.log(`[Scan/match] Matched via rawText candidates → ${cards[0].name}`);
        }
      }

      if (!cards || cards.length === 0) {
        return res.status(404).json({
          error: 'No matching card found',
          candidates: name ? [name] : [],
        });
      }

      const bestMatch = cards[0];

      let setName: string | null = null;
      if (bestMatch.setCode) {
        const set = await prisma.pokemonSet.findUnique({
          where: { code: bestMatch.setCode },
        });
        if (set) setName = set.name;
      }

      const currentPrice = bestMatch.prices?.[0]?.priceMarket ?? null;

      return res.json({
        card: {
          id: bestMatch.id,
          name: bestMatch.name,
          setName,
          setCode: bestMatch.setCode,
          cardNumber: bestMatch.cardNumber,
          rarity: bestMatch.rarity,
          imageUrl: bestMatch.imageUrl,
          language: bestMatch.language,
          currentPrice,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default scanRouter;
