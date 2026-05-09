import type { FrequencyBand, Service, Venue } from './types';

// ─── Venue × Service color matrix ─────────────────────────────────────────────
// Dark shades = Opening Ceremony, medium = Athletics, light = IBC/Media.
// White label text is readable on all values chosen (L ≤ 58% in HSL).
// ─────────────────────────────────────────────────────────────────────────────
const VENUE_SERVICE_COLOR: Record<string, Record<string, string>> = {
  'opening-ceremony': {
    'svc-plmr':    '#15803d', 'svc-telem':   '#0e7490', 'svc-intercom': '#065f46',
    'svc-cam':     '#b45309', 'svc-wmic':    '#1e40af', 'svc-iem':      '#6d28d9',
    'svc-earth':   '#86198f', 'svc-mmlink':  '#be123c', 'svc-ptp':      '#7f1d1d',
    'svc-wlan':    '#3730a3', 'svc-photo':   '#334155', 'svc-other':    '#374151',
  },
  'athletics': {
    'svc-plmr':    '#16a34a', 'svc-telem':   '#0891b2', 'svc-intercom': '#059669',
    'svc-cam':     '#d97706', 'svc-wmic':    '#2563eb', 'svc-iem':      '#7c3aed',
    'svc-earth':   '#c026d3', 'svc-mmlink':  '#e11d48', 'svc-ptp':      '#b91c1c',
    'svc-wlan':    '#4338ca', 'svc-photo':   '#475569', 'svc-other':    '#6b7280',
  },
  'ibc-media': {
    'svc-plmr':    '#22c55e', 'svc-telem':   '#06b6d4', 'svc-intercom': '#10b981',
    'svc-cam':     '#f59e0b', 'svc-wmic':    '#3b82f6', 'svc-iem':      '#8b5cf6',
    'svc-earth':   '#d946ef', 'svc-mmlink':  '#f43f5e', 'svc-ptp':      '#ef4444',
    'svc-wlan':    '#6366f1', 'svc-photo':   '#64748b', 'svc-other':    '#94a3b8',
  },
};

export function getRequestColor(venueId: string, serviceId: string): string {
  return VENUE_SERVICE_COLOR[venueId]?.[serviceId] ?? '#94a3b8';
}

