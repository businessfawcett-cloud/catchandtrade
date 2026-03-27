import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijnajdpcplapwiyvzsdh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_npPQJSJtOVSfpAhN-MjjZg_6d5YbZkC';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
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
    
    const { data: portfolios, error } = await supabase
      .from('Portfolio')
      .select('*')
      .eq('userid', userId)
      .order('createdat', { ascending: false });
    
    if (error) {
      console.error('Error fetching portfolios:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!portfolios || portfolios.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    
    // Add items to each portfolio using REST API
    const portfoliosWithItems = await Promise.all((portfolios || []).map(async (portfolio) => {
      const itemsResponse = await fetch(
        `${supabaseUrl}/rest/v1/PortfolioCard?portfolioId=eq.${encodeURIComponent(portfolio.id)}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );
      let items = itemsResponse.ok ? await itemsResponse.json() : [];
      
      // Fetch card details for each item
      if (items && items.length > 0) {
        items = await Promise.all(items.map(async (item) => {
          const cardResponse = await fetch(
            `${supabaseUrl}/rest/v1/Card?id=eq.${encodeURIComponent(item.cardId)}`,
            {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
              }
            }
          );
          const cards = cardResponse.ok ? await cardResponse.json() : [];
          const cardData = cards && cards.length > 0 ? cards[0] : null;
          
          // Fetch price data for this card
          let prices: any[] = [];
          if (cardData?.id) {
            const priceResponse = await fetch(
              `${supabaseUrl}/rest/v1/CardPrice?cardid=eq.${encodeURIComponent(cardData.id)}&order=date.desc&limit=1`,
              {
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`
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
  try {
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
    
    const body = await request.json();
    const { name, description, isDefault } = body;
    
    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('Portfolio')
        .update({ isdefault: false })
        .eq('userid', userId);
    }
    
    // Generate a unique ID
    const portfolioId = 'p-' + Buffer.from(userId + Date.now().toString()).toString('base64').substring(0, 20);
    
    // Use REST API since Supabase client insert seems to fail
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/Portfolio`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: portfolioId,
        userid: userId,
        name: name || 'My Collection',
        description: description || null,
        ispublic: isDefault || false
      })
    });
    
    if (!insertResponse.ok) {
      const errText = await insertResponse.text();
      console.error('Error creating portfolio:', errText);
      return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 });
    }
    
    const portfolios = await insertResponse.json();
    const portfolio = Array.isArray(portfolios) ? portfolios[0] : portfolios;
    
    return NextResponse.json({ portfolio });
  } catch (err) {
    console.error('Portfolios POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}