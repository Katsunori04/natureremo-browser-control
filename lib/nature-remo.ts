import { Appliance, AirConSettings, Device } from '@/types/nature-remo';

const BASE_URL = 'https://api.nature.global';

export class NatureRemoAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    console.log(`Making request to: ${BASE_URL}${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options.headers,
      },
    });

    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API response received successfully');
    return data;
  }

  async getAppliances(): Promise<Appliance[]> {
    return this.request<Appliance[]>('/1/appliances');
  }

  async getDevices(): Promise<Device[]> {
    return this.request<Device[]>('/1/devices');
  }

  async updateAirCon(applianceId: string, settings: Partial<AirConSettings>): Promise<void> {
    const params = new URLSearchParams();
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        // Nature Remo APIはtemperatureというキーを要求する
        if (key === 'temp') {
          params.append('temperature', value.toString());
        } else if (key === 'button') {
          // buttonは空文字列の場合は送信しない
          if (value.toString().trim() !== '') {
            params.append(key, value.toString());
          }
        } else {
          params.append(key, value.toString());
        }
      }
    });

    // APIリクエストの詳細をログ出力
    console.log(`エアコン設定APIリクエスト:`, {
      applianceId,
      originalSettings: settings,
      params: Object.fromEntries(params.entries()),
      endpoint: `/1/appliances/${applianceId}/aircon_settings`
    });

    await this.request(`/1/appliances/${applianceId}/aircon_settings`, {
      method: 'POST',
      body: params,
    });
  }

  async updateLight(applianceId: string, button: string): Promise<void> {
    const params = new URLSearchParams();
    params.append('button', button);

    await this.request(`/1/appliances/${applianceId}/light`, {
      method: 'POST',
      body: params,
    });
  }

  async sendSignal(signalId: string): Promise<void> {
    await this.request(`/1/signals/${signalId}/send`, {
      method: 'POST',
    });
  }
}

export function groupAppliancesByDevice(appliances: Appliance[]) {
  return appliances.reduce((groups, appliance) => {
    const deviceName = appliance.device.name;
    if (!groups[deviceName]) {
      groups[deviceName] = [];
    }
    groups[deviceName].push(appliance);
    return groups;
  }, {} as Record<string, Appliance[]>);
}
