'use client';

import { useState } from 'react';
import { Appliance } from '@/types/nature-remo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SignalControlProps {
  appliance: Appliance;
  onUpdate?: () => void;
}

export function SignalControl({ appliance, onUpdate }: SignalControlProps) {
  const [isLoading, setIsLoading] = useState(false);

  const sendSignal = async (signalId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/remo/signals/${signalId}/send`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('操作に失敗しました');
      }
      
      onUpdate?.();
    } catch (error) {
      console.error('シグナル送信エラー:', error);
      alert('📱 リモコン信号の送信に失敗しました。しばらく待ってから再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'TV':
        return '📺';
      case 'IR':
        return '📱';
      default:
        return '🏠';
    }
  };

  return (
    <Card className="w-full bg-white border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-violet-500 to-purple-600 text-white px-8 py-6">
        <CardTitle className="text-xl font-bold flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl ring-2 ring-white/30">
            {getIcon(appliance.type)}
          </div>
          <div>
            <div className="text-xl font-bold">{appliance.nickname}</div>
            <div className="text-sm font-medium opacity-90 bg-white/10 px-3 py-1 rounded-full inline-block mt-1">
              {appliance.type === 'TV' ? 'テレビ' : appliance.type === 'IR' ? 'IR機器' : 'その他機器'}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-8 py-8 space-y-8">
        {/* デバイス情報 */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-xl p-6 shadow-sm">
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-violet-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">種</div>
                <span className="text-gray-700 font-semibold">機器種別</span>
              </div>
              <span className="font-bold text-violet-600 bg-violet-100 px-3 py-1 rounded-lg">{appliance.type}</span>
            </div>
            {appliance.model && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">製</div>
                  <span className="text-gray-700 font-semibold">メーカー</span>
                </div>
                <span className="font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-lg">{appliance.model.manufacturer}</span>
              </div>
            )}
          </div>
        </div>

        {/* 登録されているシグナルボタン */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              操
            </div>
            <h4 className="font-bold text-gray-800 text-lg">
              リモート操作
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {appliance.signals.map((signal) => (
              <Button
                key={signal.id}
                onClick={() => sendSignal(signal.id)}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                size="sm"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">📱</span>
                  <span className="text-sm">{signal.name}</span>
                  {isLoading && (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin ml-1"></div>
                  )}
                </div>
              </Button>
            ))}
          </div>
          
          {appliance.signals.length === 0 && (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-dashed border-gray-200 rounded-xl">
              <div className="text-gray-300 text-5xl mb-4">📱</div>
              <div className="text-lg text-gray-500 font-semibold mb-2">
                リモコン信号が未登録です
              </div>
              <div className="text-sm text-gray-400">
                Nature Remoアプリでリモコン信号を登録してください
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
