import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/cards - List cards with pagination and filtering
// GET /api/cards/search - Search cards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = request.nextUrl.pathname;
    
    // Handle search endpoint
    if (path === '/api/cards/search') {
      return await handleSearch(request, searchParams);
    }
    
    // Handle main cards list
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const setCode = searchParams.get('setCode');
    const sort = searchParams.get('sort');

    const where: any = {};
    if (setCode) {
      where.setCode = setCode;
    }

    let cards: any[];
    let total: number;

    if (sort === 'price-desc' || sort === 'price-asc') {
      const priceOrder = sort === 'price-desc' ? 'DESC' : 'ASC';
      
      const sql = `
        SELECT c.*, cp."priceMarket" as "currentPrice"
        FROM "Card" c
        LEFT JOIN LATERAL (
          SELECT "priceMarket" 
          FROM "CardPrice" 
          WHERE "cardId" = c.id 
          ORDER BY "date" DESC 
          LIMIT 1
        ) cp ON true
        ${setCode ? `WHERE c."setCode" = ${`'${setCode}'`}` : ''}
        ORDER BY cp."priceMarket" ${priceOrder} NULLS LAST
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `;
      
      cards = await prisma.$queryRawUnsafe(sql);
      total = await prisma.card.count({ where });
    } else {
      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'oldest') {
        orderBy = { createdAt: 'asc' };
      } else if (sort === 'name') {
        orderBy = { name: 'asc' };
      }

      [cards, total] = await Promise.all([
        prisma.card.findMany({
          where,
          take: limit,
          skip: (page - 1) * limit,
          orderBy,
          include: {
            prices: {
              orderBy: { date: 'desc' },
              take: 1
            }
          }
        }),
        prisma.card.count({ where })
      ]);
    }

    const results = cards.map((card: any) => ({
      id: card.id,
      name: card.name,
      setName: card.setName,
      setCode: card.setCode,
      cardNumber: card.cardNumber,
      gameType: card.gameType,
      rarity: card.rarity,
      imageUrl: card.imageUrl,
      currentPrice: card.currentPrice ?? card.prices?.[0]?.priceMarket ?? null
    }));

    return NextResponse.json({ cards: results, total });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSearch(request: NextRequest, searchParams: URLSearchParams) {
  const searchQuery = searchParams.get('q') || '';
  const gameType = searchParams.get('gameType') || '';
  const setCode = searchParams.get('setCode') || '';
  const sort = searchParams.get('sort') || '';
  const limit = parseInt(searchParams.get('limit') || '50');

  let where: any = {};

  if (searchQuery && searchQuery.trim().length >= 2) {
    const searchTerm = searchQuery.trim();
    const searchTermLower = searchTerm.toLowerCase();
    
    // Check if this is likely a card number search (contains "/" or is purely numeric)
    const isCardNumberSearch = searchTerm.includes('/') || /^\d+$/.test(searchTerm);
    
    if (isCardNumberSearch) {
      // For card number searches, strip leading zeros from both the search term and database values
      const normalizedSearchTerm = searchTerm.replace(/^0+/, '');
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { setName: { contains: searchTerm, mode: 'insensitive' } },
        { setCode: { contains: searchTerm, mode: 'insensitive' } },
        { cardNumber: { contains: normalizedSearchTerm } }
      ];
    } else {
      // For text searches, search name as normal and also check card number just in case
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { setName: { contains: searchTerm, mode: 'insensitive' } },
        { setCode: { contains: searchTerm, mode: 'insensitive' } },
        { cardNumber: { contains: searchTerm } }
      ];
    }
  }

  if (gameType) {
    where.gameType = gameType;
  }

  if (setCode) {
    where.setCode = setCode;
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'oldest') {
    orderBy = { createdAt: 'asc' };
  } else if (sort === 'name') {
    orderBy = { name: 'asc' };
  }

  let cards: any[];
  let total: number;

  if (sort === 'price-desc' || sort === 'price-asc') {
    const priceOrder = sort === 'price-desc' ? 'DESC' : 'ASC';
    
    let searchCondition = '';
    const params: any[] = [];
    
    if (searchQuery && searchQuery.trim().length >= 2) {
      const q = searchQuery.trim();
      const isCardNumberSearch = q.includes('/') || /^\d+$/.test(q);
      
      if (isCardNumberSearch) {
        const normalizedQ = q.replace(/^0+/, '');
        searchCondition = `AND (c."name" ILIKE $1 OR c."setName" ILIKE $1 OR c."setCode" ILIKE $1 OR c."cardNumber" ILIKE $2)`;
        params.push(`%${q}%`);
        params.push(`%${normalizedQ}%`);
      } else {
        searchCondition = `AND (c."name" ILIKE $1 OR c."setName" ILIKE $1 OR c."setCode" ILIKE $1 OR c."cardNumber" ILIKE $2)`;
        params.push(`%${q}%`);
        params.push(`%${q}%`);
      }
    }
    
    if (gameType) {
      searchCondition += params.length > 0 ? ` AND c."gameType" = $${params.length + 1}` : ` AND c."gameType" = $1`;
      params.push(gameType);
    }
    
    if (setCode) {
      searchCondition += params.length > 0 ? ` AND c."setCode" = $${params.length + 1}` : ` AND c."setCode" = $1`;
      params.push(setCode);
    }

    const sql = `
      SELECT c.*, cp."priceMarket" as "currentPrice"
      FROM "Card" c
      LEFT JOIN LATERAL (
        SELECT "priceMarket" 
        FROM "CardPrice" 
        WHERE "cardId" = c.id 
        ORDER BY "date" DESC 
        LIMIT 1
      ) cp ON true
      WHERE 1=1 ${searchCondition}
      ORDER BY cp."priceMarket" ${priceOrder} NULLS LAST
      LIMIT ${limit} OFFSET 0
    `;
    
    cards = await prisma.$queryRawUnsafe(sql, ...params);
    
    const countSql = `
      SELECT COUNT(*) as count
      FROM "Card" c
      WHERE 1=1 ${searchCondition}
    `;
    const countResult = await prisma.$queryRawUnsafe(countSql, ...params) as [{ count: bigint }];
    total = Number(countResult[0].count);
  } else {
    const fetchLimit = Math.min(limit * 4, 200);

    [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        take: fetchLimit,
        orderBy,
        include: {
          prices: {
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      }),
      prisma.card.count({ where })
    ]);
  }

  let sortedResults = cards;
  if (searchQuery && searchQuery.trim().length >= 2 && sort !== 'price-desc' && sort !== 'price-asc') {
    const q = searchQuery.toLowerCase();
    sortedResults = cards.sort((a: any, b: any) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      const aExact = aName === q ? 1 : 0;
      const bExact = bName === q ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      
      const aStarts = aName.startsWith(q) ? 1 : 0;
      const bStarts = bName.startsWith(q) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;
      
      const aContains = aName.includes(q) ? 1 : 0;
      const bContains = bName.includes(q) ? 1 : 0;
      if (aContains !== bContains) return bContains - aContains;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  return NextResponse.json({
    results: sortedResults.slice(0, limit).map((card: any) => ({
      id: card.id,
      name: card.name,
      setName: card.setName,
      setCode: card.setCode,
      cardNumber: card.cardNumber,
      gameType: card.gameType,
      rarity: card.rarity,
      imageUrl: card.imageUrl,
      currentPrice: card.currentPrice ?? card.prices?.[0]?.priceMarket ?? null
    })),
    total
  });
}