import type { FrequencyBand, Service, Venue } from './types';

// ─── Frequency bands ────────────────────────────────────────────────────────
// Source: LA28 Spectrum Availability Plan v1.1 (2025-10-22)
//
// Wireless Mics & IEM  → Table 6 & 7: 470–608 MHz primary band, 200 kHz ch
//   Prototype uses two 30 MHz sub-zones within that range (one per service)
//   to keep individual 200 kHz allocations visible on screen.
//
// PLMR / Talkback      → Table 4: 450–470 MHz; Section 3.1.3: 5 MHz UHF duplex
//   Channels are 12.5 kHz in reality; prototype uses 200 kHz for visibility.
//
// Wireless Camera      → Table 5: 1425–1535 MHz L-Band, ≤500 mW ERP
//   Prototype sub-range 1452–1492 MHz; snap to 1 MHz per LA28 recommendation.
// ─────────────────────────────────────────────────────────────────────────────

export const initialBands: FrequencyBand[] = [
  // Mics zone: lower half of the LA28 470–608 MHz UHF allocation
  { id: 'uhf-mic', name: 'UHF Mics',    startMHz: 470,  endMHz: 500,  color: '#3b82f6' },
  // IEM zone: upper portion of the same 470–608 MHz allocation
  { id: 'uhf-iem', name: 'UHF IEM',     startMHz: 500,  endMHz: 530,  color: '#8b5cf6' },
  // Talkback: LA28 Table 4 PLMR/Audio Intercom band, 5 MHz UHF duplex spacing
  { id: 'plmr-tb', name: 'PLMR/Talkback', startMHz: 450, endMHz: 470, color: '#10b981' },
  // L-Band camera: LA28 Table 5 (1425–1535 MHz), snap = 1 MHz per plan §3.4.1
  { id: 'l-band',  name: 'L-Band Camera', startMHz: 1452, endMHz: 1492, color: '#f59e0b', snapMHz: 1.0 },
];

export const services: Service[] = [
  { id: 'svc-mic', name: 'Wireless Microphones', color: '#3b82f6', bandIds: ['uhf-mic'] },
  { id: 'svc-iem', name: 'In-Ear Monitors',       color: '#8b5cf6', bandIds: ['uhf-iem'] },
  { id: 'svc-com', name: 'Communications',         color: '#10b981', bandIds: ['plmr-tb'] },
  { id: 'svc-cam', name: 'Wireless Camera',         color: '#f59e0b', bandIds: ['l-band'] },
];

// ─── Venues & requests ───────────────────────────────────────────────────────
// bandwidthMHz:
//   Mics & IEM → 0.2 MHz (200 kHz) per Tables 6 & 7
//   COM        → 0.2 MHz displayed; actual PLMR is 12.5 kHz (Table 4) — widened for visibility
//   Camera     → 8.0 MHz per L-Band channel (Table 5 typical allocation step)
// duplexOffsetMHz for COM → 5 MHz (UHF PLMR, Section 3.1.3)
// ─────────────────────────────────────────────────────────────────────────────

