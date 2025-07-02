'use client';

import { useState } from 'react';
import { Appliance, LightState } from '@/types/nature-remo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LightProps {
  appliance: Appliance;
  onUpdate?: () => void;
}

export function Light({ appliance, onUpdate }: LightProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localState, setLocalState] = useState<LightState | undefined>(appliance.light?.state);
  
  const light = appliance.light;
  const lightState = localState || light?.state;

  const sendLightCommand = async (button: string) => {
    setIsLoading(true);
    try {
      console.log(`照明操作: ${appliance.nickname} - ${button}`);
      
      // 楽観的UI更新
      if (button === 'on') {
        setLocalState(prev => prev ? { ...prev, power: 'on', last_button: 'on' } : { power: 'on', last_button: 'on', brightness: 'favorite' });
      } else if (button === 'off') {
        setLocalState(prev => prev ? { ...prev, power: 'off', last_button: 'off' } : { power: 'off', last_button: 'off', brightness: 'favorite' });
      } else {
        setLocalState(prev => prev ? { ...prev, last_button: button } : { power: 'on', last_button: button, brightness: 'favorite' });
      }
      
      const response = await fetch(`/api/remo/appliances/${appliance.id}/light`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ button }),
      });
      
      console.log(`照明操作レスポンス: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('照明操作APIエラー:', errorText);
        // 失敗時は元の状態に戻す
        setLocalState(appliance.light?.state);
        throw new Error(`操作に失敗しました: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('照明操作成功:', result);
      
      // 操作成功後に親コンポーネントに更新を通知
      onUpdate?.();
      
      // 少し遅らせて最新状態を取得
      setTimeout(async () => {
        try {
          const applianceResponse = await fetch(`/api/remo/appliances`);
          if (applianceResponse.ok) {
            const appliances: Appliance[] = await applianceResponse.json();
            const updatedAppliance = appliances.find((a: Appliance) => a.id === appliance.id);
            if (updatedAppliance?.light?.state) {
              setLocalState(updatedAppliance.light.state);
            }
          }
        } catch (error) {
          console.warn('状態更新の取得に失敗:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('照明操作エラー:', error);
      alert(`💡 照明の操作に失敗しました。\n詳細: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-white border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white px-8 py-6">
        <CardTitle className="text-xl font-bold flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl ring-2 ring-white/30">
            💡
          </div>
          <div>
            <div className="text-xl font-bold">{appliance.nickname}</div>
            <div className="text-sm font-medium opacity-90 bg-white/10 px-3 py-1 rounded-full inline-block mt-1">
              照明
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-8 py-8 space-y-8">
        {/* 現在の状態 */}
        {lightState ? (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">電</div>
                  <span className="text-gray-700 font-semibold">電源状態</span>
                </div>
                <span className={`font-bold px-3 py-1 rounded-lg text-sm ${
                  lightState.power === 'on' 
                    ? 'bg-green-500 text-white ring-2 ring-green-200' 
                    : 'bg-gray-400 text-white ring-2 ring-gray-200'
                }`}>
                  {lightState.power === 'on' ? '💡 ON' : '⚫ OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">明</div>
                  <span className="text-gray-700 font-semibold">明るさ</span>
                </div>
                <span className="font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-lg">{lightState.brightness || 'N/A'}</span>
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">操</div>
                  <span className="text-gray-700 font-semibold">最後の操作</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-lg border">{lightState.last_button || 'N/A'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">💡</div>
              <p className="font-semibold">照明の状態を取得できませんでした</p>
              <p className="text-sm">Nature Remoアプリで照明が正しく設定されているか確認してください</p>
            </div>
          </div>
        )}

        {/* 操作ボタン */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              操
            </div>
            <h4 className="font-bold text-gray-800 text-lg">
              照明操作
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* 基本ボタン */}
            {light?.buttons?.find(btn => btn.name === 'on') && (
              <Button
                onClick={() => sendLightCommand('on')}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🟢</span>
                  <span>点灯</span>
                </div>
              </Button>
            )}
            
            {light?.buttons?.find(btn => btn.name === 'off') && (
              <Button
                onClick={() => sendLightCommand('off')}
                disabled={isLoading}
                className="bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">⚫</span>
                  <span>消灯</span>
                </div>
              </Button>
            )}
            
            {/* 明るさ調整ボタン */}
            {light?.buttons?.find(btn => btn.name === 'bright-up') && (
              <Button
                onClick={() => sendLightCommand('bright-up')}
                disabled={isLoading}
                className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">☀️</span>
                  <span>明るく</span>
                </div>
              </Button>
            )}
            
            {light?.buttons?.find(btn => btn.name === 'bright-down') && (
              <Button
                onClick={() => sendLightCommand('bright-down')}
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🌙</span>
                  <span>暗く</span>
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                  )}
                </div>
              </Button>
            )}
            
            {/* 追加のボタン */}
            {light?.buttons?.find(btn => btn.name === 'colortemp-up') && (
              <Button
                onClick={() => sendLightCommand('colortemp-up')}
                disabled={isLoading}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">❄️</span>
                  <span>色温度+</span>
                </div>
              </Button>
            )}
            
            {light?.buttons?.find(btn => btn.name === 'colortemp-down') && (
              <Button
                onClick={() => sendLightCommand('colortemp-down')}
                disabled={isLoading}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🔥</span>
                  <span>色温度-</span>
                </div>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
