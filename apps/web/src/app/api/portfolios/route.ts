import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://ijnajdpcplapwiyvzsdh.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNiz43_04Dq4bL3C_ngUshOkvKQo';

export async function GET(request: NextRequest) {
  console.log('GET /api/portfolios called');
  try {
    console.log('Using hardcoded API_URL:', API_URL);
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let userId;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      userId = decoded.split(':')[0];
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const portfoliosResponse = await fetch(
      `${API_URL}/rest/v1/Portfolio?userid=eq.${userId}&order=createdat.desc`,
      {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );
    
    if (!portfoliosResponse.ok) {
      const errText = await portfoliosResponse.text();
      console.error('Error fetching portfolios:', errText);
      return NextResponse.json({ error: 'Failed to fetch portfolios' }, { status: 500 });
    }
    
    const portfolios = await portfoliosResponse.json();
    
    if (!portfolios || portfolios.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    
    // Add items to each portfolio using REST API
    const portfoliosWithItems = await Promise.all((portfolios || []).map(async (portfolio) => {
      const itemsResponse = await fetch(
        `${API_URL}/rest/v1/PortfolioCard?portfolioId=eq.${encodeURIComponent(portfolio.id)}`,
        {
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );
      let items = itemsResponse.ok ? await itemsResponse.json() : [];
      
      // Fetch card details for each item
      if (items && items.length > 0) {
        items = await Promise.all(items.map(async (item) => {
          const cardResponse = await fetch(
            `${API_URL}/rest/v1/Card?id=eq.${encodeURIComponent(item.cardId)}`,
            {
              headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${API_KEY}`
              }
            }
          );
          const cards = cardResponse.ok ? await cardResponse.json() : [];
          const cardData = cards && cards.length > 0 ? cards[0] : null;
          
          // Fetch price data for this card
          let prices: any[] = [];
          if (cardData?.id) {
            const priceResponse = await fetch(
              `${API_URL}/rest/v1/CardPrice?cardid=eq.${encodeURIComponent(cardData.id)}&order=date.desc&limit=1`,
              {
                headers: {
                  'apikey': API_KEY,
                  'Authorization': `Bearer ${API_KEY}`
                }
              }
            );
            prices = priceResponse.ok ? await priceResponse.json() : [];
          }
          
          // Map lowercase column names to camelCase for frontend compatibility
          const mappedCard = cardData ? {
            id: cardData.id,
            name: cardData.name,
            setName: cardData.setname,
            setCode: cardData.setcode,
            cardNumber: cardData.cardnumber,
            rarity: cardData.rarity,
            imageUrl: cardData.imageurl,
            currentPrice: cardData.currentprice,
            gameType: cardData.gametype,
            pokemonTcgId: cardData.pokemontcgid,
            createdAt: cardData.createdat,
            setId: cardData.setid,
            supertype: cardData.supertype,
            prices: prices.map(p => ({
              priceMarket: p.pricemarket,
              priceLow: p.pricelow,
              priceMid: p.pricemid,
              priceHigh: p.pricehigh,
              date: p.date,
              source: p.source
            }))
          } : null;
          return {
            ...item,
            card: mappedCard
          };
        }));
      }
      
      return {
        ...portfolio,
        items: items || []
      };
    }));
    
    return NextResponse.json(portfoliosWithItems, { status: 200 });
  } catch (err) {
    console.error('Portfolios GET error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/portfolios called');
  console.log('Using hardcoded API_URL:', API_URL);
  try {
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('Token received (first 50 chars):', token.substring(0, 50));
    let userId;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      console.log('Decoded token:', decoded);
      userId = decoded.split(':')[0];
      console.log('Extracted userId:', userId);
      if (!userId) throw new Error('Empty userId');
    } catch (e) {
      // Try JWT format
      try {
        const jwtParts = token.split('.');
        if (jwtParts.length === 3) {
          const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString());
          userId = payload.userId;
        }
      } catch (e) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token - no userId' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, description } = body;
    
    // Generate a unique ID
    const portfolioId = 'p-' + Buffer.from(userId + Date.now().toString()).toString('base64').substring(0, 20);
    
    // Use REST API since Supabase client insert seems to fail
    console.log('Creating portfolio with userId:', userId, 'API_URL:', API_URL, 'key length:', API_KEY?.length);
    const insertResponse = await fetch(`${API_URL}/rest/v1/Portfolio`, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: portfolioId,
        userid: userId,
        name: name || 'My Collection',
        description: description || null
      })
    });
    
    if (!insertResponse.ok) {
      const errText = await insertResponse.text();
      console.error('Error creating portfolio:', errText);
      return NextResponse.json({ error: 'Failed to create portfolio: ' + errText }, { status: 500 });
    }
    
    const portfolios = await insertResponse.json();
    const portfolio = Array.isArray(portfolios) ? portfolios[0] : portfolios;
    
    return NextResponse.json(portfolio);
  } catch (err) {
    console.error('Portfolios POST error:', err);
    return NextResponse.json({ error: 'Server error: ' + JSON.stringify(err) }, { status: 500 });
  }
}