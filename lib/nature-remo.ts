import { Appliance, AirConSettings } from '@/types/nature-remo';

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

  async updateAirCon(applianceId: string, settings: Partial<AirConSettings>): Promise<void> {
    const params = new URLSearchParams();
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
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