// ─── Frequency bands ─────────────────────────────────────────────────────────
// Sourced from LA28 Spectrum Availability Plan v1.1 (2025-10-22).
// Bands are non-overlapping, ordered by frequency.
// ─────────────────────────────────────────────────────────────────────────────
export const initialBands: FrequencyBand[] = [
  // §3.1 PLMR Table 1 — VHF Low
  { id: 'vhf-low',  name: 'VHF Low (72–76 MHz)',        startMHz: 72,    endMHz: 76,    color: '#166534' },
  // §3.12 Other Services — FM/Mass Cast
  { id: 'fm-other', name: 'FM / Mass Cast',               startMHz: 87.5,  endMHz: 108,   color: '#94a3b8' },
  // §3.1 PLMR Table 1 — VHF High (137–174 MHz, excl. maritime 150–150.8)
  { id: 'vhf-hi',   name: 'VHF High (137–174 MHz)',      startMHz: 137,   endMHz: 174,   color: '#15803d' },
  // §3.5/3.6 Mics & IEM Table 6/7 — VHF band (174–216 MHz)
  { id: 'vhf-mics', name: 'VHF Mics / IEM (174–216 MHz)', startMHz: 174,  endMHz: 216,   color: '#1d4ed8' },
  // §3.11 Photographers / §3.2 Telemetry Table 3 — 340–360 MHz
  { id: 'photo',    name: 'Photo Triggers (340–360 MHz)', startMHz: 340,   endMHz: 360,   color: '#475569' },
  // §3.2 Telemetry Table 3 — RF camera control (403–420 MHz)
  { id: 'telem',    name: 'Telemetry (403–420 MHz)',      startMHz: 403,   endMHz: 420,   color: '#0891b2' },
  // §3.1 PLMR Table 2 + §3.3 Intercom Table 4 — UHF production (420–470 MHz)
  { id: 'uhf-prod', name: 'UHF Prod (420–470 MHz)',       startMHz: 420,   endMHz: 470,   color: '#166534' },
  // §3.5/3.6 Mics & IEM Table 6/7 — primary UHF band (470–608 MHz)
  { id: 'uhf-mics', name: 'UHF Mics / IEM (470–608 MHz)', startMHz: 470,  endMHz: 608,   color: '#2563eb' },
  // §3.4 Wireless Video Camera Table 5 — L-Band (1425–1525 MHz; 1 MHz step)
  { id: 'l-band-cam', name: 'WVC L-Band (1425–1525 MHz)', startMHz: 1425, endMHz: 1525,  color: '#b45309', snapMHz: 1.0 },
  // §3.7 Earth Stations Table 8 — L-Band Space→Earth (1525–1559 MHz)
  { id: 'sat-l',    name: 'Satellite L-Band (1525–1559)', startMHz: 1525,  endMHz: 1559,  color: '#a21caf', snapMHz: 1.0 },
  // §3.3 Intercom Table 4 — DECT belt-packs (1920–1930 MHz)
  { id: 'dect',     name: 'DECT (1920–1930 MHz)',          startMHz: 1920,  endMHz: 1930,  color: '#0f766e' },
  // §3.10 WLAN Table 11 — 2.4 GHz (2400–2483.5 MHz; 20 MHz channels)
  { id: 'wlan-24',  name: 'WLAN (2.4 GHz)',                startMHz: 2400,  endMHz: 2484,  color: '#4338ca', snapMHz: 20.0 },
  // §3.10 WLAN Table 11 — 5 GHz (5150–5850 MHz; 20 MHz channels)
  { id: 'wlan-5g',  name: 'WLAN (5 GHz)',                  startMHz: 5150,  endMHz: 5850,  color: '#4f46e5', snapMHz: 20.0 },
  // §3.10 WLAN Table 11 — 6 GHz (5925–6425 MHz; 20 MHz channels)
  { id: 'wlan-6g',  name: 'WLAN (6 GHz)',                  startMHz: 5925,  endMHz: 6425,  color: '#6366f1', snapMHz: 20.0 },
  // §3.8 Microwave Mobile Links Table 9 — 6.425–6.875 GHz (7 MHz chan)
  { id: 'mw-link',  name: 'Microwave Links (6.4–6.9 GHz)', startMHz: 6425,  endMHz: 6875,  color: '#e11d48', snapMHz: 7.0 },
  // §3.9 Fixed PtP Table 10 + §3.8 Table 9 — 10.7–11.7 GHz (28 MHz chan)
  { id: 'ptp-11g',  name: 'Fixed PtP (10.7–11.7 GHz)',     startMHz: 10700, endMHz: 11700, color: '#b91c1c', snapMHz: 28.0 },
];

