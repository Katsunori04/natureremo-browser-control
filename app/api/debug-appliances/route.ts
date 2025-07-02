import { NextResponse } from 'next/server';
import { NatureRemoAPI } from '@/lib/nature-remo';

export async function GET() {
  try {
    if (!process.env.NATURE_REMO_API_KEY) {
      return NextResponse.json(
        { error: 'NATURE_REMO_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const api = new NatureRemoAPI(process.env.NATURE_REMO_API_KEY);
    
    // 基本的な接続テスト
    console.log('Testing Nature Remo API connection...');
    const appliances = await api.getAppliances();
    
    // 各家電の詳細を分析
    const debugInfo = appliances.map(appliance => ({
      id: appliance.id,
      nickname: appliance.nickname,
      type: appliance.type,
      model: appliance.model,
      device: appliance.device,
      settings: appliance.settings,
      aircon: appliance.aircon,
      light: appliance.light,
      ble: appliance.ble,
      tv: appliance.tv,
      signals_count: appliance.signals?.length || 0,
      signals: appliance.signals?.map(signal => ({
        id: signal.id,
        name: signal.name
      }))
    }));

    return NextResponse.json({
      success: true,
      api_key_set: !!process.env.NATURE_REMO_API_KEY,
      api_key_length: process.env.NATURE_REMO_API_KEY?.length || 0,
      appliances_count: appliances.length,
      appliances: debugInfo
    });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      api_key_set: !!process.env.NATURE_REMO_API_KEY,
      api_key_length: process.env.NATURE_REMO_API_KEY?.length || 0
    }, { status: 500 });
  }
}
