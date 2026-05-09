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
  duplexOffsetMHz?: number; // if set, places a paired secondary allocation offset by this amount
}

export interface Venue {
  id: string;
  name: string;
  requests: FrequencyRequest[];
}

export interface Allocation {
  id: string;
  requestId: string;
  bandId: string;
  startMHz: number;
  endMHz: number;
  venueId: string;
  pairId?: string;
  pairRole?: 'primary' | 'secondary';
}

export interface DragPreview {
  bandId: string;
  startMHz: number;
  endMHz: number;
  valid: boolean;
  secondary?: {
    startMHz: number;
    endMHz: number;
    valid: boolean;
  };
}
