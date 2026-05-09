import { useCallback, useEffect, useRef, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import { SpectrumView } from './components/SpectrumView';
import { RequestPanel } from './components/RequestPanel';
import { RequestCard } from './components/RequestCard';
import { initialBands, venues, allRequests } from './data';
import type { Allocation, DragPreview, FrequencyRequest } from './types';

const SNAP_MHZ = 0.006; // 6 kHz

export default function App() {
  const [selectedVenueId, setSelectedVenueId] = useState(venues[0].id);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [activeRequest, setActiveRequest] = useState<FrequencyRequest | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pointerXRef = useRef(0);
  const bandStripRefs = useRef<Map<string, HTMLElement>>(new Map());

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    const track = (e: PointerEvent) => { pointerXRef.current = e.clientX; };
    window.addEventListener('pointermove', track);
    return () => window.removeEventListener('pointermove', track);
  }, []);

  const registerBandStrip = useCallback((bandId: string, el: HTMLElement | null) => {
    if (el) bandStripRefs.current.set(bandId, el);
    else bandStripRefs.current.delete(bandId);
  }, []);

  const calcDropPosition = useCallback((bandId: string, req: FrequencyRequest) => {
    const band = initialBands.find(b => b.id === bandId);
    const stripEl = bandStripRefs.current.get(bandId);
    if (!band || !stripEl) return null;
    const rect = stripEl.getBoundingClientRect();
    const relX = Math.max(0, Math.min(pointerXRef.current - rect.left, rect.width));
    const rawFreq = band.startMHz + (relX / rect.width) * (band.endMHz - band.startMHz);
    // Clamp so that dual secondary fits within the band
    const maxStart = req.duplexOffsetMHz !== undefined
      ? band.endMHz - req.duplexOffsetMHz - req.bandwidthMHz
      : band.endMHz - req.bandwidthMHz;
    const startMHz = Math.max(band.startMHz, Math.min(Math.round(rawFreq / SNAP_MHZ) * SNAP_MHZ, maxStart));
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
    const existing = allocations.filter(a => a.bandId === band.id);
    const primaryValid = !existing.some(a => !(endMHz <= a.startMHz || startMHz >= a.endMHz));

    if (activeRequest.duplexOffsetMHz !== undefined) {
      const secStart = Math.round((startMHz + activeRequest.duplexOffsetMHz) * 1000) / 1000;
      const secEnd = Math.round((secStart + activeRequest.bandwidthMHz) * 1000) / 1000;
      const secInBounds = secEnd <= band.endMHz;
      const secValid = secInBounds && !existing.some(a => !(secEnd <= a.startMHz || secStart >= a.endMHz));
      setDragPreview({
        bandId: band.id, startMHz, endMHz, valid: primaryValid && secValid,
        secondary: { startMHz: secStart, endMHz: secEnd, valid: secValid },
      });
    } else {
      setDragPreview({ bandId: band.id, startMHz, endMHz, valid: primaryValid });
    }
  }, [activeRequest, allocations, calcDropPosition]);

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
    const existing = allocations.filter(a => a.bandId === band.id);

    if (req.duplexOffsetMHz !== undefined) {
      const secStart = Math.round((startMHz + req.duplexOffsetMHz) * 1000) / 1000;
      const secEnd = Math.round((secStart + req.bandwidthMHz) * 1000) / 1000;
      const priConflict = existing.some(a => !(endMHz <= a.startMHz || startMHz >= a.endMHz));
      const secConflict = existing.some(a => !(secEnd <= a.startMHz || secStart >= a.endMHz));
      if (priConflict || secConflict) {
        setErrorMsg(`Conflict: ${req.label} duplex pair overlaps an existing allocation`);
        setTimeout(() => setErrorMsg(null), 3500);
        return;
      }
      const pairId = `pair-${Date.now()}`;
      setAllocations(prev => [...prev,
        { id: `${pairId}-a`, requestId: req.id, bandId: band.id, startMHz, endMHz, venueId: venueOfReq.id, pairId, pairRole: 'primary' },
        { id: `${pairId}-b`, requestId: req.id, bandId: band.id, startMHz: secStart, endMHz: secEnd, venueId: venueOfReq.id, pairId, pairRole: 'secondary' },
      ]);
    } else {
      const conflict = existing.some(a => !(endMHz <= a.startMHz || startMHz >= a.endMHz));
      if (conflict) {
        setErrorMsg(`Conflict: ${req.label} overlaps an existing allocation`);
        setTimeout(() => setErrorMsg(null), 3500);
        return;
      }
      setAllocations(prev => [...prev, {
        id: `alloc-${Date.now()}`, requestId: req.id, bandId: band.id, startMHz, endMHz, venueId: venueOfReq.id,
      }]);
    }
  }, [allocations, calcDropPosition]);

  const handleDeallocate = useCallback((allocationId: string) => {
    setAllocations(prev => {
      const target = prev.find(a => a.id === allocationId);
      if (!target) return prev;
      // Remove both halves of a duplex pair together
      if (target.pairId) return prev.filter(a => a.pairId !== target.pairId);
      return prev.filter(a => a.id !== allocationId);
    });
  }, []);

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

          {errorMsg && (
            <div style={{
              marginLeft: 'auto',
              backgroundColor: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
            }}>
              {errorMsg}
            </div>
          )}
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 264px', flex: 1, overflow: 'hidden' }}>
          <SpectrumView
            bands={initialBands}
            allRequests={allRequests}
            allocations={allocations}
            venues={venues}
            dragPreview={dragPreview}
            onDeallocate={handleDeallocate}
            onRegisterStrip={registerBandStrip}
          />
          <RequestPanel
            requests={pendingRequests}
            venues={venues}
            selectedVenueId={selectedVenueId}
            onVenueChange={setSelectedVenueId}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeRequest && <RequestCard request={activeRequest} overlay />}
      </DragOverlay>
    </DndContext>
  );
}
