import { useCallback, useEffect, useRef, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import { SpectrumView } from './components/SpectrumView';
import { RequestPanel } from './components/RequestPanel';
import { ReserveDialog } from './components/ReserveDialog';
import { ConfirmDialog } from './components/ConfirmDialog';
import { initialBands, venues, allRequests, services } from './data';
import type { Allocation, BandGridParams, DragPreview, FrequencyRequest, PendingReserve, Reservation } from './types';

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

export default function App() {
  const [selectedVenueId, setSelectedVenueId] = useState(venues[0].id);
  const [selectedServiceId, setSelectedServiceId] = useState('all');
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeRequest, setActiveRequest] = useState<FrequencyRequest | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingReserve, setPendingReserve] = useState<PendingReserve | null>(null);
  const [lastReservationId, setLastReservationId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const pointerXRef = useRef(0);
  const pointerYRef = useRef(0);
  const bandStripRefs = useRef<Map<string, HTMLElement>>(new Map());
  const bandGridParams = useRef<Map<string, BandGridParams>>(new Map());
  const tooltipElRef = useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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
    const band = initialBands.find(b => b.id === bandId);
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

  const selectedVenue = venues.find(v => v.id === selectedVenueId)!;
  const allocatedIds = new Set(allocations.map(a => a.requestId));
  const pendingRequests = selectedVenue.requests.filter(r => !allocatedIds.has(r.id));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const req = allRequests.find(r => r.id === event.active.id);
    setActiveRequest(req ?? null);
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { over } = event;
    if (!over || !activeRequest) { setDragPreview(null); return; }
    const pos = calcDropPosition(over.id as string, activeRequest);
    if (!pos) { setDragPreview(null); return; }
    const { band, startMHz, endMHz } = pos;

    const existingAllocs = allocations.filter(a => a.bandId === band.id);
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

    const req = allRequests.find(r => r.id === active.id);
    if (!req) return;

    const currentAllocatedIds = new Set(allocations.map(a => a.requestId));
    if (currentAllocatedIds.has(req.id)) return;

    const venueOfReq = venues.find(v => v.requests.some(r => r.id === req.id));
    if (!venueOfReq) return;

    const pos = calcDropPosition(over.id as string, req);
    if (!pos) return;
    const { band, startMHz, endMHz } = pos;

    const existingAllocs = allocations.filter(a => a.bandId === band.id);
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
    const req = allRequests.find(r => r.id === target.requestId);
    const roleLabel = target.pairRole === 'primary' ? ' [TX]' : target.pairRole === 'secondary' ? ' [RX]' : '';
    const label = req ? `${req.label}${roleLabel}` : allocationId;
    const deviceLine = req ? `${req.device}\n` : '';
    const detail = `${label}\n${deviceLine}${target.startMHz.toFixed(3)}–${target.endMHz.toFixed(3)} MHz`;
    const title = target.pairId ? 'Remove Duplex Pair' : 'Remove Allocation';
    setConfirmState({
      title,
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
      detail: `${res.reason}\n${res.startMHz.toFixed(3)}–${res.endMHz.toFixed(3)} MHz  (${bwkHz} kHz)`,
      confirmLabel: 'Remove',
      onConfirm: () => {
        setReservations(prev => prev.filter(r => r.id !== id));
        setLastReservationId(prev => (prev === id ? null : prev));
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
    setLastReservationId(id);
    setPendingReserve(null);
  }, [pendingReserve]);

  const handleUndoLastReservation = useCallback(() => {
    if (!lastReservationId) return;
    const res = reservations.find(r => r.id === lastReservationId);
    if (!res) return;
    const bwkHz = Math.round((res.endMHz - res.startMHz) * 1000);
    setConfirmState({
      title: 'Undo Reservation',
      detail: `${res.reason}\n${res.startMHz.toFixed(3)}–${res.endMHz.toFixed(3)} MHz  (${bwkHz} kHz)`,
      confirmLabel: 'Undo',
      onConfirm: () => {
        setReservations(prev => prev.filter(r => r.id !== lastReservationId));
        setLastReservationId(null);
        setConfirmState(null);
      },
    });
  }, [lastReservationId, reservations]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        backgroundColor: '#f1f5f9',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}>
        <header style={{
          padding: '0 24px', height: '52px', flexShrink: 0,
          backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
            <span style={{ color: '#1e293b', fontSize: '15px', fontWeight: '700', letterSpacing: '0.01em' }}>
              RF Allocator
            </span>
          </div>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Live Event Spectrum Coordinator</span>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {lastReservationId && (
              <button
                onClick={handleUndoLastReservation}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '6px',
                  border: '1px solid #fde68a', backgroundColor: '#fef9c3',
                  color: '#92400e', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ↩ Undo reservation
              </button>
            )}
            {errorMsg && (
              <div style={{
                backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                color: '#dc2626', padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
              }}>
                {errorMsg}
              </div>
            )}
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 264px', flex: 1, overflow: 'hidden' }}>
          <SpectrumView
            bands={initialBands}
            services={services}
            selectedServiceId={selectedServiceId}
            allRequests={allRequests}
            allocations={allocations}
            reservations={reservations}
            dragPreview={dragPreview}
            onDeallocate={handleDeallocate}
            onRemoveReservation={handleRemoveReservation}
            onRegisterStrip={registerBandStrip}
            onRegisterGrid={registerBandGrid}
            onReserveRequest={handleReserveRequest}
          />
          <RequestPanel
            requests={pendingRequests}
            venues={venues}
            services={services}
            selectedVenueId={selectedVenueId}
            selectedServiceId={selectedServiceId}
            onVenueChange={setSelectedVenueId}
            onServiceChange={setSelectedServiceId}
          />
        </div>
      </div>

      {/* Frequency tooltip — position managed via DOM ref, content via React state */}
      {dragPreview && (
        <div
          ref={tooltipElRef}
          style={{
            position: 'fixed',
            left: `${pointerXRef.current + 14}px`,
            top: `${pointerYRef.current - 52}px`,
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            fontSize: '11px',
            fontFamily: 'ui-monospace, Consolas, monospace',
            padding: '6px 10px',
            borderRadius: '6px',
            pointerEvents: 'none',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
            whiteSpace: 'nowrap',
            lineHeight: 1.6,
            borderLeft: `3px solid ${dragPreview.valid ? '#22c55e' : '#ef4444'}`,
          }}
        >
          <div style={{
            fontSize: '9px',
            color: dragPreview.valid ? '#86efac' : '#fca5a5',
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
