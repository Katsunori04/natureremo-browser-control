import { NextResponse } from 'next/server';
import { NatureRemoAPI } from '@/lib/nature-remo';

export async function GET() {
  try {
    const apiKey = process.env.NATURE_REMO_API_KEY;
    
    if (!apiKey) {
      console.error('NATURE_REMO_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('Fetching devices from Nature Remo API...');
    const api = new NatureRemoAPI(apiKey);
    const devices = await api.getDevices();
    
    console.log(`Successfully fetched ${devices.length} devices`);
    return NextResponse.json(devices);

  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
