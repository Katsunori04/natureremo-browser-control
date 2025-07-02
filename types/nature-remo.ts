export interface Device {
  id: string;
  name: string;
  temperature_offset: number;
  humidity_offset: number;
  created_at: string;
  updated_at: string;
  firmware_version: string;
  mac_address: string;
  bt_mac_address: string;
  serial_number: string;
  newest_events: {
    te?: { val: number; created_at: string };
    hu?: { val: number; created_at: string };
    il?: { val: number; created_at: string };
  };
}

export interface Appliance {
  id: string;
  device: Device;
  model: {
    id: string;
    manufacturer: string;
    remote_name: string;
    name: string;
    image: string;
  } | null;
  type: 'AC' | 'LIGHT' | 'TV' | 'LOCK' | 'IR' | 'BLE_SESAME5';
  nickname: string;
  image: string;
  settings?: AirConSettings;
  aircon?: {
    range: {
      modes: Record<string, {
        temp: string[];
        dir: string[];
        dirh: string[];
        vol: string[];
      }>;
      fixedButtons: string[];
    };
    tempUnit: string;
  };
  light?: {
    buttons: Array<{
      name: string;
      image: string;
      label: string;
    }>;
    state: LightState;
  };
  ble?: {
    addr: string;
    addr_type: string;
    bonded: boolean;
    sesame?: {
      uuid: string;
      device_type: string;
      key_level: string;
      user_index: string;
    };
  };
  lock?: LockState;
  tv?: TvState;
  signals: Signal[];
  smart_meter?: unknown;
}

export interface AirConSettings {
  temp: string;
  temp_unit: 'c' | 'f';
  mode: 'cool' | 'warm' | 'dry' | 'blow' | 'auto';
  vol: string;
  dir: string;
  dirh: string;
  button: string;
  updated_at: string;
}

export interface LightState {
  brightness: string;
  power: 'on' | 'off';
  last_button: string;
}

export interface LockState {
  lock: 'locked' | 'unlocked';
}

export interface TvState {
  input: string;
  power: 'on' | 'off';
}

export interface Signal {
  id: string;
  name: string;
  image: string;
}

export interface GroupedAppliances {
  [deviceName: string]: Appliance[];
}
