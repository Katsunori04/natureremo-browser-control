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
  
  // デバッグ用にエアコン設定情報をログ出力
  if (settings) {
    console.log('Air conditioner debug:', {
      appliance: appliance.nickname,
      settings: {
        temp: settings.temp,
        mode: settings.mode,
        vol: settings.vol,
        dir: settings.dir,
        dirh: settings.dirh,
        button: settings.button,
        temp_unit: settings.temp_unit,
        updated_at: settings.updated_at
      },
      buttonState: settings.button,
      isOffStateOld: settings.button === 'power-off' || settings.button === '' || !settings.button,
      fixedButtons: localAppliance.aircon?.range.fixedButtons,
      modes: localAppliance.aircon?.range.modes ? Object.keys(localAppliance.aircon.range.modes) : [],
      airconRange: localAppliance.aircon?.range
    });
  }
  
  if (!settings) return null;

  // エアコンの電源状態を判定する関数
  const isAirConditionerOff = () => {
    // Nature Remo APIでは、エアコンの電源状態は複数の要因で判定される
    // 1. buttonが'power-off'または''の場合
    // 2. 一部のエアコンでは、特定の温度やモードが設定されていない場合
    // 3. 実際の運転状態を確認
    
    const buttonIsOff = settings.button === 'power-off' || 
                       settings.button === '' || 
                       !settings.button;
    
    // 追加の判定条件：温度が設定されていない、またはモードが設定されていない場合
    const noValidSettings = !settings.temp || !settings.mode;
    
    // fixedButtonsに基づいた判定
    const fixedButtons = localAppliance.aircon?.range.fixedButtons || [];
    const hasPowerOffButton = fixedButtons.includes('power-off');
    
    console.log('電源状態判定:', {
      buttonIsOff,
      noValidSettings,
      hasPowerOffButton,
      currentButton: settings.button,
      currentTemp: settings.temp,
      currentMode: settings.mode,
      fixedButtons
    });
    
    // power-offボタンが存在する場合は、それを基準に判定
    if (hasPowerOffButton) {
      return settings.button === 'power-off';
    }
    
    // power-offボタンが存在しない場合は、複合的に判定
    return buttonIsOff || noValidSettings;
  };

  const updateSetting = async (newSettings: Partial<AirConSettings>) => {
    setIsLoading(true);
    console.log('=== エアコン操作開始 ===');
    console.log('家電情報:', {
      nickname: appliance.nickname,
      id: appliance.id,
      type: appliance.type,
      model: appliance.model
    });
    console.log('現在の設定:', settings);
    console.log('新しい設定:', newSettings);
    console.log('利用可能なボタン:', localAppliance.aircon?.range.fixedButtons);
    
    try {
      const response = await fetch(`/api/remo/appliances/${appliance.id}/aircon_settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      console.log(`APIレスポンス: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('APIエラー詳細:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        // エラー時はAPIから取得した最新の状態に戻す
        setCurrentSettings(localAppliance.settings);
        throw new Error(`操作に失敗しました: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API操作成功:', result);
      
      // 成功後に最新の状態を再取得してUIを更新
      setTimeout(async () => {
        try {
          console.log('最新状態を取得中...');
          const applianceResponse = await fetch(`/api/remo/appliances`);
          if (applianceResponse.ok) {
            const appliances: Appliance[] = await applianceResponse.json();
            const updatedAppliance = appliances.find((a: Appliance) => a.id === appliance.id);
            if (updatedAppliance) {
              console.log('最新の家電情報:', {
                settings: updatedAppliance.settings,
                previousSettings: currentSettings
              });
              setLocalAppliance(updatedAppliance);
              setCurrentSettings(updatedAppliance.settings);
            }
          }
        } catch (error) {
          console.warn('最新状態の取得に失敗:', error);
        } finally {
          setIsLoading(false);
          console.log('=== エアコン操作完了 ===');
        }
      }, 1500);
      
      // 成功後に親コンポーネントを更新
      onUpdate?.();
    } catch (error) {
      console.error('エアコン操作エラー:', error);
      alert(`❄️ エアコンの操作に失敗しました。
詳細: ${error instanceof Error ? error.message : '不明なエラー'}`);
      // エラー時はAPIから取得した最新の状態に戻す
      setCurrentSettings(localAppliance.settings);
      setIsLoading(false);
      console.log('=== エアコン操作失敗 ===');
    }
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
    const fixedButtons = localAppliance.aircon?.range.fixedButtons || [];
    const modes = localAppliance.aircon?.range.modes || {};
    
    console.log('エアコン電源操作:', {
      nickname: appliance.nickname,
      id: appliance.id,
      fixedButtons,
      currentButton: settings.button,
      currentMode: settings.mode,
      currentTemp: settings.temp,
      availableModes: Object.keys(modes)
    });

    // 新しい電源状態判定関数を使用
    const isCurrentlyOff = isAirConditionerOff();
    
    if (isCurrentlyOff) {
      // 電源をONにする - モードと温度を設定してエアコンを起動
      console.log('電源をONにします（モードと温度を設定）');
      const targetMode = settings.mode || 'auto';
      const targetTemp = settings.temp || '26';
      const targetVol = settings.vol || 'auto';
      
      // buttonパラメータは含めない（モードと温度だけで電源ON）
      updateSetting({
        mode: targetMode,
        temp: targetTemp,
        vol: targetVol
      });
    } else {
      // 電源をOFFにする
      console.log('電源をOFFにします');
      if (fixedButtons.includes('power-off')) {
        // power-offボタンが利用可能な場合
        console.log('power-offボタンを使用');
        updateSetting({ button: 'power-off' });
      } else if (fixedButtons.includes('power')) {
        // 汎用のpowerボタンが利用可能な場合
        console.log('powerボタンを使用');
        updateSetting({ button: 'power' });
      } else {
        // ボタンが利用できない場合、可能性のあるアプローチを試す
        console.log('電源ボタンが見つかりません。利用可能なボタンを確認してください。');
        console.log('利用可能なボタン:', fixedButtons);
        
        // 利用可能なボタンを表示してユーザーに選択させる
        const buttonOptions = fixedButtons.filter(btn => 
          btn.includes('power') || btn.includes('off') || btn.includes('on')
        );
        
        if (buttonOptions.length > 0) {
          console.log('電源関連のボタン:', buttonOptions);
          // 最初に見つかった電源関連ボタンを試す
          updateSetting({ button: buttonOptions[0] });
        } else {
          alert(`このエアコンは電源OFF操作に対応していません。
利用可能なボタン: ${fixedButtons.join(', ')}`);
        }
      }
    }
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
                <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">電</div>
                <span className="text-gray-700 font-semibold">電源状態</span>
              </div>
              <span className={`font-bold text-lg px-2 py-1 rounded-lg ${
                isAirConditionerOff()
                  ? 'text-gray-600 bg-gray-100'
                  : 'text-green-600 bg-green-100'
              }`}>
                {isAirConditionerOff() ? 'OFF' : 'ON'}
              </span>
            </div>
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
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              電
            </div>
            <h4 className="font-bold text-gray-800 text-lg">
              電源制御
            </h4>
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isAirConditionerOff()
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-green-100 text-green-700'
              }`}>
                {isAirConditionerOff() ? 'OFF' : 'ON'}
              </span>
            </div>
          </div>
          
          {/* デバッグ情報 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
            <div className="font-semibold text-gray-700 mb-1">デバッグ情報:</div>
            <div className="text-gray-600 space-y-1">
              <div>現在のボタン: {settings.button || '(なし)'}</div>
              <div>判定された電源状態: {isAirConditionerOff() ? 'OFF' : 'ON'}</div>
              <div>温度: {settings.temp}°C, モード: {settings.mode}</div>
              <div>利用可能なボタン: {localAppliance.aircon?.range.fixedButtons?.join(', ') || '(なし)'}</div>
            </div>
          </div>
          
          <Button 
            onClick={togglePower}
            disabled={isLoading}
            className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] ${
              isAirConditionerOff()
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl">
                {isAirConditionerOff() ? '🔌' : '⚡'}
              </span>
              <span className="text-lg">
                {isAirConditionerOff() ? '電源 ON' : '電源 OFF'}
              </span>
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
              )}
            </div>
          </Button>
        </div>

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
