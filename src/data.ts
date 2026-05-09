import type { FrequencyBand, Venue } from './types';

export const initialBands: FrequencyBand[] = [
  { id: 'grid-a', name: 'Grid A', startMHz: 470, endMHz: 482, color: '#3b82f6' },
  { id: 'grid-b', name: 'Grid B', startMHz: 500, endMHz: 512, color: '#8b5cf6' },
  { id: 'grid-c', name: 'Grid C', startMHz: 518, endMHz: 524, color: '#10b981' },
];

export const venues: Venue[] = [
  {
    id: 'main-stage',
    name: 'Main Stage',
    requests: [
      { id: 'ms-iem-01', label: 'IEM-01', device: 'Sennheiser G4 IEM',  bandwidthMHz: 0.2, priority: 'high',   color: '#ef4444' },
      { id: 'ms-iem-02', label: 'IEM-02', device: 'Sennheiser G4 IEM',  bandwidthMHz: 0.2, priority: 'high',   color: '#f97316' },
      { id: 'ms-mic-01', label: 'MIC-01', device: 'Shure UR4D',         bandwidthMHz: 0.2, priority: 'high',   color: '#eab308' },
      { id: 'ms-mic-02', label: 'MIC-02', device: 'Shure UR4D',         bandwidthMHz: 0.2, priority: 'medium', color: '#22c55e' },
      { id: 'ms-com-01', label: 'COM-01', device: 'Clear-Com Wireless', bandwidthMHz: 0.4, priority: 'medium', color: '#ec4899' },
      { id: 'ms-cam-01', label: 'CAM-01', device: 'Teradek Bolt',       bandwidthMHz: 1.0, priority: 'low',    color: '#f59e0b' },
    ],
  },
  {
    id: 'side-stage',
    name: 'Side Stage',
    requests: [
      { id: 'ss-iem-01', label: 'IEM-01', device: 'Shure PSM300',       bandwidthMHz: 0.2, priority: 'high',   color: '#06b6d4' },
      { id: 'ss-mic-01', label: 'MIC-01', device: 'Sennheiser EW100',   bandwidthMHz: 0.2, priority: 'high',   color: '#a855f7' },
      { id: 'ss-mic-02', label: 'MIC-02', device: 'Sennheiser EW100',   bandwidthMHz: 0.2, priority: 'medium', color: '#84cc16' },
      { id: 'ss-com-01', label: 'COM-01', device: 'RTS Roameo',         bandwidthMHz: 0.4, priority: 'medium', color: '#14b8a6' },
    ],
  },
  {
    id: 'press-room',
    name: 'Press Room',
    requests: [
      { id: 'pr-mic-01', label: 'MIC-01', device: 'Shure ULXD',         bandwidthMHz: 0.2, priority: 'medium', color: '#fb923c' },
      { id: 'pr-mic-02', label: 'MIC-02', device: 'Shure ULXD',         bandwidthMHz: 0.2, priority: 'medium', color: '#4ade80' },
      { id: 'pr-cam-01', label: 'CAM-01', device: 'Hollyland Mars 4K',  bandwidthMHz: 0.5, priority: 'low',    color: '#818cf8' },
    ],
  },
];

export const allRequests = venues.flatMap(v => v.requests);
