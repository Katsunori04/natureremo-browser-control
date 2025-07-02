import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Light test API called');
    const body = await request.json();
    console.log('Request body:', body);
    
    return NextResponse.json({ 
      success: true, 
      received: body,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Light test API error:', error);
    return NextResponse.json(
      { 
        error: 'Test API error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Light test API is working',
    timestamp: new Date().toISOString()
  });
}
