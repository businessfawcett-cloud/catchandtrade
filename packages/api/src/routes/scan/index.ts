import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@catchandtrade/db';
import Tesseract from 'tesseract.js';

export const scanRouter = Router();

// Lazy-initialized OCR worker
let workerPromise: Promise<Tesseract.Worker> | null = null;

function getWorker(): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = Tesseract.createWorker('eng');
  }
  return workerPromise;
}

/**
 * Parse OCR text to extract card name and optional card number (format "123/456").
 */
function parseOcrText(text: string): { name: string | null; cardNumber: string | null } {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Look for a card number pattern like "123/456"
  let cardNumber: string | null = null;
  const numberMatch = text.match(/(\d{1,4})\s*\/\s*\d{1,4}/);
  if (numberMatch) {
    cardNumber = numberMatch[1];
  }

  // The card name is typically the most prominent text; use the first non-empty line
  // that isn't purely numeric or a card number pattern.
  let name: string | null = null;
  for (const line of lines) {
    // Skip lines that are just numbers or card-number patterns
    if (/^\d+\s*\/\s*\d+$/.test(line)) continue;
    if (/^\d+$/.test(line)) continue;
    // Clean up the line: remove stray special characters from OCR noise
    const cleaned = line.replace(/[^a-zA-Z0-9\s\-':.]/g, '').trim();
    if (cleaned.length >= 2) {
      name = cleaned;
      break;
    }
  }

  return { name, cardNumber };
}

scanRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'imageBase64 is required and must be a string' });
      }

      // Run OCR with a 15-second timeout
      const worker = await getWorker();

      const ocrPromise = worker.recognize(
        Buffer.from(imageBase64, 'base64')
      );

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OCR timed out after 15 seconds')), 15000)
      );

      const result = await Promise.race([ocrPromise, timeoutPromise]);
      const ocrText = (result as Tesseract.RecognizeResult).data.text;

      const { name, cardNumber } = parseOcrText(ocrText);

      if (!name && !cardNumber) {
        return res.status(404).json({ error: 'Could not identify card text from image' });
      }

      // Search for matching cards
      let cards: any[] = [];

      // If we have a card number, try an exact card-number match (potentially combined with name)
      if (cardNumber) {
        const where: any = { cardNumber };
        if (name) {
          where.name = { contains: name, mode: 'insensitive' };
        }
        cards = await prisma.card.findMany({
          where,
          take: 10,
          include: {
            prices: {
              orderBy: { date: 'desc' as const },
              take: 1,
            },
          },
        });
      }

      // If no results from card number search, fall back to name-only fuzzy search
      if (cards.length === 0 && name) {
        cards = await prisma.card.findMany({
          where: {
            name: { contains: name, mode: 'insensitive' },
          },
          take: 10,
          include: {
            prices: {
              orderBy: { date: 'desc' as const },
              take: 1,
            },
          },
        });
      }

      if (cards.length === 0) {
        return res.status(404).json({ error: 'No matching card found' });
      }

      // Pick the best match: prefer exact card number match
      let bestMatch = cards[0];
      if (cardNumber) {
        const exactNumberMatch = cards.find((c: any) => c.cardNumber === cardNumber);
        if (exactNumberMatch) {
          bestMatch = exactNumberMatch;
        }
      }

      // Fetch set name from PokemonSet if available
      let setName: string | null = null;
      if (bestMatch.setCode) {
        const set = await prisma.pokemonSet.findUnique({
          where: { code: bestMatch.setCode },
        });
        if (set) {
          setName = set.name;
        }
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
