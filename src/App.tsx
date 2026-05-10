import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import { SpectrumView } from './components/SpectrumView';
import { RequestPanel } from './components/RequestPanel';
import { ReserveDialog } from './components/ReserveDialog';
import { ConfirmDialog } from './components/ConfirmDialog';
import { loadData } from './dataLoader';
import type { AppData } from './dataLoader';
import type { Allocation, BandGridParams, CompositeRequest, DragPreview, FrequencyBand, FrequencyRequest, PendingReserve, Reservation } from './types';

const DEFAULT_SNAP_MHZ = 0.00625;

interface ConfirmState {
  title: string;
  detail: string;
  confirmLabel: string;
  onConfirm: () => void;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return !(aEnd <= bStart || aStart >= bEnd);
}

const selectStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  color: '#1e293b',
  fontSize: '13px',
  fontWeight: '600',
  padding: '5px 28px 5px 10px',
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none',
};

function ChevronDown() {
  return (
    <svg style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      width="10" height="6" viewBox="0 0 10 6" fill="none">
      <path d="M1 1l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <span style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ color: accent ? '#2563eb' : '#1e293b', fontSize: '15px', fontWeight: '700', lineHeight: 1.1 }}>{value}</span>
    </div>
  );
}

export default function App() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('all');
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeRequest, setActiveRequest] = useState<FrequencyRequest | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingReserve, setPendingReserve] = useState<PendingReserve | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const bandsRef = useRef<FrequencyBand[]>([]);
  const venuesRef = useRef<AppData['venues']>([]);
  const allRequestsRef = useRef<FrequencyRequest[]>([]);
  const compositeRequestsRef = useRef<CompositeRequest[]>([]);
  const selectedVenueIdRef = useRef(selectedVenueId);

  const pointerXRef = useRef(0);
  const pointerYRef = useRef(0);
  const bandStripRefs = useRef<Map<string, HTMLElement>>(new Map());
  const bandGridParams = useRef<Map<string, BandGridParams>>(new Map());
  const tooltipElRef = useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    loadData().then(data => {
      bandsRef.current = data.bands;
      venuesRef.current = data.venues;
      allRequestsRef.current = data.allRequests;
      compositeRequestsRef.current = data.compositeRequests;
      setAppData(data);
      setSelectedVenueId(data.venues[0]?.id ?? '');
    }).catch(err => console.error('Failed to load spectrum data:', err));
  }, []);

  useEffect(() => {
    const track = (e: PointerEvent) => {
      pointerXRef.current = e.clientX;
      pointerYRef.current = e.clientY;
    };
    window.addEventListener('pointermove', track, { passive: true });
    return () => window.removeEventListener('pointermove', track);
  }, []);

  useEffect(() => {
    if (!activeRequest) return;
    const move = (e: PointerEvent) => {
      if (!tooltipElRef.current) return;
      tooltipElRef.current.style.left = `${e.clientX + 14}px`;
      tooltipElRef.current.style.top = `${e.clientY - 52}px`;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [activeRequest]);

  const registerBandStrip = useCallback((bandId: string, el: HTMLElement | null) => {
    if (el) bandStripRefs.current.set(bandId, el);
    else bandStripRefs.current.delete(bandId);
  }, []);

  const registerBandGrid = useCallback((bandId: string, params: BandGridParams | null) => {
    if (params) bandGridParams.current.set(bandId, params);
    else bandGridParams.current.delete(bandId);
  }, []);

  const calcDropPosition = useCallback((bandId: string, req: FrequencyRequest) => {
    const band = bandsRef.current.find(b => b.id === bandId);
    const stripEl = bandStripRefs.current.get(bandId);
    if (!band || !stripEl) return null;
    const rect = stripEl.getBoundingClientRect();
    const relX = Math.max(0, Math.min(pointerXRef.current - rect.left, rect.width - 1));
    const relY = Math.max(0, Math.min(pointerYRef.current - rect.top, rect.height - 1));

    let rawFreq: number;
    const gp = bandGridParams.current.get(bandId);
    if (gp && gp.numCols > 0) {
      const cellW = rect.width / gp.numCols;
      const numRows = Math.ceil(gp.numCells / gp.numCols);
      const col = Math.min(Math.floor(relX / cellW), gp.numCols - 1);
      const row = Math.min(Math.floor(relY / (gp.cellHeightPx + 1)), numRows - 1);
      const cellIdx = Math.min(row * gp.numCols + col, gp.numCells - 1);
      rawFreq = band.startMHz + cellIdx * gp.channelMHz;
    } else {
      rawFreq = band.startMHz + (relX / rect.width) * (band.endMHz - band.startMHz);
    }

    const snapMHz = band.snapMHz ?? DEFAULT_SNAP_MHZ;
    const maxStart = req.duplexOffsetMHz !== undefined
      ? band.endMHz - req.duplexOffsetMHz - req.bandwidthMHz
      : band.endMHz - req.bandwidthMHz;
    const startMHz = Math.max(band.startMHz, Math.min(Math.floor(rawFreq / snapMHz) * snapMHz, maxStart));
    const endMHz = Math.round((startMHz + req.bandwidthMHz) * 1000) / 1000;
    return { band, startMHz, endMHz };
  }, []);

  selectedVenueIdRef.current = selectedVenueId;

  const selectedVenue = appData?.venues.find(v => v.id === selectedVenueId) ?? appData?.venues[0];
  const allocatedIds = new Set(allocations.map(a => a.requestId));

  const venueComposites = (appData?.compositeRequests ?? []).filter(c => c.venueId === selectedVenueId);
  const compositeRequestIds = new Set(venueComposites.flatMap(c => c.memberRequests.map(r => r.id)));
  const pendingCompositeGroups = venueComposites.filter(c => c.memberRequests.some(r => !allocatedIds.has(r.id)));
  const allPendingRequests = (selectedVenue?.requests ?? []).filter(r => !allocatedIds.has(r.id) && !compositeRequestIds.has(r.id));

  // Apply service filter for the panel
  const pendingRequests = selectedServiceId === 'all'
    ? allPendingRequests
    : allPendingRequests.filter(r => r.serviceId === selectedServiceId);
  const pendingComposites = selectedServiceId === 'all' || selectedServiceId === 'svc-other'
    ? pendingCompositeGroups
    : [];

  // Stats for toolbar
  const visibleBands = useMemo(() => {
    if (!appData) return [];
    if (selectedServiceId === 'all') return appData.bands;
    const svc = appData.services.find(s => s.id === selectedServiceId);
    return svc ? appData.bands.filter(b => svc.bandIds.includes(b.id)) : appData.bands;
  }, [appData, selectedServiceId]);

  const venueAllocations = allocations.filter(a => a.venueId === selectedVenueId);
  const visibleBandIds = new Set(visibleBands.map(b => b.id));
  const totalBW = visibleBands.reduce((s, b) => s + (b.endMHz - b.startMHz), 0);
  const usedBW = venueAllocations.filter(a => visibleBandIds.has(a.bandId)).reduce((s, a) => s + (a.endMHz - a.startMHz), 0);
  const utilizationPct = totalBW > 0 ? Math.round((usedBW / totalBW) * 100) : 0;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const req = allRequestsRef.current.find(r => r.id === event.active.id);
    setActiveRequest(req ?? null);
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { over } = event;
    if (!over || !activeRequest) { setDragPreview(null); return; }
    const pos = calcDropPosition(over.id as string, activeRequest);
    if (!pos) { setDragPreview(null); return; }
    const { band, startMHz, endMHz } = pos;

    const existingAllocs = allocations.filter(a => a.bandId === band.id && a.venueId === selectedVenueIdRef.current);
    const existingReservs = reservations.filter(r => r.bandId === band.id);
    const isBlocked = (s: number, e: number) =>
      existingAllocs.some(a => overlaps(s, e, a.startMHz, a.endMHz)) ||
      existingReservs.some(r => overlaps(s, e, r.startMHz, r.endMHz));

    const primaryValid = !isBlocked(startMHz, endMHz);

    if (activeRequest.duplexOffsetMHz !== undefined) {
      const secStart = Math.round((startMHz + activeRequest.duplexOffsetMHz) * 1000) / 1000;
      const secEnd = Math.round((secStart + activeRequest.bandwidthMHz) * 1000) / 1000;
      const secInBounds = secEnd <= band.endMHz;
      const secValid = secInBounds && !isBlocked(secStart, secEnd);
      setDragPreview({
        bandId: band.id, startMHz, endMHz, valid: primaryValid && secValid,
        secondary: { startMHz: secStart, endMHz: secEnd, valid: secValid },
      });
    } else {
      setDragPreview({ bandId: band.id, startMHz, endMHz, valid: primaryValid });
    }
  }, [activeRequest, allocations, reservations, calcDropPosition]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveRequest(null);
    setDragPreview(null);
    const { active, over } = event;
    if (!over) return;

    const req = allRequestsRef.current.find(r => r.id === active.id);
    if (!req) return;

    const currentAllocatedIds = new Set(allocations.map(a => a.requestId));
    if (currentAllocatedIds.has(req.id)) return;

    const venueOfReq = venuesRef.current.find(v => v.requests.some(r => r.id === req.id));
    if (!venueOfReq) return;

    const pos = calcDropPosition(over.id as string, req);
    if (!pos) return;
    const { band, startMHz, endMHz } = pos;

    const existingAllocs = allocations.filter(a => a.bandId === band.id && a.venueId === venueOfReq.id);
    const existingReservs = reservations.filter(r => r.bandId === band.id);
    const isBlocked = (s: number, e: number) =>
      existingAllocs.some(a => overlaps(s, e, a.startMHz, a.endMHz)) ||
      existingReservs.some(r => overlaps(s, e, r.startMHz, r.endMHz));

    if (req.duplexOffsetMHz !== undefined) {
      const secStart = Math.round((startMHz + req.duplexOffsetMHz) * 1000) / 1000;
      const secEnd = Math.round((secStart + req.bandwidthMHz) * 1000) / 1000;
      if (isBlocked(startMHz, endMHz) || isBlocked(secStart, secEnd)) {
        setErrorMsg(`Conflict: ${req.label} duplex pair overlaps an existing allocation or reservation`);
        setTimeout(() => setErrorMsg(null), 3500);
        return;
      }
      const pairId = `pair-${Date.now()}`;
      setAllocations(prev => [...prev,
        { id: `${pairId}-a`, requestId: req.id, bandId: band.id, startMHz, endMHz, venueId: venueOfReq.id, pairId, pairRole: 'primary' },
        { id: `${pairId}-b`, requestId: req.id, bandId: band.id, startMHz: secStart, endMHz: secEnd, venueId: venueOfReq.id, pairId, pairRole: 'secondary' },
      ]);
    } else {
      if (isBlocked(startMHz, endMHz)) {
        setErrorMsg(`Conflict: ${req.label} overlaps an existing allocation or reservation`);
        setTimeout(() => setErrorMsg(null), 3500);
        return;
      }
      setAllocations(prev => [...prev, {
        id: `alloc-${Date.now()}`, requestId: req.id, bandId: band.id, startMHz, endMHz, venueId: venueOfReq.id,
      }]);
    }
  }, [allocations, reservations, calcDropPosition]);

  const handleDeallocate = useCallback((allocationId: string) => {
    const target = allocations.find(a => a.id === allocationId);
    if (!target) return;
    const req = allRequestsRef.current.find(r => r.id === target.requestId);
    const roleLabel = target.pairRole === 'primary' ? ' [TX]' : target.pairRole === 'secondary' ? ' [RX]' : '';
    const label = req ? `${req.label}${roleLabel}` : allocationId;
    const deviceLine = req ? `${req.device}\n` : '';
    const detail = `${label}\n${deviceLine}${target.startMHz.toFixed(3)}-${target.endMHz.toFixed(3)} MHz`;
    setConfirmState({
      title: target.pairId ? 'Remove Duplex Pair' : 'Remove Allocation',
      detail: target.pairId
        ? `${req?.label ?? ''} (TX + RX pair)\n${req?.device ?? ''}\nBoth channels will be removed`
        : detail,
      confirmLabel: 'Remove',
      onConfirm: () => {
        setAllocations(prev => {
          if (target.pairId) return prev.filter(a => a.pairId !== target.pairId);
          return prev.filter(a => a.id !== allocationId);
        });
        setConfirmState(null);
      },
    });
  }, [allocations]);

  const handleRemoveReservation = useCallback((id: string) => {
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    const bwkHz = Math.round((res.endMHz - res.startMHz) * 1000);
    setConfirmState({
      title: 'Remove Reservation',
      detail: `${res.reason}\n${res.startMHz.toFixed(3)}-${res.endMHz.toFixed(3)} MHz  (${bwkHz} kHz)`,
      confirmLabel: 'Remove',
      onConfirm: () => {
        setReservations(prev => prev.filter(r => r.id !== id));
        setConfirmState(null);
      },
    });
  }, [reservations]);

  const handleReserveRequest = useCallback((bandId: string, startMHz: number, endMHz: number) => {
    setPendingReserve({ bandId, startMHz, endMHz });
  }, []);

  const handleReserveConfirm = useCallback((reason: string) => {
    if (!pendingReserve) return;
    const id = `res-${Date.now()}`;
    setReservations(prev => [...prev, { id, ...pendingReserve, reason }]);
    setPendingReserve(null);
  }, [pendingReserve]);

  if (!appData || !selectedVenueId) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', backgroundColor: '#f1f5f9',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#64748b', fontSize: '14px', gap: '10px',
      }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #cbd5e1', borderTopColor: '#2563eb', animation: 'spin 0.7s linear infinite' }} />
        Loading spectrum data…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        backgroundColor: '#f1f5f9',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header style={{
          padding: '0 20px', height: '44px', flexShrink: 0,
          backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
            <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: '700' }}>RF Allocator</span>
          </div>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Live Event Spectrum Coordinator</span>
          {errorMsg && (
            <div style={{
              marginLeft: 'auto',
              backgroundColor: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
            }}>
              {errorMsg}
            </div>
          )}
        </header>

        {/* ── Toolbar: venue / service / stats ──────────────────────────── */}
        <div style={{
          padding: '8px 20px', flexShrink: 0,
          backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
        }}>
          {/* Venue selector */}
          <div>
            <div style={{ color: '#64748b', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Venue</div>
            <div style={{ position: 'relative' }}>
              <select value={selectedVenueId} onChange={e => setSelectedVenueId(e.target.value)} style={selectStyle}>
                {appData.venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <ChevronDown />
            </div>
          </div>

          {/* Service selector */}
          <div>
            <div style={{ color: '#64748b', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Service</div>
            <div style={{ position: 'relative' }}>
              <select value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)} style={selectStyle}>
                <option value="all">All Services</option>
                {appData.services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown />
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0', flexShrink: 0 }} />

          {/* Stats */}
          <Stat label="Total Spectrum" value={`${totalBW.toFixed(1)} MHz`} />
          <Stat label="Allocated" value={`${usedBW.toFixed(2)} MHz`} />
          <Stat label="Free" value={`${(totalBW - usedBW).toFixed(2)} MHz`} />
          <Stat label="Utilization" value={`${utilizationPct}%`} accent />
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left: collapsible request panel */}
          <div style={{
            width: panelOpen ? '260px' : '0',
            flexShrink: 0, overflow: 'hidden',
            transition: 'width 0.2s ease',
          }}>
            <div style={{ width: '260px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <RequestPanel
                requests={pendingRequests}
                compositeGroups={pendingComposites}
                allocatedIds={allocatedIds}
              />
            </div>
          </div>

          {/* Collapse / expand toggle strip */}
          <button
            onClick={() => setPanelOpen(v => !v)}
            title={panelOpen ? 'Collapse panel' : 'Expand panel'}
            style={{
              width: '16px', flexShrink: 0, padding: 0,
              background: '#f8fafc', border: 'none',
              borderLeft: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8',
            }}
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path
                d={panelOpen ? 'M5 1L1 5l4 4' : 'M1 1l4 4-4 4'}
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Right: spectrum view — vertical scroll only, no horizontal overflow */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
            <SpectrumView
              bands={appData.bands}
              services={appData.services}
              selectedServiceId={selectedServiceId}
              selectedVenueId={selectedVenueId}
              allRequests={appData.allRequests}
              allocations={allocations}
              reservations={reservations}
              dragPreview={dragPreview}
              onDeallocate={handleDeallocate}
              onRemoveReservation={handleRemoveReservation}
              onRegisterStrip={registerBandStrip}
              onRegisterGrid={registerBandGrid}
              onReserveRequest={handleReserveRequest}
            />
          </div>
        </div>
      </div>

      {/* Drag tooltip */}
      {dragPreview && (
        <div
          ref={tooltipElRef}
          style={{
            position: 'fixed',
            left: `${pointerXRef.current + 14}px`,
            top: `${pointerYRef.current - 52}px`,
            backgroundColor: '#1e293b', color: '#f8fafc',
            fontSize: '11px', fontFamily: 'ui-monospace, Consolas, monospace',
            padding: '6px 10px', borderRadius: '6px',
            pointerEvents: 'none', zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
            whiteSpace: 'nowrap', lineHeight: 1.6,
            borderLeft: `3px solid ${dragPreview.valid ? '#22c55e' : '#ef4444'}`,
          }}
        >
          <div style={{
            fontSize: '9px', color: dragPreview.valid ? '#86efac' : '#fca5a5',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px',
          }}>
            {dragPreview.valid ? 'Place here' : 'Conflict'}
          </div>
          <div>{dragPreview.startMHz.toFixed(3)} MHz</div>
          {dragPreview.secondary && (
            <div style={{ color: '#94a3b8' }}>
              {dragPreview.secondary.startMHz.toFixed(3)} MHz{' '}
              <span style={{ fontSize: '9px' }}>[RX]</span>
            </div>
          )}
        </div>
      )}

      {pendingReserve && (
        <ReserveDialog
          pending={pendingReserve}
          onConfirm={handleReserveConfirm}
          onCancel={() => setPendingReserve(null)}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={confirmState.title}
          detail={confirmState.detail}
          confirmLabel={confirmState.confirmLabel}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      <DragOverlay dropAnimation={null} />
    </DndContext>
  );
}
