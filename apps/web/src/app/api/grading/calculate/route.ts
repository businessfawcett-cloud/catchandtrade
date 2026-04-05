import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cardValue = parseFloat(searchParams.get('cardValue') || '0');
  const company = searchParams.get('company') || 'PSA';
  const tier = searchParams.get('tier') || 'STANDARD';
  const expectedGrade = parseInt(searchParams.get('expectedGrade') || '10');
  
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}