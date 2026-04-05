import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return handleGrading(request);
}

export async function POST(request: NextRequest) {
  return handleGrading(request);
}

async function handleGrading(request: NextRequest) {
  // Get params from query string or body
  const { searchParams } = new URL(request.url);
  let cardValue = 0;
  let company = 'PSA';
  let tier = 'STANDARD';
  let expectedGrade = 10;
  
  // Try query params first
  const qCardValue = searchParams.get('cardValue');
  if (qCardValue) {
    cardValue = parseFloat(qCardValue);
    company = searchParams.get('company') || 'PSA';
    tier = searchParams.get('tier') || 'STANDARD';
    expectedGrade = parseInt(searchParams.get('expectedGrade') || '10');
  } else {
    // Try body
    try {
      const body = await request.json();
      cardValue = parseFloat(body.cardValue || '0');
      company = body.company || body.service || 'PSA';
      tier = body.tier || 'STANDARD';
      expectedGrade = parseInt(body.expectedGrade || '10');
    } catch (e) {
      console.log('No valid body, using defaults');
    }
  }
  
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
  const roi = cardValue > 0 ? ((profit / gradingCost) * 100) : 0;
  
  return NextResponse.json({
    gradingCost,
    potentialValue: Math.round(potentialValue),
    profit: Math.round(profit),
    roi: Math.round(roi),
    recommended: roi > 50
  });
}