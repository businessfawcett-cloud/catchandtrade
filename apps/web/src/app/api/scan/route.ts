import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ 
      message: 'Card scanning API',
      info: 'POST an image URL or base64 to identify a card',
      usage: {
        method: 'POST',
        body: {
          imageUrl: 'https://example.com/card.jpg',
          // or
          imageBase64: 'data:image/jpeg;base64,...'
        }
      }
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
    
    const googleVisionKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    
    let imageContent = imageUrl;
    if (imageBase64) {
      imageContent = imageBase64;
    }
    
    if (googleVisionKey && googleVisionKey !== 'REPLACE_WITH_KEY') {
      try {
        const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleVisionKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: imageBase64 ? { content: imageBase64.split(',')[1] } : { source: { imageUri: imageUrl } },
              features: [{ type: 'TEXT_DETECTION' }, { type: 'LABEL_DETECTION' }],
              imageContext: { languageHints: ['en'] }
            }]
          })
        });
        
        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          const textAnnotations = visionData.responses?.[0]?.textAnnotations || [];
          const labels = visionData.responses?.[0]?.labelAnnotations || [];
          
          const extractedText = textAnnotations[0]?.description || '';
          
          const cardSearchQuery = extractedText.split('\n')[0].trim();
          
          if (cardSearchQuery.length >= 2) {
            const { data: cards } = await supabase
              .from('Card')
              .select('id, name, setname, setcode, cardnumber, rarity, imageurl')
              .or(`name.ilike.%${cardSearchQuery}%,setname.ilike.%${cardSearchQuery}%`)
              .limit(10);
            
            return NextResponse.json({
              success: true,
              extractedText,
              labels: labels.slice(0, 5).map((l: any) => l.description),
              possibleCards: cards || [],
              message: cards?.length ? `Found ${cards.length} possible matches` : 'No matches found'
            });
          }
        }
      } catch (visionError) {
        console.error('Vision API error:', visionError);
      }
    }
    
    const { data: recentCards } = await supabase
      .from('Card')
      .select('id, name, setname, setcode, cardnumber, rarity, imageurl')
      .order('createdat', { ascending: false })
      .limit(20);
    
    return NextResponse.json({
      success: false,
      message: 'Card identification requires Google Cloud Vision API configuration',
      suggestion: 'Configure GOOGLE_CLOUD_VISION_API_KEY in environment variables',
      recentCards: recentCards || []
    });
  } catch (error) {
    console.error('Error in scan POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
