import { NextRequest, NextResponse } from 'next/server';
import { NatureRemoAPI } from '@/lib/nature-remo';
import { AirConSettings } from '@/types/nature-remo';

if (!process.env.NATURE_REMO_API_KEY) {
  console.error('NATURE_REMO_API_KEY is not set in environment variables');
}

const api = new NatureRemoAPI(process.env.NATURE_REMO_API_KEY || '');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  try {
    if (!process.env.NATURE_REMO_API_KEY) {
      return NextResponse.json(
        { error: 'NATURE_REMO_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const resolvedParams = await params;
    const slug = resolvedParams.slug || [];
    console.log('API route called with slug:', slug);
    
    if (slug.length === 0 || slug[0] === 'appliances') {
      console.log('Fetching appliances from Nature Remo API...');
      const appliances = await api.getAppliances();
      console.log('Successfully fetched appliances:', appliances.length);
      return NextResponse.json(appliances);
    }
    
    if (slug[0] === 'devices') {
      console.log('Fetching devices from Nature Remo API...');
      const devices = await api.getDevices();
      console.log('Successfully fetched devices:', devices.length);
      return NextResponse.json(devices);
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Nature Remo API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug || [];
    
    // Support both JSON and form-encoded requests
    let body: Record<string, unknown>;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    } else {
      // Try JSON as fallback
      try {
        body = await request.json();
      } catch {
        throw new Error('Unsupported content type');
      }
    }
    
    console.log('POST request to API route:', slug, body);
    
    if (slug.length === 3 && slug[0] === 'appliances' && slug[2] === 'aircon_settings') {
      const applianceId = slug[1];
      console.log(`エアコン操作: appliance=${applianceId}`, body);
      await api.updateAirCon(applianceId, body as Partial<AirConSettings>);
      console.log('エアコン操作成功');
      return NextResponse.json({ success: true });
    }
    
    if (slug.length === 3 && slug[0] === 'appliances' && slug[2] === 'light') {
      const applianceId = slug[1];
      console.log(`照明操作: appliance=${applianceId}, button=${body.button}`);
      await api.updateLight(applianceId, body.button as string);
      console.log('照明操作成功');
      return NextResponse.json({ success: true });
    }
    
    if (slug.length === 3 && slug[0] === 'signals' && slug[2] === 'send') {
      const signalId = slug[1];
      console.log(`シグナル送信: signal=${signalId}`);
      await api.sendSignal(signalId);
      console.log('シグナル送信成功');
      return NextResponse.json({ success: true });
    }

    console.log('API route not found:', slug);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Nature Remo API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
