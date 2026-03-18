const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../packages/api/src/routes');
const nextApiDir = path.join(__dirname, '../apps/web/src/app/api');

// Get all route directories
const routeDirs = fs.readdirSync(apiDir).filter(dir => {
  const fullPath = path.join(apiDir, dir);
  return fs.statSync(fullPath).isDirectory();
});

console.log('Found route directories:', routeDirs);

// Create basic Next.js API route structure for each
routeDirs.forEach(dir => {
  const routePath = path.join(nextApiDir, dir);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(routePath)) {
    fs.mkdirSync(routePath, { recursive: true });
    console.log(`Created directory: ${routePath}`);
  }
  
  // Create route.ts file
  const routeFile = path.join(routePath, 'route.ts');
  
  if (!fs.existsSync(routeFile)) {
    const content = `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@catchandtrade/db';

// ${dir} API routes
// Convert Express routes to Next.js App Router format
// TODO: Implement route handlers

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement GET handler for ${dir}
    return NextResponse.json({ message: '${dir} GET endpoint' });
  } catch (error) {
    console.error('Error in ${dir} GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement POST handler for ${dir}
    const body = await request.json();
    return NextResponse.json({ message: '${dir} POST endpoint', body });
  } catch (error) {
    console.error('Error in ${dir} POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // TODO: Implement PUT handler for ${dir}
    const body = await request.json();
    return NextResponse.json({ message: '${dir} PUT endpoint', body });
  } catch (error) {
    console.error('Error in ${dir} PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // TODO: Implement DELETE handler for ${dir}
    return NextResponse.json({ message: '${dir} DELETE endpoint' });
  } catch (error) {
    console.error('Error in ${dir} DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
`;
    
    fs.writeFileSync(routeFile, content);
    console.log(`Created route file: ${routeFile}`);
  }
});

// Handle special cases
// 1. Webhooks/stripe.ts needs a different path
const stripeSource = path.join(apiDir, 'webhooks/stripe.ts');
if (fs.existsSync(stripeSource)) {
  const stripeDestDir = path.join(nextApiDir, 'webhooks', 'stripe');
  if (!fs.existsSync(stripeDestDir)) {
    fs.mkdirSync(stripeDestDir, { recursive: true });
  }
  
  const stripeDestFile = path.join(stripeDestDir, 'route.ts');
  if (!fs.existsSync(stripeDestFile)) {
    const content = `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@catchandtrade/db';

// Stripe webhook handler
export async function POST(request: NextRequest) {
  try {
    // TODO: Implement Stripe webhook handler
    const body = await request.json();
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in Stripe webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
`;
    
    fs.writeFileSync(stripeDestFile, content);
    console.log(`Created Stripe webhook route: ${stripeDestFile}`);
  }
}

// 2. Dynamic routes that need [id] structure
const dynamicRoutes = ['cards', 'listings', 'portfolios', 'users'];
dynamicRoutes.forEach(route => {
  const routeDir = path.join(nextApiDir, route);
  const idDir = path.join(routeDir, '[id]');
  
  if (fs.existsSync(routeDir) && !fs.existsSync(idDir)) {
    fs.mkdirSync(idDir, { recursive: true });
    
    const idRouteFile = path.join(idDir, 'route.ts');
    const content = `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@catchandtrade/db';

// ${route}/[id] API routes
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    // TODO: Implement GET handler for ${route}/:id
    return NextResponse.json({ message: '${route}/:id GET endpoint', id });
  } catch (error) {
    console.error('Error in ${route}/:id GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    // TODO: Implement PUT handler for ${route}/:id
    return NextResponse.json({ message: '${route}/:id PUT endpoint', id, body });
  } catch (error) {
    console.error('Error in ${route}/:id PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    // TODO: Implement DELETE handler for ${route}/:id
    return NextResponse.json({ message: '${route}/:id DELETE endpoint', id });
  } catch (error) {
    console.error('Error in ${route}/:id DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
`;
    
    fs.writeFileSync(idRouteFile, content);
    console.log(`Created dynamic route: ${idRouteFile}`);
  }
});

console.log('\n✅ API route generation complete!');
console.log('\nNext steps:');
console.log('1. Review each generated route file');
console.log('2. Read the corresponding Express route file');
console.log('3. Implement the actual logic for each endpoint');
console.log('4. Test each endpoint');