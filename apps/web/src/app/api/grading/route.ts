import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint - if this works, the route is working
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'OK', 
    message: 'Grading API is working!',
    endpoint: '/api/grading',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    status: 'OK', 
    message: 'Grading API is working!',
    endpoint: '/api/grading',
    timestamp: new Date().toISOString()
  });
}