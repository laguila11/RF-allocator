import { useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Allocation, DragPreview, FrequencyBand, FrequencyRequest, Venue } from '../types';
import { AllocationBlock } from './AllocationBlock';

const STRIP_WIDTH = 680;

function generateTicks(start: number, end: number, count: number): number[] {
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round((start + i * step) * 10) / 10);
}

interface Props {
  band: FrequencyBand;
  allocations: Allocation[];
  allRequests: FrequencyRequest[];
  venues: Venue[];
  dragPreview: DragPreview | null;
  onDeallocate: (allocationId: string) => void;
  onRegisterStrip: (bandId: string, el: HTMLElement | null) => void;
}

export function BandRow({ band, allocations, allRequests, venues, dragPreview, onDeallocate, onRegisterStrip }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: band.id });

  const setRef = useCallback((el: HTMLElement | null) => {
    setNodeRef(el);
    onRegisterStrip(band.id, el);
  }, [band.id, setNodeRef, onRegisterStrip]);

  const bandRange = band.endMHz - band.startMHz;
  const usedBW = allocations.reduce((s, a) => s + (a.endMHz - a.startMHz), 0);
  const utilizationPct = Math.round((usedBW / bandRange) * 100);
  const ticks = generateTicks(band.startMHz, band.endMHz, 7);

  const preview = dragPreview?.bandId === band.id ? dragPreview : null;

  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <div style={{ width: '4px', height: '18px', backgroundColor: band.color, borderRadius: '2px', flexShrink: 0 }} />
        <span style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '13px' }}>{band.name}</span>
        <span style={{ color: '#475569', fontSize: '12px' }}>{band.startMHz}–{band.endMHz} MHz</span>
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '11px' }}>
          {allocations.length} assigned · {utilizationPct}% used
        </span>
      </div>

      <div
        ref={setRef}
        style={{
          position: 'relative',
          width: `${STRIP_WIDTH}px`,
          height: '52px',
          backgroundColor: isOver ? '#0f2a4a' : '#0d1525',
          border: `1px solid ${isOver ? band.color : '#1e293b'}`,
          borderRadius: '6px',
          boxShadow: isOver ? `0 0 0 2px ${band.color}55` : 'none',
          transition: 'background-color 0.12s, border-color 0.12s, box-shadow 0.12s',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundColor: band.color, opacity: 0.04, pointerEvents: 'none' }} />

        {allocations.length === 0 && !preview && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#1e293b', fontSize: '12px', pointerEvents: 'none', fontStyle: 'italic',
          }}>
            Drop requests here
          </div>
        )}

        {/* Drag preview ghost */}
        {preview && (() => {
          const left = ((preview.startMHz - band.startMHz) / bandRange) * STRIP_WIDTH;
          const width = ((preview.endMHz - preview.startMHz) / bandRange) * STRIP_WIDTH;
          return (
            <div style={{
              position: 'absolute',
              left: `${left}px`,
              width: `${Math.max(width, 28)}px`,
              top: '4px', bottom: '4px',
              backgroundColor: preview.valid ? '#22c55e' : '#ef4444',
              opacity: 0.35,
              borderRadius: '4px',
              border: `2px dashed ${preview.valid ? '#4ade80' : '#f87171'}`,
              pointerEvents: 'none',
            }} />
          );
        })()}

        {allocations.map(alloc => {
          const req = allRequests.find(r => r.id === alloc.requestId);
          const venueName = venues.find(v => v.id === alloc.venueId)?.name ?? '';
          if (!req) return null;
          return (
            <AllocationBlock
              key={alloc.id}
              allocation={alloc}
              band={band}
              request={req}
              venueName={venueName}
              stripWidth={STRIP_WIDTH}
              onDeallocate={onDeallocate}
            />
          );
        })}
      </div>

      <div style={{ position: 'relative', width: `${STRIP_WIDTH}px`, height: '18px', marginTop: '2px' }}>
        {ticks.map(tick => {
          const left = ((tick - band.startMHz) / bandRange) * STRIP_WIDTH;
          return (
            <div key={tick} style={{ position: 'absolute', left: `${left}px`, transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ width: '1px', height: '3px', backgroundColor: '#1e293b', margin: '0 auto' }} />
              <div style={{ color: '#334155', fontSize: '10px', whiteSpace: 'nowrap' }}>{tick}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
