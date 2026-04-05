import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

const GRADING_COMPANIES = ['PSA', 'BGS', 'CGC', 'ACG'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'calculate') {
      // Handle grading calculation (client-side calculator)
      const cardValue = parseFloat(searchParams.get('cardValue') || '0');
      const company = searchParams.get('company') || 'PSA';
      const tier = searchParams.get('tier') || 'STANDARD';
      const expectedGrade = parseInt(searchParams.get('expectedGrade') || '10');
      
      const pricing: Record<string, Record<string, number>> = {
        PSA: { ECONOMY: 40, STANDARD: 75, EXPRESS: 150, WALKTHROUGH: 250 },
        BGS: { ECONOMY: 50, STANDARD: 100, EXPRESS: 200, WALKTHROUGH: 350 },
        CGC: { ECONOMY: 45, STANDARD: 80, EXPRESS: 160, WALKTHROUGH: 275 },
        SGC: { ECONOMY: 35, STANDARD: 65, EXPRESS: 130, WALKTHROUGH: 220 }
      };
      
      const gradingCost = pricing[company]?.[tier.toUpperCase()] || 75;
      
      // Calculate potential ROI based on graded value lookup
      const gradeMultipliers: Record<number, number> = {
        10: 3.0,
        9: 2.0,
        8: 1.5,
        7: 1.2,
        6: 1.0
      };
      
      const multiplier = gradeMultipliers[expectedGrade] || 1;
      const potentialValue = cardValue * multiplier;
      const profit = potentialValue - gradingCost;
      const roi = ((profit / gradingCost) * 100);
      
      return NextResponse.json({
        gradingCost,
        potentialValue: Math.round(potentialValue),
        profit: Math.round(profit),
        roi: Math.round(roi),
        recommended: roi > 50
      });
    }
    
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    let query = supabase.from('GradingSubmission').select('*').eq('userid', userId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('submittedat', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in grading GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if it's a calculation request
    const body = await request.json();
    
    if (body.action === 'calculate' || body.cardValue) {
      // Handle grading calculation
      const cardValue = parseFloat(body.cardValue || '0');
      const company = body.company || body.service || 'PSA';
      const tier = body.tier || 'STANDARD';
      const expectedGrade = parseInt(body.expectedGrade || '10');
      
      const pricing: Record<string, Record<string, number>> = {
        PSA: { ECONOMY: 40, STANDARD: 75, EXPRESS: 150, WALKTHROUGH: 250 },
        BGS: { ECONOMY: 50, STANDARD: 100, EXPRESS: 200, WALKTHROUGH: 350 },
        CGC: { ECONOMY: 45, STANDARD: 80, EXPRESS: 160, WALKTHROUGH: 275 },
        SGC: { ECONOMY: 35, STANDARD: 65, EXPRESS: 130, WALKTHROUGH: 220 }
      };
      
      const gradingCost = pricing[company?.toUpperCase()]?.[tier?.toUpperCase()] || 75;
      
      const gradeMultipliers: Record<number, number> = {
        10: 3.0,
        9: 2.0,
        8: 1.5,
        7: 1.2,
        6: 1.0
      };
      
      const multiplier = gradeMultipliers[expectedGrade] || 1;
      const potentialValue = cardValue * multiplier;
      const profit = potentialValue - gradingCost;
      const roi = ((profit / gradingCost) * 100);
      
      return NextResponse.json({
        gradingCost,
        potentialValue: Math.round(potentialValue),
        profit: Math.round(profit),
        roi: Math.round(roi),
        recommended: roi > 50
      });
    }
    
    // Otherwise handle grading submission
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
    
    const { cardId, gradingCompany, serviceLevel, cardCondition } = body;
    
    if (!cardId || !gradingCompany) {
      return NextResponse.json({ error: 'cardId and gradingCompany required' }, { status: 400 });
    }
    
    if (!GRADING_COMPANIES.includes(gradingCompany.toUpperCase())) {
      return NextResponse.json({ error: `Invalid grading company. Must be one of: ${GRADING_COMPANIES.join(', ')}` }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('GradingSubmission')
      .insert({
        userid: userId,
        cardid: cardId,
        gradingcompany: gradingCompany.toUpperCase(),
        servicelevel: serviceLevel || 'STANDARD',
        cardcondition: cardCondition || 'NEAR_MINT',
        status: 'SUBMITTED',
        submittedat: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in grading POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}