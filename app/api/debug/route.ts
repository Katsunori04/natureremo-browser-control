import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NATURE_REMO_API_KEY;
  
  return NextResponse.json({
    hasApiKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPrefix: apiKey?.substring(0, 10) + '...',
  });
}
