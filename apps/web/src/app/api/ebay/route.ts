import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const EBAY_API_BASE = process.env.EBAY_BROWSE_API_BASE || 'https://api.ebay.com/buy/browse/v1';
const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CERT_ID = process.env.EBAY_CERT_ID;

async function getEbayToken(): Promise<string | null> {
  if (!EBAY_APP_ID || !EBAY_CERT_ID) return null;
  try {
    const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope/buy.marketplace',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const cardId = searchParams.get('cardId');

    if (!query && !cardId) {
      return NextResponse.json({ error: 'q or cardId required' }, { status: 400 });
    }

    let searchQuery = query;

    if (cardId && !searchQuery) {
      const card = await prisma.card.findUnique({
        where: { id: cardId },
        select: { name: true, setName: true },
      });
      if (card) searchQuery = `${card.name} ${card.setName} Pokemon card`;
    }

    if (!EBAY_APP_ID || EBAY_APP_ID === 'REPLACE_WITH_EBAY_KEY') {
      return NextResponse.json({ message: 'eBay API not configured', searchQuery });
    }

    const accessToken = await getEbayToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to authenticate with eBay' }, { status: 500 });
    }

    const res = await fetch(`${EBAY_API_BASE}/search?q=${encodeURIComponent(searchQuery!)}&limit=20`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'eBay search failed' }, { status: 500 });
    }

    const data = await res.json();
    const items = (data.itemSummaries || []).map((item: any) => ({
      title: item.title,
      price: item.price?.value,
      currency: item.price?.currency,
      image: item.image?.imageUrl,
      itemId: item.itemId,
      condition: item.condition,
      url: item.itemWebUrl,
    }));

    return NextResponse.json({ items, searchQuery });
  } catch (error) {
    console.error('Error in ebay GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId, ebayItemId, price } = await request.json();
    if (!listingId || !ebayItemId) {
      return NextResponse.json({ error: 'listingId and ebayItemId required' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    // ebayItemId / listedOnEbay are not in schema yet — update price if provided
    const updateData: any = {};
    if (price) updateData.buyNowPrice = parseFloat(price);

    if (Object.keys(updateData).length) {
      await prisma.listing.update({ where: { id: listingId }, data: updateData });
    }

    return NextResponse.json({ success: true, ebayItemId });
  } catch (error) {
    console.error('Error in ebay POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
