import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';
import Tesseract from 'tesseract.js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ 
      message: 'Card scanning API - FREE OCR',
      info: 'POST an image URL or base64 to identify a card using free Tesseract OCR',
      usage: {
        method: 'POST',
        body: {
          imageUrl: 'https://example.com/card.jpg',
          imageBase64: 'data:image/jpeg;base64,...'
        }
      },
      features: [
        'Free OCR - no paid API required',
        'Works with Pokemon card images',
        'Searches database for matching cards'
      ]
    });
  } catch (error) {
    console.error('Error in scan GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const { imageUrl, imageBase64 } = body;
    
    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: 'imageUrl or imageBase64 required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    try {
      let imageContent = imageUrl;
      if (imageBase64) {
        imageContent = imageBase64;
      }
      
      console.log('Starting OCR scan...');
      
      const result = await Tesseract.recognize(imageContent, 'eng', {
        logger: m => console.log(m)
      });
      
      const extractedText = result.data.text;
      console.log('OCR extracted:', extractedText);
      
      if (!extractedText || extractedText.trim().length < 2) {
        return NextResponse.json({
          success: false,
          message: 'Could not extract text from image. Try a clearer photo.',
          suggestions: [
            'Use better lighting',
            'Ensure text is visible and not blurry',
            'Avoid glare or reflections'
          ]
        });
      }
      
      const cardSearchQuery = extractedText.split('\n')[0].trim();
      
      console.log('Searching for card:', cardSearchQuery);
      
      if (cardSearchQuery.length >= 2) {
        const { data: cards, error } = await supabase
          .from('Card')
          .select('id, name, setname, setcode, cardnumber, rarity, imageurl')
          .or(`name.ilike.%${cardSearchQuery}%,setname.ilike.%${cardSearchQuery}%,cardnumber.ilike.%${cardSearchQuery}%`)
          .limit(15);
        
        if (error) {
          console.error('Database search error:', error);
        }
        
        if (cards && cards.length > 0) {
          return NextResponse.json({
            success: true,
            extractedText,
            confidence: result.data.confidence,
            possibleCards: cards,
            message: `Found ${cards.length} possible matches for "${cardSearchQuery}"`
          });
        }
      }
      
      const { data: recentCards } = await supabase
        .from('Card')
        .select('id, name, setname, setcode, cardnumber, rarity, imageurl')
        .order('createdat', { ascending: false })
        .limit(20);
      
      return NextResponse.json({
        success: false,
        extractedText,
        message: `Could not find matching card for "${cardSearchQuery}". Try a different image or browse cards below.`,
        recentCards: recentCards || [],
        suggestions: [
          'Try with a clearer image',
          'Include the card name in the image',
          'Use a different angle'
        ]
      });
      
    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);
      
      const { data: recentCards } = await supabase
        .from('Card')
        .select('id, name, setname, setcode, cardnumber, rarity, imageurl')
        .order('createdat', { ascending: false })
        .limit(20);
      
      return NextResponse.json({
        success: false,
        message: 'Failed to process image. Try again with a clearer photo.',
        recentCards: recentCards || []
      });
    }
    
  } catch (error) {
    console.error('Error in scan POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}