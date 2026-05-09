import type { FrequencyBand, Service, Venue } from './types';

// ─── Bands ────────────────────────────────────────────────────────────────────
// All ranges sourced from LA28 Spectrum Availability Plan v1.1 (2025-10-22).
// Wide bands (Mics/IEM, 470–608 MHz) are split into representative 30 MHz
// sub-zones so 200 kHz channels remain visible at prototype scale.
// ─────────────────────────────────────────────────────────────────────────────
export const initialBands: FrequencyBand[] = [
  // §3.11 Photographers: 344–354 MHz (pocket wizard triggers), Table 3
  { id: 'photo',    name: 'Photo Triggers',   startMHz: 340,  endMHz: 360,  color: '#64748b' },
  // §3.2 Telemetry: 403–420 MHz (RF camera control, data), Table 3
  { id: 'telem',    name: 'Telemetry',         startMHz: 403,  endMHz: 420,  color: '#0891b2' },
  // §3.3 Audio Intercom: 450–456 MHz PLMR talkback sub-range, Table 4
  //   Duplex 5 MHz UHF offset (§3.1.3): TX 450–450.8, RX 455–455.8 MHz
  { id: 'intercom', name: 'Audio Intercom',    startMHz: 450,  endMHz: 456,  color: '#10b981' },
  // §3.1 PLMR: 456–470 MHz LMR production simplex, Table 2
  { id: 'plmr',     name: 'PLMR',              startMHz: 456,  endMHz: 470,  color: '#16a34a' },
  // §3.5 Wireless Mics: lower zone of 470–608 MHz primary band, Table 6
  { id: 'uhf-mic',  name: 'Wireless Mics',     startMHz: 470,  endMHz: 500,  color: '#3b82f6' },
  // §3.6 IEM: upper zone of 470–608 MHz primary band, Table 7
  { id: 'uhf-iem',  name: 'IEM',               startMHz: 500,  endMHz: 530,  color: '#8b5cf6' },
  // §3.4 Wireless Camera: 1425–1535 MHz L-Band, Table 5; snap=1 MHz per §3.4.1
  { id: 'l-band',   name: 'L-Band Camera',     startMHz: 1452, endMHz: 1492, color: '#f59e0b', snapMHz: 1.0 },
];

// ─── Services (LA28 §3.x categories) ─────────────────────────────────────────
// Services 3.7–3.12 (Earth Stations, Microwave Links, Fixed PtP, WLAN, Other)
// are infrastructure/satellite services managed outside the interactive tool.
// ─────────────────────────────────────────────────────────────────────────────
export const services: Service[] = [
  { id: 'svc-plmr',    name: 'Private Land Mobile Radio (PLMR)',  color: '#16a34a', bandIds: ['plmr'] },
  { id: 'svc-telem',   name: 'Telemetry and Telecommand',          color: '#0891b2', bandIds: ['telem'] },
  { id: 'svc-intercom',name: 'Audio Intercommunication System',    color: '#10b981', bandIds: ['intercom'] },
  { id: 'svc-cam',     name: 'Wireless Video Camera',              color: '#f59e0b', bandIds: ['l-band'] },
  { id: 'svc-wmic',    name: 'Wireless Microphones',               color: '#3b82f6', bandIds: ['uhf-mic'] },
  { id: 'svc-iem',     name: 'In-Ear Monitors (IEM)',              color: '#8b5cf6', bandIds: ['uhf-iem'] },
  { id: 'svc-photo',   name: 'Photographers Wireless Camera',      color: '#64748b', bandIds: ['photo'] },
];

