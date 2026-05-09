import type { FrequencyBand, Service, Venue } from './types';

// ─── Bands — one per LA28 §3.x service ───────────────────────────────────────
// All ranges and channel widths sourced from LA28 Spectrum Availability Plan
// v1.1 (2025-10-22). Wide primary bands (470–608 MHz for Mics/IEM) are split
// into adjacent 30 MHz sub-zones so 200 kHz allocations remain visible.
// ─────────────────────────────────────────────────────────────────────────────
export const initialBands: FrequencyBand[] = [
  // §3.12 Other Services — FM band for audio-description / mass-cast (§3.12.1)
  { id: 'fm-other',   name: 'FM / Mass Cast',        startMHz: 87.5,  endMHz: 108,   color: '#94a3b8' },
  // §3.11 Photographers — 344–354 MHz pocket-wizard triggers (Table 3 / §3.11)
  { id: 'photo',      name: 'Photo Triggers',         startMHz: 340,   endMHz: 360,   color: '#64748b' },
  // §3.2 Telemetry — 403–420 MHz RF camera control & data (Table 3)
  { id: 'telem',      name: 'Telemetry',               startMHz: 403,   endMHz: 420,   color: '#0891b2' },
  // §3.3 Audio Intercom — 450–456 MHz PLMR talkback sub-range (Table 4)
  //   Full duplex, 5 MHz UHF spacing (§3.1.3): TX 450–450.8, RX 455–455.8
  { id: 'intercom',   name: 'Audio Intercom',          startMHz: 450,   endMHz: 456,   color: '#10b981' },
  // §3.1 PLMR — 456–470 MHz LMR production simplex (Table 2)
  { id: 'plmr',       name: 'PLMR',                    startMHz: 456,   endMHz: 470,   color: '#16a34a' },
  // §3.5 Wireless Mics — lower zone of 470–608 MHz primary band (Table 6)
  { id: 'uhf-mic',    name: 'Wireless Mics',           startMHz: 470,   endMHz: 500,   color: '#3b82f6' },
  // §3.6 IEM — upper zone of 470–608 MHz primary band (Table 7)
  { id: 'uhf-iem',    name: 'IEM',                     startMHz: 500,   endMHz: 530,   color: '#8b5cf6' },
  // §3.4 Wireless Camera — 1425–1535 MHz L-Band (Table 5); 1 MHz snap per §3.4.1
  { id: 'l-band-cam', name: 'L-Band Camera',           startMHz: 1452,  endMHz: 1492,  color: '#f59e0b', snapMHz: 1.0 },
  // §3.7 Earth Stations — L-Band Space-to-Earth 1525–1559 MHz (Table 8)
  { id: 'sat-l',      name: 'Satellite L-Band',        startMHz: 1525,  endMHz: 1559,  color: '#e879f9', snapMHz: 1.0 },
  // §3.10 WLAN — 5150–5850 MHz (5 GHz bands, Table 11); 20 MHz channel snap
  { id: 'wlan-5g',    name: 'WLAN (5 GHz)',            startMHz: 5150,  endMHz: 5850,  color: '#6366f1', snapMHz: 20.0 },
  // §3.8 Microwave Mobile Links — 6425–6875 MHz (Table 9); 7 MHz channel snap
  { id: 'mw-link',    name: 'Microwave Links',         startMHz: 6425,  endMHz: 6875,  color: '#f43f5e', snapMHz: 7.0 },
  // §3.9 Fixed PtP — 10.7–11.7 GHz (Table 10); 28 MHz channel snap
  { id: 'ptp-11g',    name: 'Fixed PtP',               startMHz: 10700, endMHz: 11700, color: '#ef4444', snapMHz: 28.0 },
];