export const venues: Venue[] = [
  {
    id: 'opening-ceremony',
    name: 'Opening Ceremony',
    requests: [
      { id: 'oc-mic-01', label: 'MIC-01', device: 'Shure Axient Digital AXT200',   bandwidthMHz: 0.2, priority: 'high',   color: '#1d4ed8', serviceId: 'svc-mic' },
      { id: 'oc-mic-02', label: 'MIC-02', device: 'Shure Axient Digital AXT200',   bandwidthMHz: 0.2, priority: 'high',   color: '#2563eb', serviceId: 'svc-mic' },
      { id: 'oc-mic-03', label: 'MIC-03', device: 'Sennheiser Digital 6000',       bandwidthMHz: 0.2, priority: 'high',   color: '#3b82f6', serviceId: 'svc-mic' },
      { id: 'oc-mic-04', label: 'MIC-04', device: 'Sennheiser Digital 6000',       bandwidthMHz: 0.2, priority: 'medium', color: '#60a5fa', serviceId: 'svc-mic' },
      { id: 'oc-iem-01', label: 'IEM-01', device: 'Shure PSM1000',                 bandwidthMHz: 0.2, priority: 'high',   color: '#6d28d9', serviceId: 'svc-iem' },
      { id: 'oc-iem-02', label: 'IEM-02', device: 'Shure PSM1000',                 bandwidthMHz: 0.2, priority: 'high',   color: '#7c3aed', serviceId: 'svc-iem' },
      { id: 'oc-iem-03', label: 'IEM-03', device: 'Sennheiser SR 2050 IEM',        bandwidthMHz: 0.2, priority: 'medium', color: '#8b5cf6', serviceId: 'svc-iem' },
      // COM: 5 MHz UHF duplex offset (LA28 §3.1.3), both channels fit in 450–470 MHz
      { id: 'oc-com-01', label: 'COM-01', device: 'Riedel Artist 32 (PLMR)',       bandwidthMHz: 0.2, priority: 'high',   color: '#047857', serviceId: 'svc-com', duplexOffsetMHz: 5 },
      { id: 'oc-com-02', label: 'COM-02', device: 'Riedel Artist 32 (PLMR)',       bandwidthMHz: 0.2, priority: 'high',   color: '#059669', serviceId: 'svc-com', duplexOffsetMHz: 5 },
      // Camera: 8 MHz / channel in 1452–1492 MHz (LA28 Table 5, 1425–1535 MHz)
      { id: 'oc-cam-01', label: 'CAM-01', device: 'Vislink HCAM-S L-Band',         bandwidthMHz: 8.0, priority: 'high',   color: '#b45309', serviceId: 'svc-cam' },
      { id: 'oc-cam-02', label: 'CAM-02', device: 'Vislink HCAM-S L-Band',         bandwidthMHz: 8.0, priority: 'medium', color: '#d97706', serviceId: 'svc-cam' },
    ],
  },
  {
    id: 'athletics',
    name: 'Athletics (FOP)',
    requests: [
      { id: 'ath-mic-01', label: 'MIC-01', device: 'Shure Axient Digital AXT200',  bandwidthMHz: 0.2, priority: 'high',   color: '#1e40af', serviceId: 'svc-mic' },
      { id: 'ath-mic-02', label: 'MIC-02', device: 'Sennheiser Digital 6000',      bandwidthMHz: 0.2, priority: 'medium', color: '#3b82f6', serviceId: 'svc-mic' },
      { id: 'ath-mic-03', label: 'MIC-03', device: 'Sennheiser EW-DX (UHF)',       bandwidthMHz: 0.2, priority: 'low',    color: '#93c5fd', serviceId: 'svc-mic' },
      { id: 'ath-iem-01', label: 'IEM-01', device: 'Shure PSM1000',                bandwidthMHz: 0.2, priority: 'high',   color: '#a78bfa', serviceId: 'svc-iem' },
      { id: 'ath-iem-02', label: 'IEM-02', device: 'Sennheiser SR 2050 IEM',       bandwidthMHz: 0.2, priority: 'medium', color: '#c4b5fd', serviceId: 'svc-iem' },
      { id: 'ath-com-01', label: 'COM-01', device: 'Riedel Artist 32 (PLMR)',      bandwidthMHz: 0.2, priority: 'high',   color: '#065f46', serviceId: 'svc-com', duplexOffsetMHz: 5 },
      { id: 'ath-com-02', label: 'COM-02', device: 'Clear-Com FreeSpeak Edge',     bandwidthMHz: 0.2, priority: 'medium', color: '#10b981', serviceId: 'svc-com', duplexOffsetMHz: 5 },
      { id: 'ath-cam-01', label: 'CAM-01', device: 'Vislink HCAM-S L-Band',        bandwidthMHz: 8.0, priority: 'high',   color: '#f59e0b', serviceId: 'svc-cam' },
    ],
  },
  {
    id: 'ibc-media',
    name: 'IBC / Media',
    requests: [
      { id: 'ibc-mic-01', label: 'MIC-01', device: 'Shure Axient Digital AXT200',  bandwidthMHz: 0.2, priority: 'medium', color: '#2563eb', serviceId: 'svc-mic' },
      { id: 'ibc-mic-02', label: 'MIC-02', device: 'Sony DWX Series (UHF)',         bandwidthMHz: 0.2, priority: 'low',    color: '#93c5fd', serviceId: 'svc-mic' },
      { id: 'ibc-iem-01', label: 'IEM-01', device: 'Shure PSM900',                 bandwidthMHz: 0.2, priority: 'medium', color: '#9333ea', serviceId: 'svc-iem' },
      { id: 'ibc-cam-01', label: 'CAM-01', device: 'Grass Valley LDX 135 (Exlink)', bandwidthMHz: 8.0, priority: 'high',   color: '#fbbf24', serviceId: 'svc-cam' },
    ],
  },
];

export const allRequests = venues.flatMap(v => v.requests);
