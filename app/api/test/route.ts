import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Simple test API called');
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env_key_exists: !!process.env.NATURE_REMO_API_KEY,
      env_key_length: process.env.NATURE_REMO_API_KEY?.length || 0
    });
  } catch (error) {
    console.error('Simple test API error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