// ─── Venues & requests ───────────────────────────────────────────────────────
// Bandwidth (displayed):
//   Mics & IEM   → 0.2 MHz (200 kHz) — Tables 6 & 7 max per channel
//   Audio Intercom → 0.2 MHz displayed; actual PLMR ch = 12.5 kHz (Table 4)
//   PLMR         → 0.2 MHz displayed; actual = 12.5 kHz (Table 2)
//   Camera       → 8.0 MHz per L-Band channel (Table 5)
//   Telemetry    → 0.025 MHz (25 kHz) — typical data channel (Table 3)
//   Photo trigger → 0.1 MHz (100 kHz) — ISM trigger device (§3.11)
// Duplex offset for Audio Intercom: 5 MHz (§3.1.3, UHF PLMR)
// ─────────────────────────────────────────────────────────────────────────────
export const venues: Venue[] = [
  {
    id: 'opening-ceremony',
    name: 'Opening Ceremony',
    requests: [
      // §3.5 Wireless Mics — Shure/Sennheiser digital UHF, 200 kHz, 50 mW
      { id: 'oc-wmic-01', label: 'MIC-01', device: 'Shure Axient Digital AXT200',    bandwidthMHz: 0.2,   priority: 'high',   color: '#1d4ed8', serviceId: 'svc-wmic' },
      { id: 'oc-wmic-02', label: 'MIC-02', device: 'Shure Axient Digital AXT200',    bandwidthMHz: 0.2,   priority: 'high',   color: '#2563eb', serviceId: 'svc-wmic' },
      { id: 'oc-wmic-03', label: 'MIC-03', device: 'Sennheiser Digital 6000',        bandwidthMHz: 0.2,   priority: 'high',   color: '#3b82f6', serviceId: 'svc-wmic' },
      { id: 'oc-wmic-04', label: 'MIC-04', device: 'Sennheiser Digital 6000',        bandwidthMHz: 0.2,   priority: 'medium', color: '#60a5fa', serviceId: 'svc-wmic' },
      // §3.6 IEM — 200 kHz, 50 mW
      { id: 'oc-iem-01',  label: 'IEM-01', device: 'Shure PSM1000',                  bandwidthMHz: 0.2,   priority: 'high',   color: '#6d28d9', serviceId: 'svc-iem' },
      { id: 'oc-iem-02',  label: 'IEM-02', device: 'Shure PSM1000',                  bandwidthMHz: 0.2,   priority: 'high',   color: '#7c3aed', serviceId: 'svc-iem' },
      { id: 'oc-iem-03',  label: 'IEM-03', device: 'Sennheiser SR 2050 IEM',         bandwidthMHz: 0.2,   priority: 'medium', color: '#8b5cf6', serviceId: 'svc-iem' },
      // §3.3 Audio Intercom — full duplex, 5 MHz UHF offset (§3.1.3), 450–456 MHz
      { id: 'oc-com-01',  label: 'COM-01', device: 'Riedel Artist 32 (PLMR)',        bandwidthMHz: 0.2,   priority: 'high',   color: '#047857', serviceId: 'svc-intercom', duplexOffsetMHz: 5 },
      { id: 'oc-com-02',  label: 'COM-02', device: 'Clear-Com FreeSpeak Edge',       bandwidthMHz: 0.2,   priority: 'high',   color: '#059669', serviceId: 'svc-intercom', duplexOffsetMHz: 5 },
      // §3.1 PLMR — simplex handheld radios, 456–470 MHz
      { id: 'oc-plmr-01', label: 'PMR-01', device: 'Motorola MOTOTRBO SL300',        bandwidthMHz: 0.2,   priority: 'medium', color: '#15803d', serviceId: 'svc-plmr' },
      { id: 'oc-plmr-02', label: 'PMR-02', device: 'Motorola MOTOTRBO SL300',        bandwidthMHz: 0.2,   priority: 'medium', color: '#16a34a', serviceId: 'svc-plmr' },
      // §3.4 Wireless Camera — L-Band, 8 MHz/ch, 500 mW ERP (Table 5)
      { id: 'oc-cam-01',  label: 'CAM-01', device: 'Vislink HCAM-S L-Band',          bandwidthMHz: 8.0,   priority: 'high',   color: '#b45309', serviceId: 'svc-cam' },
      { id: 'oc-cam-02',  label: 'CAM-02', device: 'Vislink HCAM-S L-Band',          bandwidthMHz: 8.0,   priority: 'medium', color: '#d97706', serviceId: 'svc-cam' },
    ],
  },
  {
    id: 'athletics',
    name: 'Athletics (FOP)',
    requests: [
      // §3.5 Wireless Mics
      { id: 'ath-wmic-01', label: 'MIC-01', device: 'Shure Axient Digital AXT200',   bandwidthMHz: 0.2,   priority: 'high',   color: '#1e40af', serviceId: 'svc-wmic' },
      { id: 'ath-wmic-02', label: 'MIC-02', device: 'Sennheiser Digital 6000',       bandwidthMHz: 0.2,   priority: 'medium', color: '#3b82f6', serviceId: 'svc-wmic' },
      { id: 'ath-wmic-03', label: 'MIC-03', device: 'Sennheiser EW-DX (UHF)',        bandwidthMHz: 0.2,   priority: 'low',    color: '#93c5fd', serviceId: 'svc-wmic' },
      // §3.6 IEM
      { id: 'ath-iem-01',  label: 'IEM-01', device: 'Shure PSM1000',                 bandwidthMHz: 0.2,   priority: 'high',   color: '#a78bfa', serviceId: 'svc-iem' },
      { id: 'ath-iem-02',  label: 'IEM-02', device: 'Sennheiser SR 2050 IEM',        bandwidthMHz: 0.2,   priority: 'medium', color: '#c4b5fd', serviceId: 'svc-iem' },
      // §3.3 Audio Intercom
      { id: 'ath-com-01',  label: 'COM-01', device: 'Riedel Artist 32 (PLMR)',       bandwidthMHz: 0.2,   priority: 'high',   color: '#065f46', serviceId: 'svc-intercom', duplexOffsetMHz: 5 },
      // §3.1 PLMR
      { id: 'ath-plmr-01', label: 'PMR-01', device: 'Kenwood ProTalk TK-3501',       bandwidthMHz: 0.2,   priority: 'medium', color: '#22c55e', serviceId: 'svc-plmr' },
      { id: 'ath-plmr-02', label: 'PMR-02', device: 'Kenwood ProTalk TK-3501',       bandwidthMHz: 0.2,   priority: 'low',    color: '#4ade80', serviceId: 'svc-plmr' },
      // §3.2 Telemetry — timing/scoring + camera control (Table 3: 403–420 MHz)
      { id: 'ath-tel-01',  label: 'TEL-01', device: 'Omega Timing System (FSK data)',bandwidthMHz: 0.025, priority: 'high',   color: '#0e7490', serviceId: 'svc-telem' },
      { id: 'ath-tel-02',  label: 'TEL-02', device: 'RF Camera Control Head',        bandwidthMHz: 0.025, priority: 'medium', color: '#0891b2', serviceId: 'svc-telem' },
      // §3.4 Wireless Camera
      { id: 'ath-cam-01',  label: 'CAM-01', device: 'Vislink HCAM-S L-Band',         bandwidthMHz: 8.0,   priority: 'high',   color: '#f59e0b', serviceId: 'svc-cam' },
    ],
  },
  {
    id: 'ibc-media',
    name: 'IBC / Media',
    requests: [
      // §3.5 Wireless Mics
      { id: 'ibc-wmic-01', label: 'MIC-01', device: 'Shure Axient Digital AXT200',   bandwidthMHz: 0.2,   priority: 'medium', color: '#2563eb', serviceId: 'svc-wmic' },
      { id: 'ibc-wmic-02', label: 'MIC-02', device: 'Sony DWX Series (UHF)',          bandwidthMHz: 0.2,   priority: 'low',    color: '#93c5fd', serviceId: 'svc-wmic' },
      // §3.6 IEM
      { id: 'ibc-iem-01',  label: 'IEM-01', device: 'Shure PSM900',                  bandwidthMHz: 0.2,   priority: 'medium', color: '#9333ea', serviceId: 'svc-iem' },
      // §3.1 PLMR
      { id: 'ibc-plmr-01', label: 'PMR-01', device: 'Motorola MOTOTRBO SL300',       bandwidthMHz: 0.2,   priority: 'low',    color: '#86efac', serviceId: 'svc-plmr' },
      // §3.2 Telemetry — camera control
      { id: 'ibc-tel-01',  label: 'TEL-01', device: 'RF Camera Control Head',        bandwidthMHz: 0.025, priority: 'medium', color: '#22d3ee', serviceId: 'svc-telem' },
      // §3.4 Wireless Camera
      { id: 'ibc-cam-01',  label: 'CAM-01', device: 'Grass Valley LDX 135 (Exlink)', bandwidthMHz: 8.0,   priority: 'high',   color: '#fbbf24', serviceId: 'svc-cam' },
      // §3.11 Photographers Camera — 340–360 MHz pocket wizard triggers
      { id: 'ibc-ph-01',   label: 'PHO-01', device: 'Pocket Wizard MultiMAX II',     bandwidthMHz: 0.1,   priority: 'low',    color: '#94a3b8', serviceId: 'svc-photo' },
      { id: 'ibc-ph-02',   label: 'PHO-02', device: 'Pocket Wizard MultiMAX II',     bandwidthMHz: 0.1,   priority: 'low',    color: '#64748b', serviceId: 'svc-photo' },
    ],
  },
];

export const allRequests = venues.flatMap(v => v.requests);
