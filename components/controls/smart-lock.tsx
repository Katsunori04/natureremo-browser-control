'use client';

import { useState } from 'react';
import { Appliance } from '@/types/nature-remo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SmartLockProps {
  appliance: Appliance;
  onUpdate?: () => void;
}

export function SmartLock({ appliance, onUpdate }: SmartLockProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const lock = appliance.lock;

  // スマートロックは通常シグナル送信で操作
  const sendSignal = async (signalId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/remo/signals/${signalId}/send`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('操作に失敗しました');
      }
      
      // 成功時の視覚的フィードバック
      const button = document.querySelector(`[data-signal-id="${signalId}"]`);
      if (button) {
        button.classList.add('animate-pulse');
        setTimeout(() => button.classList.remove('animate-pulse'), 1000);
      }
      
      onUpdate?.();
    } catch (error) {
      console.error('スマートロック操作エラー:', error);
      // より親切なエラーメッセージ
      alert('🚫 操作に失敗しました。しばらく待ってから再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-white border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-8 py-6">
        <CardTitle className="text-xl font-bold flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl ring-2 ring-white/30">
            �
          </div>
          <div>
            <div className="text-xl font-bold">{appliance.nickname}</div>
            <div className="text-sm font-medium opacity-90 bg-white/10 px-3 py-1 rounded-full inline-block mt-1">
              スマートロック
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-8 py-8 space-y-8">
        {/* 現在の状態 */}
        {lock && (
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                  状
                </div>
                <span className="text-gray-700 font-semibold text-lg">施錠状態</span>
              </div>
              <div className={`font-bold px-4 py-2 rounded-xl text-base flex items-center gap-2 shadow-sm ${
                lock.lock === 'locked' 
                  ? 'bg-red-500 text-white ring-2 ring-red-200' 
                  : 'bg-emerald-500 text-white ring-2 ring-emerald-200'
              }`}>
                <span className="text-lg">
                  {lock.lock === 'locked' ? '🔒' : '🔓'}
                </span>
                {lock.lock === 'locked' ? '施錠中' : '解錠中'}
              </div>
            </div>
          </div>
        )}

        {/* 登録されているシグナルボタン */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              操
            </div>
            <h4 className="font-bold text-gray-800 text-lg">
              リモート操作
            </h4>
          </div>
          <div className="grid gap-3">
            {appliance.signals.map((signal) => (
              <Button
                key={signal.id}
                data-signal-id={signal.id}
                onClick={() => sendSignal(signal.id)}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-lg">📱</span>
                  <span className="text-base">{signal.name}</span>
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                  )}
                </div>
              </Button>
            ))}
          </div>
          
          {appliance.signals.length === 0 && (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-dashed border-gray-200 rounded-xl">
              <div className="text-gray-300 text-5xl mb-4">📱</div>
              <div className="text-lg text-gray-500 font-semibold mb-2">
                リモート信号が未登録です
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
