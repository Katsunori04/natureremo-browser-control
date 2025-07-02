'use client';

import { useState } from 'react';
import { Appliance } from '@/types/nature-remo';
import { ApplianceCard } from './appliance-card';

interface ClientApplianceListProps {
  initialAppliances: Appliance[];
  deviceName: string;
}

export function ClientApplianceList({ initialAppliances, deviceName }: ClientApplianceListProps) {
  const [appliances, setAppliances] = useState<Appliance[]>(initialAppliances);

  const refreshAppliances = async () => {
    try {
      const response = await fetch('/api/remo/appliances');
      if (response.ok) {
        const allAppliances = await response.json();
        // 現在のデバイスの家電のみをフィルタ
        const deviceAppliances = allAppliances.filter(
          (appliance: Appliance) => appliance.device.name === deviceName
        );
        setAppliances(deviceAppliances);
      }
    } catch (error) {
      console.error('家電データ更新エラー:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {appliances.map((appliance) => (
        <ApplianceCard 
          key={appliance.id} 
          appliance={appliance}
          onUpdate={refreshAppliances}
        />
      ))}
    </div>
  );
}
