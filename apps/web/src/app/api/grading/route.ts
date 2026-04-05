import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

const GRADING_COMPANIES = ['PSA', 'BGS', 'CGC', 'ACG'];

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // Handle calculation - works with both GET and POST
    if (action === 'calculate' || request.method === 'GET') {
      const cardValue = parseFloat(searchParams.get('cardValue') || (await request.clone().json()).cardValue || '0');
      const company = searchParams.get('company') || (await request.clone().json()).service || 'PSA';
      const tier = searchParams.get('tier') || (await request.clone().json()).tier || 'STANDARD';
      const expectedGrade = parseInt(searchParams.get('expectedGrade') || (await request.clone().json()).expectedGrade || '10');
      
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
    
    // Legacy endpoint: /api/grading/calculate (POST)
    if (request.method === 'POST') {
      const body = await request.json();
      
      if (body.cardValue || body.action === 'calculate') {
        const cardValue = parseFloat(body.cardValue || '0');
        const company = body.company || body.service || 'PSA';
        const tier = body.tier || 'STANDARD';
        const expectedGrade = parseInt(body.expectedGrade || '10');
        
        const pricing: Record<string, Record<string, number>> = {
          PSA: { ECONOMY: 40, STANDARD: 75, EXPRESS: 150 },
          BGS: { ECONOMY: 50, STANDARD: 100, EXPRESS: 200 },
          CGC: { ECONOMY: 45, STANDARD: 80, EXPRESS: 160 },
          SGC: { ECONOMY: 35, STANDARD: 65, EXPRESS: 130 }
        };
        
        const gradingCost = pricing[company?.toUpperCase()]?.[tier?.toUpperCase()] || 75;
        
        const gradeMultipliers: Record<number, number> = { 10: 3.0, 9: 2.0, 8: 1.5, 7: 1.2, 6: 1.0 };
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
    }
    
    // Get user's grading submissions
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    const { data, error } = await supabase.from('GradingSubmission').select('*').eq('userid', userId).order('submittedat', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in grading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}