export interface FrequencyBand {
  id: string;
  name: string;
  startMHz: number;
  endMHz: number;
  color: string;
  snapMHz?: number;
  channelMHz?: number; // minimum allocatable channel width; drives grid cell size
}

export interface FrequencyRequest {
  id: string;
  label: string;
  device: string;
  bandwidthMHz: number;
  color: string;
  serviceId: string;
  duplexOffsetMHz?: number;
}

export interface Service {
  id: string;
  name: string;
  color: string;
  bandIds: string[];
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

export interface Reservation {
  id: string;
  bandId: string;
  startMHz: number;
  endMHz: number;
  reason: string;
}

export interface BandGridParams {
  numCols: number;
  cellHeightPx: number;
  channelMHz: number; // display cell width in MHz (may be > band.channelMHz when cells are capped)
  numCells: number;
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

export interface PendingReserve {
  bandId: string;
  startMHz: number;
  endMHz: number;
}