// ─── Services — LA28 §3.1 – §3.12 ────────────────────────────────────────────
export const services: Service[] = [
  { id: 'svc-plmr',    name: '3.1  Private Land Mobile Radio (PLMR)',         color: '#16a34a', bandIds: ['plmr'] },
  { id: 'svc-telem',   name: '3.2  Telemetry and Telecommand',                 color: '#0891b2', bandIds: ['telem'] },
  { id: 'svc-intercom',name: '3.3  Audio Intercommunication System',           color: '#10b981', bandIds: ['intercom'] },
  { id: 'svc-cam',     name: '3.4  Wireless Video Camera',                     color: '#f59e0b', bandIds: ['l-band-cam'] },
  { id: 'svc-wmic',    name: '3.5  Wireless Microphones',                      color: '#3b82f6', bandIds: ['uhf-mic'] },
  { id: 'svc-iem',     name: '3.6  In-Ear Monitors (IEM)',                     color: '#8b5cf6', bandIds: ['uhf-iem'] },
  { id: 'svc-earth',   name: '3.7  Permanent & Transportable Earth Stations',  color: '#e879f9', bandIds: ['sat-l'] },
  { id: 'svc-mmlink',  name: '3.8  Microwave Mobile Links',                    color: '#f43f5e', bandIds: ['mw-link'] },
  { id: 'svc-ptp',     name: '3.9  Fixed Point to Point Link',                 color: '#ef4444', bandIds: ['ptp-11g'] },
  { id: 'svc-wlan',    name: '3.10 Wireless LAN',                              color: '#6366f1', bandIds: ['wlan-5g'] },
  { id: 'svc-photo',   name: '3.11 Photographers Wireless Camera',             color: '#64748b', bandIds: ['photo'] },
  { id: 'svc-other',   name: '3.12 Other Services',                            color: '#94a3b8', bandIds: ['fm-other'] },
];

