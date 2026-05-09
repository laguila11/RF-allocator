import type { FrequencyBand, Service, Venue } from './types';

export const initialBands: FrequencyBand[] = [
  { id: 'grid-a', name: 'Grid A', startMHz: 470, endMHz: 482, color: '#3b82f6' },
  { id: 'grid-b', name: 'Grid B', startMHz: 500, endMHz: 512, color: '#8b5cf6' },
  { id: 'grid-c', name: 'Grid C', startMHz: 518, endMHz: 524, color: '#10b981' },
];

export const services: Service[] = [
  { id: 'svc-mic', name: 'Microphones & Camera', color: '#3b82f6', bandIds: ['grid-a'] },
  { id: 'svc-iem', name: 'In-Ear Monitors',      color: '#8b5cf6', bandIds: ['grid-b'] },
  { id: 'svc-com', name: 'Communications',        color: '#10b981', bandIds: ['grid-c'] },
];

export const venues: Venue[] = [
  {
    id: 'main-stage',
    name: 'Main Stage',
    requests: [
      { id: 'ms-iem-01', label: 'IEM-01', device: 'Sennheiser G4 IEM',       bandwidthMHz: 0.2, priority: 'high',   color: '#ef4444', serviceId: 'svc-iem' },
      { id: 'ms-iem-02', label: 'IEM-02', device: 'Sennheiser G4 IEM',       bandwidthMHz: 0.2, priority: 'high',   color: '#f97316', serviceId: 'svc-iem' },
      { id: 'ms-mic-01', label: 'MIC-01', device: 'Shure UR4D',              bandwidthMHz: 0.2, priority: 'high',   color: '#ca8a04', serviceId: 'svc-mic' },
      { id: 'ms-mic-02', label: 'MIC-02', device: 'Shure UR4D',              bandwidthMHz: 0.2, priority: 'medium', color: '#16a34a', serviceId: 'svc-mic' },
      { id: 'ms-com-01', label: 'COM-01', device: 'Clear-Com FreeSpeak II',  bandwidthMHz: 0.2, priority: 'high',   color: '#ec4899', serviceId: 'svc-com', duplexOffsetMHz: 3.5 },
      { id: 'ms-com-02', label: 'COM-02', device: 'Clear-Com FreeSpeak II',  bandwidthMHz: 0.2, priority: 'medium', color: '#d946ef', serviceId: 'svc-com', duplexOffsetMHz: 3.5 },
      { id: 'ms-cam-01', label: 'CAM-01', device: 'Teradek Bolt',            bandwidthMHz: 1.0, priority: 'low',    color: '#d97706', serviceId: 'svc-mic' },
    ],
  },
  {
    id: 'side-stage',
    name: 'Side Stage',
    requests: [
      { id: 'ss-iem-01', label: 'IEM-01', device: 'Shure PSM300',            bandwidthMHz: 0.2, priority: 'high',   color: '#0891b2', serviceId: 'svc-iem' },
      { id: 'ss-mic-01', label: 'MIC-01', device: 'Sennheiser EW100',        bandwidthMHz: 0.2, priority: 'high',   color: '#7c3aed', serviceId: 'svc-mic' },
      { id: 'ss-mic-02', label: 'MIC-02', device: 'Sennheiser EW100',        bandwidthMHz: 0.2, priority: 'medium', color: '#65a30d', serviceId: 'svc-mic' },
      { id: 'ss-com-01', label: 'COM-01', device: 'RTS Roameo',              bandwidthMHz: 0.2, priority: 'medium', color: '#0f766e', serviceId: 'svc-com', duplexOffsetMHz: 3.5 },
    ],
  },
  {
    id: 'press-room',
    name: 'Press Room',
    requests: [
      { id: 'pr-mic-01', label: 'MIC-01', device: 'Shure ULXD',              bandwidthMHz: 0.2, priority: 'medium', color: '#ea580c', serviceId: 'svc-mic' },
      { id: 'pr-mic-02', label: 'MIC-02', device: 'Shure ULXD',              bandwidthMHz: 0.2, priority: 'medium', color: '#15803d', serviceId: 'svc-mic' },
      { id: 'pr-cam-01', label: 'CAM-01', device: 'Hollyland Mars 4K',       bandwidthMHz: 0.5, priority: 'low',    color: '#4f46e5', serviceId: 'svc-mic' },
    ],
  },
];

export const allRequests = venues.flatMap(v => v.requests);
