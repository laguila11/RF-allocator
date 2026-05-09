import { useCallback, useEffect, useRef, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import { SpectrumView } from './components/SpectrumView';
import { RequestPanel } from './components/RequestPanel';
import { RequestCard } from './components/RequestCard';
import { initialBands, venues, allRequests } from './data';
import type { Allocation, DragPreview, FrequencyRequest } from './types';

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
    const startMHz = Math.max(
      band.startMHz,
      Math.min(Math.round(rawFreq / 0.025) * 0.025, band.endMHz - req.bandwidthMHz),
    );
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
    const valid = !existing.some(a => !(endMHz <= a.startMHz || startMHz >= a.endMHz));
    setDragPreview({ bandId: band.id, startMHz, endMHz, valid });
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
    const conflict = existing.some(a => !(endMHz <= a.startMHz || startMHz >= a.endMHz));
    if (conflict) {
      setErrorMsg(`Conflict: ${req.label} overlaps an existing allocation`);
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }

    setAllocations(prev => [...prev, {
      id: `alloc-${Date.now()}`,
      requestId: req.id,
      bandId: band.id,
      startMHz,
      endMHz,
      venueId: venueOfReq.id,
    }]);
  }, [allocations, calcDropPosition]);

  const handleDeallocate = useCallback((allocationId: string) => {
    setAllocations(prev => prev.filter(a => a.id !== allocationId));
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
        backgroundColor: '#0a0f1e',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}>
        <header style={{
          padding: '0 24px', height: '52px',
          backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: '#38bdf8', boxShadow: '0 0 8px #38bdf8aa',
            }} />
            <span style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700', letterSpacing: '0.02em' }}>
              RF Allocator
            </span>
          </div>
          <span style={{ color: '#1e293b' }}>|</span>
          <span style={{ color: '#475569', fontSize: '13px' }}>Live Event Spectrum Coordinator</span>

          {errorMsg && (
            <div style={{
              marginLeft: 'auto',
              backgroundColor: '#450a0a', border: '1px solid #991b1b',
              color: '#fca5a5', padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
            }}>
              {errorMsg}
            </div>
          )}
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 256px', flex: 1, overflow: 'hidden' }}>
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
