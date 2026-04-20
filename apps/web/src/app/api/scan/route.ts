import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Tesseract from 'tesseract.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    message: 'Card scanning API - FREE OCR',
    usage: { method: 'POST', body: { imageUrl: 'https://example.com/card.jpg' } },
  });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { imageUrl, imageBase64 } = await request.json();
    if (!imageUrl && !imageBase64) return NextResponse.json({ error: 'imageUrl or imageBase64 required' }, { status: 400 });

    try {
      const result = await Tesseract.recognize(imageBase64 || imageUrl, 'eng');
      const extractedText = result.data.text;

      if (!extractedText?.trim()) {
        return NextResponse.json({ success: false, message: 'Could not extract text from image.' });
      }

      const query = extractedText.split('\n')[0].trim();

      if (query.length >= 2) {
        const cards = await prisma.card.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { setName: { contains: query, mode: 'insensitive' } },
              { cardNumber: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, name: true, setName: true, setCode: true, cardNumber: true, rarity: true, imageUrl: true },
          take: 15,
        });

        if (cards.length > 0) {
          return NextResponse.json({ success: true, extractedText, possibleCards: cards });
        }
      }

      const recentCards = await prisma.card.findMany({
        select: { id: true, name: true, setName: true, setCode: true, cardNumber: true, rarity: true, imageUrl: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return NextResponse.json({ success: false, extractedText, message: 'No match found.', recentCards });
    } catch (ocrError) {
      console.error('OCR error:', ocrError);
      return NextResponse.json({ success: false, message: 'Failed to process image.' });
    }
  } catch (error) {
    console.error('Error in scan POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