// ─── Services — LA28 §3.1 – §3.12 ────────────────────────────────────────────
// bandIds lists the frequency bands available for each service per PDF tables.
// Multiple services may reference the same band (physical band is shared).
// ─────────────────────────────────────────────────────────────────────────────
export const services: Service[] = [
  // §3.1 Tables 1 (VHF) + 2 (UHF)
  { id: 'svc-plmr',    name: '3.1  Private Land Mobile Radio (PLMR)',         color: '#15803d', bandIds: ['vhf-low', 'vhf-hi', 'uhf-prod'] },
  // §3.2 Table 3 — primary bands: 340–354 MHz (pocket wizards) + 403–420 MHz
  { id: 'svc-telem',   name: '3.2  Telemetry and Telecommand',                 color: '#0891b2', bandIds: ['photo', 'telem'] },
  // §3.3 Table 4 — VHF + UHF PLMR bands + DECT
  { id: 'svc-intercom',name: '3.3  Audio Intercommunication System',           color: '#059669', bandIds: ['vhf-low', 'vhf-hi', 'uhf-prod', 'dect'] },
  // §3.4 Table 5 — L-Band primary
  { id: 'svc-cam',     name: '3.4  Wireless Video Camera',                     color: '#d97706', bandIds: ['l-band-cam'] },
  // §3.5 Table 6 — VHF + UHF
  { id: 'svc-wmic',    name: '3.5  Wireless Microphones',                      color: '#2563eb', bandIds: ['vhf-mics', 'uhf-mics'] },
  // §3.6 Table 7 — identical to Table 6
  { id: 'svc-iem',     name: '3.6  In-Ear Monitors (IEM)',                     color: '#7c3aed', bandIds: ['vhf-mics', 'uhf-mics'] },
  // §3.7 Table 8 — L-Band downlink
  { id: 'svc-earth',   name: '3.7  Permanent & Transportable Earth Stations',  color: '#a21caf', bandIds: ['sat-l'] },
  // §3.8 Table 9 — lower MW bands (simplified to two key ranges)
  { id: 'svc-mmlink',  name: '3.8  Microwave Mobile Links',                    color: '#e11d48', bandIds: ['mw-link', 'ptp-11g'] },
  // §3.9 Table 10 — fixed PtP (shares 10.7–11.7 GHz with MW Links)
  { id: 'svc-ptp',     name: '3.9  Fixed Point to Point Link',                 color: '#b91c1c', bandIds: ['mw-link', 'ptp-11g'] },
  // §3.10 Table 11 — all three frequency ranges
  { id: 'svc-wlan',    name: '3.10 Wireless LAN (2.4 / 5 / 6 GHz)',           color: '#4338ca', bandIds: ['wlan-24', 'wlan-5g', 'wlan-6g'] },
  // §3.11 — 344–354 MHz triggers (uses photo band)
  { id: 'svc-photo',   name: '3.11 Photographers Wireless Camera',             color: '#475569', bandIds: ['photo'] },
  // §3.12 — FM / Mass Cast
  { id: 'svc-other',   name: '3.12 Other Services',                            color: '#6b7280', bandIds: ['fm-other'] },
];

// ─── Venue × Service request colors (shorthand) ──────────────────────────────
const OC  = VENUE_SERVICE_COLOR['opening-ceremony'];
const ATH = VENUE_SERVICE_COLOR['athletics'];
const IBC = VENUE_SERVICE_COLOR['ibc-media'];

