import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@catchandtrade/db';
import Tesseract from 'tesseract.js';

export const scanRouter = Router();

// Lazy-initialized OCR worker
let workerPromise: Promise<Tesseract.Worker> | null = null;

function getWorker(): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = Tesseract.createWorker('eng').catch((err) => {
      workerPromise = null; // Reset so next call retries
      throw err;
    });
  }
  return workerPromise;
}

// Catch unhandled Tesseract worker errors that escape try/catch
process.on('uncaughtException', (err) => {
  if (err.message?.includes('read image') || err.message?.includes('truncated')) {
    console.error('[Scan] Caught Tesseract crash (non-fatal):', err.message);
    // Reset worker so it can be re-created
    workerPromise = null;
  } else {
    console.error('Uncaught exception:', err);
    process.exit(1);
  }
});

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('OCR timed out')), ms)),
  ]);
}

// ── OCR character substitution ──────────────────────────────────────────
// Tesseract commonly confuses these characters in small text / digits
const CHAR_SUBS: Record<string, string> = {
  'O': '0', 'o': '0',
  'I': '1', 'l': '1', '|': '1',
  'S': '5', 's': '5',
  'B': '8',
  'Z': '2', 'z': '2',
  'G': '6',
  'T': '7',
  'q': '9',
};

/**
 * Fix common OCR digit misreads: O→0, I→1, S→5, etc.
 * Only applies to strings that are *mostly* digits already.
 */
function fixDigits(raw: string): string {
  return raw.split('').map(ch => CHAR_SUBS[ch] ?? ch).join('');
}

// ── Card number extraction ──────────────────────────────────────────────

interface CardNumberInfo {
  number: string;       // e.g. "45"
  total: number | null; // e.g. 198
  raw: string;          // original OCR text matched
}

/**
 * Extract card number patterns (###/###) from OCR text.
 * Applies character substitution and returns multiple candidates.
 */
function extractCardNumbers(text: string): CardNumberInfo[] {
  const results: CardNumberInfo[] = [];

  // Match patterns like "045/198", "45 / 198", "O45/I98", etc.
  // Allow letters that commonly get confused with digits
  const pattern = /([0-9OoIlBSZGTq|]{1,4})\s*[\/\\]\s*([0-9OoIlBSZGTq|]{1,4})/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const rawLeft = match[1];
    const rawRight = match[2];

    const left = fixDigits(rawLeft);
    const right = fixDigits(rawRight);

    const leftNum = parseInt(left, 10);
    const rightNum = parseInt(right, 10);

    // Basic sanity checks
    if (isNaN(leftNum) || isNaN(rightNum)) continue;
    if (leftNum === 0) continue;         // card number can't be 0
    if (rightNum === 0) continue;         // total can't be 0
    if (rightNum > 500) continue;         // no set has 500+ cards (catches OCR noise)
    // Note: left CAN be > right (secret rares like 201/198)

    results.push({
      number: leftNum.toString(),
      total: rightNum,
      raw: match[0],
    });
  }

  return results;
}

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

/**
 * Given card number info, find the card by matching against sets with that totalCards count.
 */
async function findByCardNumber(cnInfo: CardNumberInfo): Promise<any | null> {
  const { number: cardNum, total } = cnInfo;

  // Normalize: try "45", "045", etc.
  const variants = new Set<string>();
  variants.add(cardNum);
  variants.add(cardNum.replace(/^0+/, '') || cardNum); // strip leading zeros
  if (cardNum.length < 3) variants.add(cardNum.padStart(3, '0'));
  if (cardNum.length < 2) variants.add(cardNum.padStart(2, '0'));

  // If we have a set total, use it to narrow down the set
  if (total) {
    const matchingSets = await prisma.pokemonSet.findMany({
      where: { totalCards: total },
      orderBy: { releaseYear: 'desc' },
    });

    console.log(`[Scan] Sets with totalCards=${total}:`, matchingSets.map(s => `${s.code} (${s.name})`));

    if (matchingSets.length > 0) {
      const setCodes = matchingSets.map(s => s.code);

      for (const num of variants) {
        const cards = await prisma.card.findMany({
          where: {
            cardNumber: num,
            setCode: { in: setCodes },
          },
          include: CARD_INCLUDE,
          take: 5,
        });
        if (cards.length > 0) {
          console.log(`[Scan] Found ${cards.length} cards: number=${num}, sets=${setCodes.join(',')}`);
          return cards;
        }
      }
    }
  }

  // Fallback: search by card number alone
  for (const num of variants) {
    const cards = await prisma.card.findMany({
      where: { cardNumber: num },
      include: CARD_INCLUDE,
      take: 10,
    });
    if (cards.length > 0) return cards;
  }

  return null;
}

