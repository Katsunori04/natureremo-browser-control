'use client';

import { Appliance } from '@/types/nature-remo';
import { AirConditioner } from './controls/air-conditioner';
import { Light } from './controls/light';
import { SmartLock } from './controls/smart-lock';
import { SignalControl } from './controls/signal-control';

interface ApplianceCardProps {
  appliance: Appliance;
  onUpdate?: () => void;
}

export function ApplianceCard({ appliance, onUpdate }: ApplianceCardProps) {
  // 家電タイプに応じて適切な操作パネルを表示
  switch (appliance.type) {
    case 'AC':
      return <AirConditioner appliance={appliance} onUpdate={onUpdate} />;
    case 'LIGHT':
      return <Light appliance={appliance} onUpdate={onUpdate} />;
    case 'LOCK':
      return <SmartLock appliance={appliance} onUpdate={onUpdate} />;
    case 'TV':
    case 'IR':
    default:
      return <SignalControl appliance={appliance} onUpdate={onUpdate} />;
  }
}