// ─── Venues & requests ───────────────────────────────────────────────────────
// Channel bandwidths per LA28 tables:
//   §3.5/3.6 Mics/IEM    → 0.200 MHz (Tables 6 & 7)
//   §3.3 Intercom (PLMR) → 0.200 MHz (Table 4, 12.5 kHz actual, displayed wider)
//   §3.3 Intercom (DECT) → 2.000 MHz (DECT full-duplex channel)
//   §3.1 PLMR            → 0.200 MHz (Table 2, 12.5 kHz actual)
//   §3.2 Telemetry       → 0.025 MHz (Table 3, 25 kHz FSK)
//   §3.11 Photo triggers → 0.100 MHz (Table 3, ~100 kHz triggers)
//   §3.4 WVC Camera      → 8.000 MHz (Table 5, L-Band channel)
//   §3.7 Earth Stations  → 3.000 MHz (Table 8, typical transponder)
//   §3.8 MW Links        → 28.00 MHz (Table 9, typical SDH)
//   §3.9 Fixed PtP       → 28.00 MHz (Table 10)
//   §3.10 WLAN           → 80.00 MHz (Table 11, WiFi 6 wide channel)
//   §3.12 FM             → 0.200 MHz (87.5–108 MHz FM channel)
//
// duplexOffsetMHz for §3.3 Intercom (UHF): 5 MHz (§3.1.3 UHF duplex spacing).
// VHF duplex is 4 MHz per §3.1.3 — place in vhf-hi or vhf-low accordingly.
// ─────────────────────────────────────────────────────────────────────────────
export const venues: Venue[] = [
  {
    id: 'opening-ceremony',
    name: 'Opening Ceremony',
    requests: [
      // §3.5 Wireless Mics
      { id: 'oc-mic-01', label: 'MIC-01', device: 'Shure Axient Digital AXT200',      bandwidthMHz: 0.2,   color: OC['svc-wmic'],    serviceId: 'svc-wmic' },
      { id: 'oc-mic-02', label: 'MIC-02', device: 'Shure Axient Digital AXT200',      bandwidthMHz: 0.2,   color: OC['svc-wmic'],    serviceId: 'svc-wmic' },
      { id: 'oc-mic-03', label: 'MIC-03', device: 'Sennheiser Digital 6000',           bandwidthMHz: 0.2,   color: OC['svc-wmic'],    serviceId: 'svc-wmic' },
      { id: 'oc-mic-04', label: 'MIC-04', device: 'Sennheiser Digital 6000',           bandwidthMHz: 0.2,   color: OC['svc-wmic'],    serviceId: 'svc-wmic' },
      // §3.6 IEM
      { id: 'oc-iem-01', label: 'IEM-01', device: 'Shure PSM1000',                    bandwidthMHz: 0.2,   color: OC['svc-iem'],     serviceId: 'svc-iem' },
      { id: 'oc-iem-02', label: 'IEM-02', device: 'Shure PSM1000',                    bandwidthMHz: 0.2,   color: OC['svc-iem'],     serviceId: 'svc-iem' },
      { id: 'oc-iem-03', label: 'IEM-03', device: 'Sennheiser SR 2050 IEM',           bandwidthMHz: 0.2,   color: OC['svc-iem'],     serviceId: 'svc-iem' },
      // §3.3 Audio Intercom — 5 MHz UHF duplex (§3.1.3); place in uhf-prod
      { id: 'oc-com-01', label: 'COM-01', device: 'Riedel Artist 32 (PLMR)',          bandwidthMHz: 0.2,   color: OC['svc-intercom'], serviceId: 'svc-intercom', duplexOffsetMHz: 5 },
      { id: 'oc-com-02', label: 'COM-02', device: 'Clear-Com FreeSpeak Edge',         bandwidthMHz: 0.2,   color: OC['svc-intercom'], serviceId: 'svc-intercom', duplexOffsetMHz: 5 },
      // §3.1 PLMR simplex — place in uhf-prod or vhf-hi
      { id: 'oc-pmr-01', label: 'PMR-01', device: 'Motorola MOTOTRBO SL300',          bandwidthMHz: 0.2,   color: OC['svc-plmr'],    serviceId: 'svc-plmr' },
      { id: 'oc-pmr-02', label: 'PMR-02', device: 'Motorola MOTOTRBO SL300',          bandwidthMHz: 0.2,   color: OC['svc-plmr'],    serviceId: 'svc-plmr' },
      // §3.4 Wireless Camera — L-Band, 8 MHz/channel
      { id: 'oc-cam-01', label: 'CAM-01', device: 'Vislink HCAM-S L-Band',            bandwidthMHz: 8.0,   color: OC['svc-cam'],     serviceId: 'svc-cam' },
      { id: 'oc-cam-02', label: 'CAM-02', device: 'Vislink HCAM-S L-Band',            bandwidthMHz: 8.0,   color: OC['svc-cam'],     serviceId: 'svc-cam' },
      // §3.7 Earth Stations
      { id: 'oc-sat-01', label: 'SAT-01', device: 'Comtech SNG Uplink Terminal',      bandwidthMHz: 3.0,   color: OC['svc-earth'],   serviceId: 'svc-earth' },
      // §3.8 Microwave Mobile Links
      { id: 'oc-mwl-01', label: 'MWL-01', device: 'Ericsson MINI-LINK 6352 (OB van)', bandwidthMHz: 28.0,  color: OC['svc-mmlink'],  serviceId: 'svc-mmlink' },
      // §3.10 WLAN
      { id: 'oc-wlan-01', label: 'AP-01', device: 'Cisco Catalyst 9136 (5 GHz)',      bandwidthMHz: 80.0,  color: OC['svc-wlan'],    serviceId: 'svc-wlan' },
      // §3.12 FM mass-cast
      { id: 'oc-fm-01', label: 'FM-01',  device: 'LP-100 Low Power FM Transmitter',  bandwidthMHz: 0.2,   color: OC['svc-other'],   serviceId: 'svc-other' },
    ],
  },
  {
    id: 'athletics',
    name: 'Athletics (FOP)',
    requests: [
      // §3.5 Wireless Mics
      { id: 'ath-mic-01', label: 'MIC-01', device: 'Shure Axient Digital AXT200',    bandwidthMHz: 0.2,   color: ATH['svc-wmic'],    serviceId: 'svc-wmic' },
      { id: 'ath-mic-02', label: 'MIC-02', device: 'Sennheiser Digital 6000',         bandwidthMHz: 0.2,   color: ATH['svc-wmic'],    serviceId: 'svc-wmic' },
      { id: 'ath-mic-03', label: 'MIC-03', device: 'Sennheiser EW-DX (UHF)',          bandwidthMHz: 0.2,   color: ATH['svc-wmic'],    serviceId: 'svc-wmic' },
      // §3.6 IEM
      { id: 'ath-iem-01', label: 'IEM-01', device: 'Shure PSM1000',                   bandwidthMHz: 0.2,   color: ATH['svc-iem'],     serviceId: 'svc-iem' },
      { id: 'ath-iem-02', label: 'IEM-02', device: 'Sennheiser SR 2050 IEM',          bandwidthMHz: 0.2,   color: ATH['svc-iem'],     serviceId: 'svc-iem' },
      // §3.3 Audio Intercom (UHF duplex)
      { id: 'ath-com-01', label: 'COM-01', device: 'Riedel Artist 32 (PLMR)',         bandwidthMHz: 0.2,   color: ATH['svc-intercom'], serviceId: 'svc-intercom', duplexOffsetMHz: 5 },
      { id: 'ath-com-02', label: 'COM-02', device: 'Clear-Com FreeSpeak Edge',        bandwidthMHz: 0.2,   color: ATH['svc-intercom'], serviceId: 'svc-intercom', duplexOffsetMHz: 5 },
      // §3.1 PLMR
      { id: 'ath-pmr-01', label: 'PMR-01', device: 'Kenwood ProTalk TK-3501',         bandwidthMHz: 0.2,   color: ATH['svc-plmr'],    serviceId: 'svc-plmr' },
      { id: 'ath-pmr-02', label: 'PMR-02', device: 'Kenwood ProTalk TK-3501',         bandwidthMHz: 0.2,   color: ATH['svc-plmr'],    serviceId: 'svc-plmr' },
      // §3.2 Telemetry — Omega timing + camera control
      { id: 'ath-tel-01', label: 'TEL-01', device: 'Omega Timing Transponder',        bandwidthMHz: 0.025, color: ATH['svc-telem'],   serviceId: 'svc-telem' },
      { id: 'ath-tel-02', label: 'TEL-02', device: 'RF Camera Control Head',          bandwidthMHz: 0.025, color: ATH['svc-telem'],   serviceId: 'svc-telem' },
      { id: 'ath-tel-03', label: 'TEL-03', device: 'RF Camera Control Head',          bandwidthMHz: 0.025, color: ATH['svc-telem'],   serviceId: 'svc-telem' },
      // §3.4 Wireless Camera
      { id: 'ath-cam-01', label: 'CAM-01', device: 'Vislink HCAM-S L-Band',           bandwidthMHz: 8.0,   color: ATH['svc-cam'],     serviceId: 'svc-cam' },
      { id: 'ath-cam-02', label: 'CAM-02', device: 'Vislink HCAM-S L-Band',           bandwidthMHz: 8.0,   color: ATH['svc-cam'],     serviceId: 'svc-cam' },
      // §3.7 Earth Stations
      { id: 'ath-sat-01', label: 'SAT-01', device: 'Globecomm Transportable VSAT',   bandwidthMHz: 3.0,   color: ATH['svc-earth'],   serviceId: 'svc-earth' },
      // §3.9 Fixed PtP — timing backbone to IBC
      { id: 'ath-ptp-01', label: 'PTP-01', device: 'Ericsson MINI-LINK (Venue→IBC)', bandwidthMHz: 28.0,  color: ATH['svc-ptp'],     serviceId: 'svc-ptp' },
      // §3.10 WLAN
      { id: 'ath-wlan-01', label: 'AP-01', device: 'Cisco Catalyst 9136 (5 GHz)',    bandwidthMHz: 80.0,  color: ATH['svc-wlan'],    serviceId: 'svc-wlan' },
      // §3.11 Photographers
      { id: 'ath-ph-01', label: 'PHO-01', device: 'Pocket Wizard MultiMAX II',       bandwidthMHz: 0.1,   color: ATH['svc-photo'],   serviceId: 'svc-photo' },
      { id: 'ath-ph-02', label: 'PHO-02', device: 'Pocket Wizard MultiMAX II',       bandwidthMHz: 0.1,   color: ATH['svc-photo'],   serviceId: 'svc-photo' },
    ],
  },
  {
    id: 'ibc-media',
    name: 'IBC / Media',
    requests: [
      // §3.5 Wireless Mics
      { id: 'ibc-mic-01', label: 'MIC-01', device: 'Shure Axient Digital AXT200',    bandwidthMHz: 0.2,   color: IBC['svc-wmic'],    serviceId: 'svc-wmic' },
      { id: 'ibc-mic-02', label: 'MIC-02', device: 'Sony DWX Series (UHF)',           bandwidthMHz: 0.2,   color: IBC['svc-wmic'],    serviceId: 'svc-wmic' },
      // §3.6 IEM
      { id: 'ibc-iem-01', label: 'IEM-01', device: 'Shure PSM900',                   bandwidthMHz: 0.2,   color: IBC['svc-iem'],     serviceId: 'svc-iem' },
      // §3.3 Audio Intercom (UHF duplex)
      { id: 'ibc-com-01', label: 'COM-01', device: 'Riedel Artist 32 (PLMR)',        bandwidthMHz: 0.2,   color: IBC['svc-intercom'], serviceId: 'svc-intercom', duplexOffsetMHz: 5 },
      // §3.1 PLMR
      { id: 'ibc-pmr-01', label: 'PMR-01', device: 'Motorola MOTOTRBO SL300',        bandwidthMHz: 0.2,   color: IBC['svc-plmr'],    serviceId: 'svc-plmr' },
      // §3.2 Telemetry
      { id: 'ibc-tel-01', label: 'TEL-01', device: 'RF Camera Control Head',         bandwidthMHz: 0.025, color: IBC['svc-telem'],   serviceId: 'svc-telem' },
      // §3.4 Wireless Camera
      { id: 'ibc-cam-01', label: 'CAM-01', device: 'Grass Valley LDX 135 (Exlink)',  bandwidthMHz: 8.0,   color: IBC['svc-cam'],     serviceId: 'svc-cam' },
      // §3.7 Earth Stations — permanent SNG farm at IBC
      { id: 'ibc-sat-01', label: 'SAT-01', device: 'Comtech SNG Uplink Terminal',    bandwidthMHz: 3.0,   color: IBC['svc-earth'],   serviceId: 'svc-earth' },
      { id: 'ibc-sat-02', label: 'SAT-02', device: 'Globecomm Transportable VSAT',   bandwidthMHz: 3.0,   color: IBC['svc-earth'],   serviceId: 'svc-earth' },
      // §3.8 Microwave Links
      { id: 'ibc-mwl-01', label: 'MWL-01', device: 'Nokia Wavence (Studio Link)',    bandwidthMHz: 28.0,  color: IBC['svc-mmlink'],  serviceId: 'svc-mmlink' },
      // §3.9 Fixed PtP — IBC backbone
      { id: 'ibc-ptp-01', label: 'PTP-01', device: 'Ericsson MINI-LINK 6352',        bandwidthMHz: 28.0,  color: IBC['svc-ptp'],     serviceId: 'svc-ptp' },
      // §3.10 WLAN
      { id: 'ibc-wlan-01', label: 'AP-01', device: 'Cisco Catalyst 9136 (5 GHz)',   bandwidthMHz: 80.0,  color: IBC['svc-wlan'],    serviceId: 'svc-wlan' },
      { id: 'ibc-wlan-02', label: 'AP-02', device: 'Ruckus R750 (5 GHz)',            bandwidthMHz: 80.0,  color: IBC['svc-wlan'],    serviceId: 'svc-wlan' },
      // §3.11 Photographers
      { id: 'ibc-ph-01', label: 'PHO-01', device: 'Pocket Wizard MultiMAX II',      bandwidthMHz: 0.1,   color: IBC['svc-photo'],   serviceId: 'svc-photo' },
      // §3.12 FM mass-cast
      { id: 'ibc-fm-01', label: 'FM-01',  device: 'LP-100 Low Power FM Transmitter', bandwidthMHz: 0.2,  color: IBC['svc-other'],   serviceId: 'svc-other' },
    ],
  },
];

export const allRequests = venues.flatMap(v => v.requests);
