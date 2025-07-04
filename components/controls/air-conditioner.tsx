'use client';

import { useState, useEffect } from 'react';
import { Appliance, AirConSettings, Device } from '@/types/nature-remo';
import { Button } from '@/components/ui/button';
import { useIsClient } from '@/hooks/use-is-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AirConditionerProps {
  appliance: Appliance;
  onUpdate?: () => void;
}

export function AirConditioner({ appliance, onUpdate }: AirConditionerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentSettings, setCurrentSettings] = useState(appliance.settings);
  const [localAppliance, setLocalAppliance] = useState(appliance);
  const [deviceInfo, setDeviceInfo] = useState<Device | null>(null);
  const isClient = useIsClient();
  
  const settings = currentSettings;
  const device = localAppliance.device;
  const roomTemperature = deviceInfo?.newest_events?.te?.val || device.newest_events?.te?.val;
  const humidity = deviceInfo?.newest_events?.hu?.val || device.newest_events?.hu?.val;
  const illuminance = deviceInfo?.newest_events?.il?.val || device.newest_events?.il?.val;
  
  // コンポーネントマウント時にデバイス情報を取得
  useEffect(() => {
    const fetchDeviceInfo = async () => {
      try {
        const response = await fetch('/api/remo/devices');
        if (response.ok) {
          const devices = await response.json();
          const currentDevice = devices.find((d: Device) => d.id === device.id);
          if (currentDevice) {
            console.log('Device info fetched:', currentDevice);
            setDeviceInfo(currentDevice);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch device info:', error);
      }
    };
    
    fetchDeviceInfo();
  }, [device.id]);
  
  // デバッグ用にデバイス情報をログ出力
  console.log('Device info:', {
    name: device.name,
    newest_events: device.newest_events,
    roomTemperature,
    humidity,
    illuminance,
    deviceInfo
  });
  
  if (!settings) return null;

  const updateSetting = async (newSettings: Partial<AirConSettings>) => {
    setIsLoading(true);
    try {
      console.log(`エアコン操作: ${appliance.nickname}`, newSettings);
      
      // オプティミスティックUI更新を削除

      const response = await fetch(`/api/remo/appliances/${appliance.id}/aircon_settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      console.log(`エアコン操作レスポンス: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('エアコン操作APIエラー:', errorText);
        // エラー時はAPIから取得した最新の状態に戻す
        setCurrentSettings(localAppliance.settings);
        throw new Error(`操作に失敗しました: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('エアコン操作成功:', result);
      
      // 成功後に最新の状態を再取得してUIを更新
      setTimeout(async () => {
        try {
          const applianceResponse = await fetch(`/api/remo/appliances`);
          if (applianceResponse.ok) {
            const appliances: Appliance[] = await applianceResponse.json();
            const updatedAppliance = appliances.find((a: Appliance) => a.id === appliance.id);
            if (updatedAppliance) {
              console.log('最新の家電情報を取得:', updatedAppliance.settings);
              setLocalAppliance(updatedAppliance);
              setCurrentSettings(updatedAppliance.settings);
            }
          }
        } catch (error) {
          console.warn('最新状態の取得に失敗:', error);
        } finally {
          setIsLoading(false); // 状態取得後にローディングを解除
        }
      }, 1500); // 少し長めに待つ
      
      // 成功後に親コンポーネントを更新
      onUpdate?.();
    } catch (error) {
      console.error('エアコン操作エラー:', error);
      alert(`❄️ エアコンの操作に失敗しました。
詳細: ${error instanceof Error ? error.message : '不明なエラー'}`);
      // エラー時はAPIから取得した最新の状態に戻す
      setCurrentSettings(localAppliance.settings);
      setIsLoading(false);
    }
    // finallyブロックを削除し、setTimeoutの中でローディングを解除
  };

  const adjustTemperature = (delta: number) => {
    const currentTemp = parseInt(settings.temp);
    const newTemp = Math.max(16, Math.min(30, currentTemp + delta));
    updateSetting({ temp: newTemp.toString() });
  };

  const setMode = (mode: AirConSettings['mode']) => {
    updateSetting({ mode });
  };

  const togglePower = () => {
    updateSetting({ button: 'power' });
  };

  const getModeText = (mode: string) => {
    const modeMap = {
      cool: '冷房',
      warm: '暖房',
      dry: '除湿',
      blow: '送風',
      auto: '自動'
    };
    return modeMap[mode as keyof typeof modeMap] || mode;
  };

  return (
    <Card className="w-full bg-white border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-sky-500 to-blue-600 text-white px-8 py-6">
        <CardTitle className="text-xl font-bold flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl ring-2 ring-white/30">
            ❄️
          </div>
          <div>
            <div className="text-xl font-bold">{appliance.nickname}</div>
            <div className="text-sm font-medium opacity-90 bg-white/10 px-3 py-1 rounded-full inline-block mt-1">
              エアコン
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-8 py-8 space-y-8">
        {/* 現在の状態 */}
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">設</div>
                <span className="text-gray-700 font-semibold">設定温度</span>
              </div>
              <span className="font-bold text-2xl text-orange-600">{settings.temp}°C</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">室</div>
                <span className="text-gray-700 font-semibold">
                  {roomTemperature ? '室温' : humidity ? '湿度' : 'センサー'}
                </span>
              </div>
              <span className="font-bold text-2xl text-red-600">
                {roomTemperature ? `${roomTemperature.toFixed(1)}°C` : 
                 humidity ? `${humidity.toFixed(0)}%` : 
                 illuminance ? `${illuminance.toFixed(0)}lx` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">運</div>
                <span className="text-gray-700 font-semibold">運転モード</span>
              </div>
              <span className="font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">{getModeText(settings.mode)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">風</div>
                <span className="text-gray-700 font-semibold">風量</span>
              </div>
              <span className="font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-lg">{settings.vol}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">更</div>
                <span className="text-gray-700 font-semibold">更新時刻</span>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                {isClient ? new Date(settings.updated_at).toLocaleTimeString('ja-JP') : '--:--:--'}
              </span>
            </div>
          </div>
        </div>

        {/* 電源ボタン */}
        <Button 
          onClick={togglePower}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-xl">⚡</span>
            <span className="text-lg">電源 ON/OFF</span>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
            )}
          </div>
        </Button>

        {/* 温度調整 */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              温
            </div>
            <h4 className="font-bold text-gray-800 text-lg">
              温度調整
            </h4>
          </div>
          <div className="flex items-center gap-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 p-6 rounded-xl shadow-sm">
            <Button
              onClick={() => adjustTemperature(-1)}
              disabled={isLoading || parseInt(settings.temp) <= 16}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110 active:scale-95"
              size="icon"
            >
              <span className="text-xl font-bold">−</span>
            </Button>
            <div className="flex-1 text-center">
              <div className="text-4xl font-bold text-orange-600 bg-white border-2 border-orange-200 py-4 px-6 rounded-xl shadow-sm">
                {settings.temp}°C
              </div>
            </div>
            <Button
              onClick={() => adjustTemperature(1)}
              disabled={isLoading || parseInt(settings.temp) >= 30}
              className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110 active:scale-95"
              size="icon"
            >
              <span className="text-xl font-bold">+</span>
            </Button>
          </div>
        </div>

        {/* モード切替 */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              運
            </div>
            <h4 className="font-bold text-gray-800 text-lg">
              運転モード
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['cool', 'warm', 'dry', 'blow', 'auto'] as const).map((mode) => (
              <Button
                key={mode}
                onClick={() => setMode(mode)}
                disabled={isLoading}
                className={`font-semibold py-3 px-4 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98] ${
                  settings.mode === mode
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white ring-2 ring-purple-300'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
                size="sm"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-base">
                    {mode === 'cool' ? '❄️' : 
                     mode === 'warm' ? '🔥' : 
                     mode === 'dry' ? '💨' : 
                     mode === 'blow' ? '🌪️' : '🤖'}
                  </span>
                  {getModeText(mode)}
                </div>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
