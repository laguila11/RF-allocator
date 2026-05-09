import type { FrequencyBand, FrequencyRequest } from './types';

export const initialBands: FrequencyBand[] = [
  { id: 'band-a', name: 'Group A', startMHz: 470, endMHz: 482, color: '#3b82f6' },
  { id: 'band-b', name: 'Group B', startMHz: 500, endMHz: 512, color: '#8b5cf6' },
  { id: 'band-c', name: 'Group C', startMHz: 518, endMHz: 524, color: '#10b981' },
];

export const initialRequests: FrequencyRequest[] = [
  { id: 'req-1', label: 'IEM-01', device: 'Sennheiser G4 IEM',     bandwidthMHz: 0.2, priority: 'high',   color: '#ef4444' },
  { id: 'req-2', label: 'IEM-02', device: 'Sennheiser G4 IEM',     bandwidthMHz: 0.2, priority: 'high',   color: '#f97316' },
  { id: 'req-3', label: 'MIC-01', device: 'Shure UR4D',            bandwidthMHz: 0.2, priority: 'high',   color: '#eab308' },
  { id: 'req-4', label: 'MIC-02', device: 'Shure UR4D',            bandwidthMHz: 0.2, priority: 'medium', color: '#22c55e' },
  { id: 'req-5', label: 'MIC-03', device: 'Shure UR4D',            bandwidthMHz: 0.2, priority: 'medium', color: '#06b6d4' },
  { id: 'req-6', label: 'MIC-04', device: 'Sennheiser EW100',      bandwidthMHz: 0.2, priority: 'low',    color: '#a855f7' },
  { id: 'req-7', label: 'COM-01', device: 'Clear-Com Wireless',    bandwidthMHz: 0.4, priority: 'medium', color: '#ec4899' },
  { id: 'req-8', label: 'CAM-01', device: 'Teradek Bolt',          bandwidthMHz: 1.0, priority: 'low',    color: '#f59e0b' },
];