/**
 * Search by candidate names using multiple strategies.
 */
async function findByName(candidateNames: string[]): Promise<any[]> {
  // Strategy 1: Full candidate name contains
  for (const name of candidateNames.slice(0, 5)) {
    const cards = await prisma.card.findMany({
      where: { name: { contains: name, mode: 'insensitive' } },
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
      },
      take: 10,
      include: CARD_INCLUDE,
    });
    if (cards.length > 0) return cards;
  }

  // Strategy 3: Individual word scoring
  const wordScores = new Map<string, { card: any; score: number }>();
  const allWords = new Set<string>();
  for (const name of candidateNames.slice(0, 5)) {
    for (const word of name.split(/\s+/)) {
      if (word.length >= 3 && !NOISE_WORDS.has(word.toLowerCase())) {
        allWords.add(word);
      }
    }
  }

  for (const word of Array.from(allWords).slice(0, 8)) {
    const cards = await prisma.card.findMany({
      where: { name: { contains: word, mode: 'insensitive' } },
      take: 5,
      include: CARD_INCLUDE,
    });
    for (const card of cards) {
      const existing = wordScores.get(card.id);
      if (existing) existing.score += 1;
      else wordScores.set(card.id, { card, score: 1 });
    }
  }

  if (wordScores.size > 0) {
    return Array.from(wordScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.card);
  }

  return [];
}

// ── Text-based match endpoint (on-device OCR) ──────────────────────────

