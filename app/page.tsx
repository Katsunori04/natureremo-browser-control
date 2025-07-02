import { Appliance } from '@/types/nature-remo';
import { NatureRemoAPI, groupAppliancesByDevice } from '@/lib/nature-remo';
import { ClientApplianceList } from '@/components/client-appliance-list';

async function getAppliances(): Promise<Appliance[]> {
  try {
    if (!process.env.NATURE_REMO_API_KEY) {
      console.error('NATURE_REMO_API_KEY is not set in environment variables');
      return [];
    }

    console.log('Fetching appliances directly from Nature Remo API...');
    
    const api = new NatureRemoAPI(process.env.NATURE_REMO_API_KEY);
    const appliances = await api.getAppliances();
    
    console.log('Successfully fetched appliances:', appliances.length);
    return appliances;
  } catch (error) {
    console.error('家電データ取得エラー:', error);
    return [];
  }
}

export default async function Home() {
  const appliances = await getAppliances();
  const groupedAppliances = groupAppliancesByDevice(appliances);

  if (appliances.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto text-4xl text-white shadow-lg">
            🏠
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            家電が見つかりません
          </h2>
          <div className="space-y-4">
            <p className="text-lg text-gray-600">
              以下の点を確認してください：
            </p>
            <ul className="text-left text-gray-600 space-y-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</span>
                .env.local ファイルにNATURE_REMO_API_KEYが正しく設定されているか
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</span>
                Nature Remo デバイスがオンラインになっているか
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</span>
                APIキーが有効期限内であるか
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">4</span>
                Nature Remo アプリで家電が正しく登録されているか
              </li>
            </ul>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                <p className="font-semibold text-blue-700 mb-2">🛠️ デバッグ情報</p>
                <p className="font-mono text-sm text-blue-600">/api/debug</p>
              </div>
              <div className="bg-white border-2 border-green-200 rounded-xl p-4 shadow-sm">
                <p className="font-semibold text-green-700 mb-2">🔗 API直接テスト</p>
                <p className="font-mono text-sm text-green-600">/api/remo/appliances</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 rounded-2xl shadow-xl p-10">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl ring-4 ring-white/30">
              🏠
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-center">
            スマートホーム
          </h1>
          <p className="text-xl font-medium text-center opacity-90">
            Nature Remo で家電をスマートに操作
          </p>
        </div>
      </div>

      {Object.entries(groupedAppliances).map(([deviceName, deviceAppliances]) => (
        <div key={deviceName} className="space-y-6">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-0 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-xl text-white shadow-md">
                  📍
                </div>
                <span>{deviceName}</span>
              </h2>
              <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg font-semibold px-4 py-2 rounded-xl shadow-md">
                {deviceAppliances.length} 台
              </span>
            </div>
          </div>
          <ClientApplianceList 
            initialAppliances={deviceAppliances}
            deviceName={deviceName}
          />
        </div>
      ))}
      
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-xl shadow-md">
            💡
          </div>
          <h3 className="text-2xl font-bold text-gray-800">
            使い方ガイド
          </h3>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">1</div>
              <span className="text-gray-700 text-lg">各カードから直接機器を操作できます</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">2</div>
              <span className="text-gray-700 text-lg">エアコンの温度・モード・風量を調整</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">3</div>
              <span className="text-gray-700 text-lg">照明の電源・明るさをコントロール</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">4</div>
              <span className="text-gray-700 text-lg">登録済みリモコンボタンでその他機器を操作</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
