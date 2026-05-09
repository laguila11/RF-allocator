export interface FrequencyBand {
  id: string;
  name: string;
  startMHz: number;
  endMHz: number;
  color: string;
}

export interface FrequencyRequest {
  id: string;
  label: string;
  device: string;
  bandwidthMHz: number;
  priority: 'high' | 'medium' | 'low';
  color: string;
}

export interface Allocation {
  id: string;
  requestId: string;
  bandId: string;
  startMHz: number;
  endMHz: number;
}
