import { useCallback, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SpectrumView } from './components/SpectrumView';
import { RequestPanel } from './components/RequestPanel';
import { RequestCard } from './components/RequestCard';
import { initialBands, initialRequests } from './data';
import type { Allocation, FrequencyRequest } from './types';

function findFirstAvailableSlot(
  bandStart: number,
  bandEnd: number,
  existing: Allocation[],
  bw: number,
): number | null {
  const STEP = 0.025;
  for (
    let freq = bandStart;
    Math.round((freq + bw) * 1000) / 1000 <= bandEnd + 1e-9;
    freq = Math.round((freq + STEP) * 1000) / 1000
  ) {
    const end = Math.round((freq + bw) * 1000) / 1000;
    const conflict = existing.some(a => !(end <= a.startMHz || freq >= a.endMHz));
    if (!conflict) return freq;
  }
  return null;
}

export default function App() {
  const [pendingRequests, setPendingRequests] = useState<FrequencyRequest[]>(initialRequests);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [activeRequest, setActiveRequest] = useState<FrequencyRequest | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const req = pendingRequests.find(r => r.id === event.active.id);
    setActiveRequest(req ?? null);
  }, [pendingRequests]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveRequest(null);
    const { active, over } = event;
    if (!over) return;

    const req = pendingRequests.find(r => r.id === active.id);
    if (!req) return;

    const band = initialBands.find(b => b.id === over.id);
    if (!band) return;

    const existing = allocations.filter(a => a.bandId === band.id);
    const startMHz = findFirstAvailableSlot(band.startMHz, band.endMHz, existing, req.bandwidthMHz);

    if (startMHz === null) {
      setErrorMsg(`No space for ${req.label} in ${band.name}`);
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }

    setAllocations(prev => [...prev, {
      id: `alloc-${Date.now()}`,
      requestId: req.id,
      bandId: band.id,
      startMHz,
      endMHz: Math.round((startMHz + req.bandwidthMHz) * 1000) / 1000,
    }]);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  }, [pendingRequests, allocations]);

  const handleDeallocate = useCallback((allocationId: string) => {
    const alloc = allocations.find(a => a.id === allocationId);
    if (!alloc) return;
    const req = initialRequests.find(r => r.id === alloc.requestId);
    if (!req) return;
    setAllocations(prev => prev.filter(a => a.id !== allocationId));
    setPendingRequests(prev => [...prev, req]);
  }, [allocations]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        backgroundColor: '#0a0f1e',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}>
        <header style={{
          padding: '0 24px',
          height: '52px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexShrink: 0,
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
              backgroundColor: '#450a0a',
              border: '1px solid #991b1b',
              color: '#fca5a5',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
            }}>
              {errorMsg}
            </div>
          )}
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 256px', flex: 1, overflow: 'hidden' }}>
          <SpectrumView
            bands={initialBands}
            allRequests={initialRequests}
            allocations={allocations}
            onDeallocate={handleDeallocate}
          />
          <RequestPanel requests={pendingRequests} />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeRequest && <RequestCard request={activeRequest} overlay />}
      </DragOverlay>
    </DndContext>
  );
}