// ─── Venues & requests ───────────────────────────────────────────────────────
// Channel bandwidths (displayed):
//   §3.5 Mics & §3.6 IEM     → 0.200 MHz (200 kHz, Tables 6 & 7)
//   §3.3 Audio Intercom       → 0.200 MHz displayed (actual PLMR = 12.5 kHz)
//   §3.1 PLMR                 → 0.200 MHz displayed (actual = 12.5 kHz, Table 2)
//   §3.2 Telemetry            → 0.025 MHz (25 kHz FSK data, Table 3)
//   §3.11 Photo triggers      → 0.100 MHz (100 kHz, ISM trigger devices, §3.11)
//   §3.4 Wireless Camera      → 8.000 MHz per L-Band channel (Table 5)
//   §3.7 Earth Stations       → 3.000 MHz (typical L-Band transponder, Table 8)
//   §3.8 Microwave Links      → 28.00 MHz (typical SDH channel, Table 9)
//   §3.9 Fixed PtP            → 28.00 MHz (Table 10)
//   §3.10 WLAN                → 80.00 MHz (WiFi 6 wide channel, Table 11)
//   §3.12 Other / FM          → 0.200 MHz (200 kHz FM channel, §3.12.1)
//
// duplexOffsetMHz for §3.3 Audio Intercom: 5 MHz (§3.1.3 UHF PLMR spacing)
// ─────────────────────────────────────────────────────────────────────────────
export const venues: Venue[] = [
  {
    id: 'opening-ceremony',
    name: 'Opening Ceremony',
    requests: [
      // §3.5 Wireless Mics
      { id: 'oc-mic-01', label: 'MIC-01', device: 'Shure Axient Digital AXT200',     bandwidthMHz: 0.2,  priority: 'high',   color: '#1d4ed8', serviceId: 'svc-wmic' },
      { id: 'oc-mic-02', label: 'MIC-02', device: 'Shure Axient Digital AXT200',     bandwidthMHz: 0.2,  priority: 'high',   color: '#2563eb', serviceId: 'svc-wmic' },
      { id: 'oc-mic-03', label: 'MIC-03', device: 'Sennheiser Digital 6000',         bandwidthMHz: 0.2,  priority: 'high',   color: '#3b82f6', serviceId: 'svc-wmic' },
      { id: 'oc-mic-04', label: 'MIC-04', device: 'Sennheiser Digital 6000',         bandwidthMHz: 0.2,  priority: 'medium', color: '#60a5fa', serviceId: 'svc-wmic' },
      // §3.6 IEM
      { id: 'oc-iem-01', label: 'IEM-01', device: 'Shure PSM1000',                   bandwidthMHz: 0.2,  priority: 'high',   color: '#6d28d9', serviceId: 'svc-iem' },
      { id: 'oc-iem-02', label: 'IEM-02', device: 'Shure PSM1000',                   bandwidthMHz: 0.2,  priority: 'high',   color: '#7c3aed', serviceId: 'svc-iem' },
      { id: 'oc-iem-03', label: 'IEM-03', device: 'Sennheiser SR 2050 IEM',          bandwidthMHz: 0.2,  priority: 'medium', color: '#8b5cf6', serviceId: 'svc-iem' },
      // §3.3 Audio Intercom — 5 MHz duplex (§3.1.3)
      { id: 'oc-com-01', label: 'COM-01', device: 'Riedel Artist 32 (PLMR)',         bandwidthMHz: 0.2,  priority: 'high',   color: '#047857', serviceId: 'svc-intercom', duplexOffsetMHz: 5 },
      { id: 'oc-com-02', label: 'COM-02', device: 'Clear-Com FreeSpeak Edge',        bandwidthMHz: 0.2,  priority: 'high',   color: '#059669', serviceId: 'svc-intercom', duplexOffsetMHz: 5 },
      // §3.1 PLMR — simplex handheld radios
      { id: 'oc-pmr-01', label: 'PMR-01', device: 'Motorola MOTOTRBO SL300',         bandwidthMHz: 0.2,  priority: 'medium', color: '#15803d', serviceId: 'svc-plmr' },
      { id: 'oc-pmr-02', label: 'PMR-02', device: 'Motorola MOTOTRBO SL300',         bandwidthMHz: 0.2,  priority: 'medium', color: '#16a34a', serviceId: 'svc-plmr' },
      // §3.4 Wireless Camera — L-Band, 8 MHz/channel
      { id: 'oc-cam-01', label: 'CAM-01', device: 'Vislink HCAM-S L-Band',           bandwidthMHz: 8.0,  priority: 'high',   color: '#b45309', serviceId: 'svc-cam' },
      { id: 'oc-cam-02', label: 'CAM-02', device: 'Vislink HCAM-S L-Band',           bandwidthMHz: 8.0,  priority: 'medium', color: '#d97706', serviceId: 'svc-cam' },
      // §3.7 Earth Stations — L-Band satellite downlink (Table 8)
      { id: 'oc-sat-01', label: 'SAT-01', device: 'Comtech SNG Uplink Terminal',     bandwidthMHz: 3.0,  priority: 'high',   color: '#c026d3', serviceId: 'svc-earth' },
      // §3.8 Microwave Mobile Links — OB van to stadium
      { id: 'oc-mwl-01', label: 'MWL-01', device: 'Ericsson MINI-LINK 6352 (OB van)', bandwidthMHz: 28.0, priority: 'high',  color: '#be123c', serviceId: 'svc-mmlink' },
      // §3.10 WLAN — production access point
      { id: 'oc-wlan-01', label: 'AP-01', device: 'Cisco Catalyst 9136 (5 GHz)',     bandwidthMHz: 80.0, priority: 'medium', color: '#4f46e5', serviceId: 'svc-wlan' },
      // §3.12 Other — FM mass-cast transmitter for audience (§3.12.1)
      { id: 'oc-fm-01', label: 'FM-01', device: 'LP-100 Low Power FM Transmitter',   bandwidthMHz: 0.2,  priority: 'low',    color: '#6b7280', serviceId: 'svc-other' },
    ],
  },
  {
    id: 'athletics',
    name: 'Athletics (FOP)',
    requests: [
      // §3.5 Wireless Mics
      { id: 'ath-mic-01', label: 'MIC-01', device: 'Shure Axient Digital AXT200',   bandwidthMHz: 0.2,  priority: 'high',   color: '#1e40af', serviceId: 'svc-wmic' },
      { id: 'ath-mic-02', label: 'MIC-02', device: 'Sennheiser Digital 6000',       bandwidthMHz: 0.2,  priority: 'medium', color: '#3b82f6', serviceId: 'svc-wmic' },
      { id: 'ath-mic-03', label: 'MIC-03', device: 'Sennheiser EW-DX (UHF)',        bandwidthMHz: 0.2,  priority: 'low',    color: '#93c5fd', serviceId: 'svc-wmic' },
      // §3.6 IEM
      { id: 'ath-iem-01', label: 'IEM-01', device: 'Shure PSM1000',                 bandwidthMHz: 0.2,  priority: 'high',   color: '#a78bfa', serviceId: 'svc-iem' },
      { id: 'ath-iem-02', label: 'IEM-02', device: 'Sennheiser SR 2050 IEM',        bandwidthMHz: 0.2,  priority: 'medium', color: '#c4b5fd', serviceId: 'svc-iem' },
      // §3.3 Audio Intercom
      { id: 'ath-com-01', label: 'COM-01', device: 'Riedel Artist 32 (PLMR)',       bandwidthMHz: 0.2,  priority: 'high',   color: '#065f46', serviceId: 'svc-intercom', duplexOffsetMHz: 5 },
      { id: 'ath-com-02', label: 'COM-02', device: 'Clear-Com FreeSpeak Edge',      bandwidthMHz: 0.2,  priority: 'medium', color: '#10b981', serviceId: 'svc-intercom', duplexOffsetMHz: 5 },
      // §3.1 PLMR
      { id: 'ath-pmr-01', label: 'PMR-01', device: 'Kenwood ProTalk TK-3501',       bandwidthMHz: 0.2,  priority: 'medium', color: '#22c55e', serviceId: 'svc-plmr' },
      { id: 'ath-pmr-02', label: 'PMR-02', device: 'Kenwood ProTalk TK-3501',       bandwidthMHz: 0.2,  priority: 'low',    color: '#4ade80', serviceId: 'svc-plmr' },
      // §3.2 Telemetry — timing/scoring (Omega) + camera control (Table 3)
      { id: 'ath-tel-01', label: 'TEL-01', device: 'Omega Timing Transponder',      bandwidthMHz: 0.025, priority: 'high',  color: '#0e7490', serviceId: 'svc-telem' },
      { id: 'ath-tel-02', label: 'TEL-02', device: 'RF Camera Control Head',        bandwidthMHz: 0.025, priority: 'medium', color: '#0891b2', serviceId: 'svc-telem' },
      { id: 'ath-tel-03', label: 'TEL-03', device: 'RF Camera Control Head',        bandwidthMHz: 0.025, priority: 'medium', color: '#22d3ee', serviceId: 'svc-telem' },
      // §3.4 Wireless Camera
      { id: 'ath-cam-01', label: 'CAM-01', device: 'Vislink HCAM-S L-Band',         bandwidthMHz: 8.0,  priority: 'high',   color: '#f59e0b', serviceId: 'svc-cam' },
      { id: 'ath-cam-02', label: 'CAM-02', device: 'Vislink HCAM-S L-Band',         bandwidthMHz: 8.0,  priority: 'medium', color: '#fbbf24', serviceId: 'svc-cam' },
      // §3.7 Earth Stations
      { id: 'ath-sat-01', label: 'SAT-01', device: 'Globecomm Transportable VSAT',  bandwidthMHz: 3.0,  priority: 'high',   color: '#a855f7', serviceId: 'svc-earth' },
      // §3.9 Fixed PtP — timing-data backbone to IBC
      { id: 'ath-ptp-01', label: 'PTP-01', device: 'Ericsson MINI-LINK (Venue→IBC)', bandwidthMHz: 28.0, priority: 'high',  color: '#dc2626', serviceId: 'svc-ptp' },
      // §3.10 WLAN
      { id: 'ath-wlan-01', label: 'AP-01', device: 'Cisco Catalyst 9136 (5 GHz)',   bandwidthMHz: 80.0, priority: 'medium', color: '#818cf8', serviceId: 'svc-wlan' },
      // §3.11 Photographers Camera
      { id: 'ath-ph-01', label: 'PHO-01', device: 'Pocket Wizard MultiMAX II',      bandwidthMHz: 0.1,  priority: 'low',    color: '#94a3b8', serviceId: 'svc-photo' },
      { id: 'ath-ph-02', label: 'PHO-02', device: 'Pocket Wizard MultiMAX II',      bandwidthMHz: 0.1,  priority: 'low',    color: '#64748b', serviceId: 'svc-photo' },
    ],
  },
  {
    id: 'ibc-media',
    name: 'IBC / Media',
    requests: [
      // §3.5 Wireless Mics
      { id: 'ibc-mic-01', label: 'MIC-01', device: 'Shure Axient Digital AXT200',   bandwidthMHz: 0.2,  priority: 'medium', color: '#2563eb', serviceId: 'svc-wmic' },
      { id: 'ibc-mic-02', label: 'MIC-02', device: 'Sony DWX Series (UHF)',          bandwidthMHz: 0.2,  priority: 'low',    color: '#93c5fd', serviceId: 'svc-wmic' },
      // §3.6 IEM
      { id: 'ibc-iem-01', label: 'IEM-01', device: 'Shure PSM900',                  bandwidthMHz: 0.2,  priority: 'medium', color: '#9333ea', serviceId: 'svc-iem' },
      // §3.3 Audio Intercom
      { id: 'ibc-com-01', label: 'COM-01', device: 'Riedel Artist 32 (PLMR)',       bandwidthMHz: 0.2,  priority: 'medium', color: '#047857', serviceId: 'svc-intercom', duplexOffsetMHz: 5 },
      // §3.1 PLMR
      { id: 'ibc-pmr-01', label: 'PMR-01', device: 'Motorola MOTOTRBO SL300',       bandwidthMHz: 0.2,  priority: 'low',    color: '#86efac', serviceId: 'svc-plmr' },
      // §3.2 Telemetry
      { id: 'ibc-tel-01', label: 'TEL-01', device: 'RF Camera Control Head',        bandwidthMHz: 0.025, priority: 'medium', color: '#22d3ee', serviceId: 'svc-telem' },
      // §3.4 Wireless Camera
      { id: 'ibc-cam-01', label: 'CAM-01', device: 'Grass Valley LDX 135 (Exlink)', bandwidthMHz: 8.0,  priority: 'high',   color: '#d97706', serviceId: 'svc-cam' },
      // §3.7 Earth Stations — permanent SNG farm at IBC
      { id: 'ibc-sat-01', label: 'SAT-01', device: 'Comtech SNG Uplink Terminal',   bandwidthMHz: 3.0,  priority: 'high',   color: '#c026d3', serviceId: 'svc-earth' },
      { id: 'ibc-sat-02', label: 'SAT-02', device: 'Globecomm Transportable VSAT',  bandwidthMHz: 3.0,  priority: 'medium', color: '#d946ef', serviceId: 'svc-earth' },
      // §3.8 Microwave Mobile Links — IBC to broadcast centre
      { id: 'ibc-mwl-01', label: 'MWL-01', device: 'Nokia Wavence (Studio Link)',   bandwidthMHz: 28.0, priority: 'high',   color: '#f43f5e', serviceId: 'svc-mmlink' },
      // §3.9 Fixed PtP — IBC backbone
      { id: 'ibc-ptp-01', label: 'PTP-01', device: 'Ericsson MINI-LINK 6352',       bandwidthMHz: 28.0, priority: 'high',   color: '#dc2626', serviceId: 'svc-ptp' },
      // §3.10 WLAN
      { id: 'ibc-wlan-01', label: 'AP-01', device: 'Cisco Catalyst 9136 (5 GHz)',   bandwidthMHz: 80.0, priority: 'medium', color: '#6366f1', serviceId: 'svc-wlan' },
      { id: 'ibc-wlan-02', label: 'AP-02', device: 'Ruckus R750 (5 GHz)',           bandwidthMHz: 80.0, priority: 'low',    color: '#818cf8', serviceId: 'svc-wlan' },
      // §3.11 Photographers Camera
      { id: 'ibc-ph-01', label: 'PHO-01', device: 'Pocket Wizard MultiMAX II',      bandwidthMHz: 0.1,  priority: 'low',    color: '#94a3b8', serviceId: 'svc-photo' },
      // §3.12 Other — FM mass-cast
      { id: 'ibc-fm-01', label: 'FM-01', device: 'LP-100 Low Power FM Transmitter', bandwidthMHz: 0.2,  priority: 'low',    color: '#6b7280', serviceId: 'svc-other' },
    ],
  },
];

export const allRequests = venues.flatMap(v => v.requests);
