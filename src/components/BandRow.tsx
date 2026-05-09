import { useDroppable } from '@dnd-kit/core';
import type { Allocation, FrequencyBand, FrequencyRequest } from '../types';
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
  onDeallocate: (allocationId: string) => void;
}

export function BandRow({ band, allocations, allRequests, onDeallocate }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: band.id });

  const bandRange = band.endMHz - band.startMHz;
  const usedBW = allocations.reduce((s, a) => s + (a.endMHz - a.startMHz), 0);
  const utilizationPct = Math.round((usedBW / bandRange) * 100);
  const ticks = generateTicks(band.startMHz, band.endMHz, 7);

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
        ref={setNodeRef}
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
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: band.color, opacity: 0.04, pointerEvents: 'none',
        }} />

        {allocations.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#1e293b', fontSize: '12px', pointerEvents: 'none',
            fontStyle: 'italic',
          }}>
            Drop requests here
          </div>
        )}

        {allocations.map(alloc => {
          const req = allRequests.find(r => r.id === alloc.requestId);
          if (!req) return null;
          return (
            <AllocationBlock
              key={alloc.id}
              allocation={alloc}
              band={band}
              request={req}
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