scanRouter.post(
  '/match',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cardNumber, setTotal, setCode, name, rawText } = req.body;

      console.log('[Scan/match] Input:', { cardNumber, setTotal, setCode, name, rawText: rawText?.slice(0, 100) });

      let cards: any[] | null = null;

      // Priority 1: cardNumber + setCode (exact match)
      if (cardNumber && setCode) {
        const variants = new Set<string>();
        variants.add(cardNumber);
        variants.add(cardNumber.replace(/^0+/, '') || cardNumber);
        if (cardNumber.length < 3) variants.add(cardNumber.padStart(3, '0'));
        if (cardNumber.length < 2) variants.add(cardNumber.padStart(2, '0'));

        for (const num of variants) {
          const found = await prisma.card.findMany({
            where: { cardNumber: num, setCode: setCode },
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
        const variants = [cardNumber, cardNumber.replace(/^0+/, '') || cardNumber, cardNumber.padStart(3, '0')];
        for (const v of variants) {
          const found = await prisma.card.findMany({
            where: {
              cardNumber: v,
              name: { contains: name, mode: 'insensitive' },
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

      // Priority 3: cardNumber + setTotal
      if ((!cards || cards.length === 0) && cardNumber && setTotal) {
        const cnInfo: CardNumberInfo = { number: cardNumber, total: setTotal, raw: '' };
        cards = await findByCardNumber(cnInfo);
        if (cards && cards.length > 0) {
          console.log(`[Scan/match] Matched via cardNumber+setTotal: ${cardNumber}/${setTotal} → ${cards[0].name}`);
        }
      }

      // Priority 4: name alone
      if ((!cards || cards.length === 0) && name) {
        cards = await findByName([name]);
        if (cards && cards.length > 0) {
          console.log(`[Scan/match] Matched via name: "${name}" → ${cards[0].name}`);
        }
      }

      // Priority 5: rawText → extract candidate names
      if ((!cards || cards.length === 0) && rawText) {
        const candidates = extractCandidateNames(rawText);
        console.log('[Scan/match] Extracted candidates from rawText:', candidates.slice(0, 5));
        cards = await findByName(candidates);
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
          currentPrice,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── Legacy image-based endpoint ─────────────────────────────────────────

scanRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { imageBase64, topBase64, bottomBase64 } = req.body;

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'imageBase64 is required and must be a string' });
      }

      const worker = await getWorker();

      // Helper to OCR a base64 image
      const ocrImage = async (b64: string, label: string, ms: number): Promise<string> => {
        try {
          const buf = Buffer.from(b64, 'base64');
          // Validate it's actually an image (check for common magic bytes)
          if (buf.length < 8) {
            console.log(`[Scan] ${label}: buffer too small (${buf.length} bytes), skipping`);
            return '';
          }
          const result = await withTimeout(
            worker.recognize(buf),
            ms
          );
          const text = (result as Tesseract.RecognizeResult).data.text;
          console.log(`[Scan] ${label} OCR:`, JSON.stringify(text.slice(0, 300)));
          return text;
        } catch (e) {
          console.log(`[Scan] ${label} OCR failed:`, (e as Error).message);
          return '';
        }
      };

      // OCR all three crops: top (name), full, bottom (number)
      // Run full image first, then targeted crops
      const ocrText = await ocrImage(imageBase64, 'Full', 20000);

      let topText = '';
      if (topBase64 && typeof topBase64 === 'string') {
        topText = await ocrImage(topBase64, 'Top (name zone)', 10000);
      }

      let bottomText = '';
      if (bottomBase64 && typeof bottomBase64 === 'string') {
        bottomText = await ocrImage(bottomBase64, 'Bottom (number zone)', 10000);
      }

      // Combine all OCR text for card number extraction
      const allText = [ocrText, topText, bottomText].filter(Boolean).join('\n');

      // ── Step 1: Extract card numbers with character substitution ──
      const cardNumbers = extractCardNumbers(allText);
      console.log('[Scan] Card numbers found:', cardNumbers.map(cn => `${cn.number}/${cn.total} (raw: ${cn.raw})`));

      // ── Step 2: Try card number matching (highest confidence path) ──
      let cards: any[] | null = null;
      for (const cnInfo of cardNumbers) {
        cards = await findByCardNumber(cnInfo);
        if (cards && cards.length > 0) {
          console.log(`[Scan] Matched via card number ${cnInfo.number}/${cnInfo.total} → ${cards[0].name}`);
          break;
        }
      }

      // ── Step 3: Fall back to name matching ──
      // Prioritize the top crop for name extraction (biggest text on card)
      // then fall back to full image OCR text
      const topNames = topText ? extractCandidateNames(topText) : [];
      const fullNames = extractCandidateNames(ocrText);
      // Deduplicate: top crop names first, then full image names
      const seenNames = new Set<string>();
      const candidateNames: string[] = [];
      for (const name of [...topNames, ...fullNames]) {
        const key = name.toLowerCase();
        if (!seenNames.has(key)) {
          seenNames.add(key);
          candidateNames.push(name);
        }
      }
      console.log('[Scan] Name candidates (top+full):', candidateNames.slice(0, 8));

      if (!cards || cards.length === 0) {
        // Try card number + name combo before pure name search
        if (cardNumbers.length > 0 && candidateNames.length > 0) {
          const num = cardNumbers[0].number;
          const variants = [num, num.replace(/^0+/, '') || num, num.padStart(3, '0')];

          for (const v of variants) {
            for (const name of candidateNames.slice(0, 3)) {
              const found = await prisma.card.findMany({
                where: {
                  cardNumber: v,
                  name: { contains: name, mode: 'insensitive' },
                },
                take: 5,
                include: CARD_INCLUDE,
              });
              if (found.length > 0) {
                cards = found;
                console.log(`[Scan] Matched via number+name: ${v} + "${name}" → ${found[0].name}`);
                break;
              }
            }
            if (cards && cards.length > 0) break;
          }
        }

        if (!cards || cards.length === 0) {
          cards = await findByName(candidateNames);
        }
      }

      if (!cards || cards.length === 0) {
        return res.status(404).json({
          error: 'No matching card found',
          ocrText: ocrText.slice(0, 200),
          bottomOcr: bottomText.slice(0, 100),
          cardNumbers: cardNumbers.map(cn => `${cn.number}/${cn.total}`),
          candidates: candidateNames.slice(0, 5),
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
          currentPrice,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default scanRouter;
