import { useCallback, useEffect, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Allocation, DragPreview, FrequencyBand, FrequencyRequest, Venue } from '../types';
import { AllocationBlock } from './AllocationBlock';

const STRIP_HEIGHT = 88;
const MAJOR_STEP = 1.0;   // 1 MHz  — darker lines
const MINOR_STEP = 0.2;   // 200 kHz — lighter lines

function buildGridLines(start: number, end: number, width: number) {
  const lines: Array<{ left: number; major: boolean }> = [];
  const range = end - start;
  let f = Math.round(Math.ceil(start / MINOR_STEP) * MINOR_STEP * 1000) / 1000;
  while (f < end - 1e-9) {
    const major = Math.abs((f - start) % MAJOR_STEP) < 1e-6;
    lines.push({ left: ((f - start) / range) * width, major });
    f = Math.round((f + MINOR_STEP) * 1000) / 1000;
  }
  return lines;
}

function generateTicks(start: number, end: number): number[] {
  const ticks: number[] = [];
  let f = Math.ceil(start);
  while (f <= end) { ticks.push(f); f++; }
  return ticks;
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
  const [stripWidth, setStripWidth] = useState(800);
  const roRef = useRef<ResizeObserver | null>(null);

  const setRef = useCallback((el: HTMLElement | null) => {
    setNodeRef(el);
    onRegisterStrip(band.id, el);
    roRef.current?.disconnect();
    roRef.current = null;
    if (el) {
      setStripWidth(el.getBoundingClientRect().width || 800);
      const ro = new ResizeObserver(([entry]) => setStripWidth(entry.contentRect.width));
      ro.observe(el);
      roRef.current = ro;
    }
  }, [band.id, setNodeRef, onRegisterStrip]);

  useEffect(() => () => roRef.current?.disconnect(), []);

  const bandRange = band.endMHz - band.startMHz;
  const usedBW = allocations.reduce((s, a) => s + (a.endMHz - a.startMHz), 0);
  const utilizationPct = Math.round((usedBW / bandRange) * 100);
  const gridLines = buildGridLines(band.startMHz, band.endMHz, stripWidth);
  const ticks = generateTicks(band.startMHz, band.endMHz);

  const preview = dragPreview?.bandId === band.id ? dragPreview : null;

  // Group paired allocations for connector rendering
  const pairGroups: Record<string, Allocation[]> = {};
  for (const a of allocations) {
    if (a.pairId) {
      if (!pairGroups[a.pairId]) pairGroups[a.pairId] = [];
      pairGroups[a.pairId].push(a);
    }
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Band header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: '4px', height: '20px', backgroundColor: band.color, borderRadius: '2px', flexShrink: 0 }} />
        <span style={{ color: '#1e293b', fontWeight: '700', fontSize: '14px' }}>{band.name}</span>
        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{band.startMHz}–{band.endMHz} MHz</span>
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '11px' }}>
          {allocations.length} assigned · {utilizationPct}% used
        </span>
      </div>

      {/* Droppable strip */}
      <div
        ref={setRef}
        style={{
          position: 'relative',
          width: '100%',
          height: `${STRIP_HEIGHT}px`,
          backgroundColor: isOver ? `${band.color}08` : '#ffffff',
          border: `1px solid ${isOver ? band.color : '#e2e8f0'}`,
          borderRadius: '6px',
          boxShadow: isOver
            ? `0 0 0 3px ${band.color}22, 0 1px 4px rgba(0,0,0,0.06)`
            : '0 1px 4px rgba(0,0,0,0.04)',
          transition: 'background-color 0.1s, border-color 0.1s, box-shadow 0.1s',
          overflow: 'hidden',
        }}
      >
        {/* Band color tint */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: band.color, opacity: 0.03, pointerEvents: 'none' }} />

        {/* Grid lines */}
        {gridLines.map(({ left, major }, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${left}px`,
              top: 0,
              bottom: 0,
              width: '1px',
              backgroundColor: major ? '#94a3b8' : '#e2e8f0',
              opacity: major ? 0.7 : 1,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Empty hint */}
        {allocations.length === 0 && !preview && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#cbd5e1', fontSize: '12px', pointerEvents: 'none', fontStyle: 'italic',
          }}>
            Drop requests here
          </div>
        )}

        {/* Drag preview ghost(s) */}
        {preview && (() => {
          const color = preview.valid ? '#16a34a' : '#dc2626';
          const blocks = [];
          const addGhost = (sStart: number, sEnd: number, key: string) => {
            const left = ((sStart - band.startMHz) / bandRange) * stripWidth;
            const width = Math.max(((sEnd - sStart) / bandRange) * stripWidth, 24);
            blocks.push(
              <div key={key} style={{
                position: 'absolute', left: `${left}px`, width: `${width}px`,
                top: '6px', bottom: '6px',
                backgroundColor: color, opacity: 0.18,
                borderRadius: '4px',
                border: `2px dashed ${color}`,
                pointerEvents: 'none',
              }} />
            );
          };
          addGhost(preview.startMHz, preview.endMHz, 'pri');
          if (preview.secondary) {
            addGhost(preview.secondary.startMHz, preview.secondary.endMHz, 'sec');
            // Connector between ghosts
            const x1 = ((preview.endMHz - band.startMHz) / bandRange) * stripWidth;
            const x2 = ((preview.secondary.startMHz - band.startMHz) / bandRange) * stripWidth;
            if (x2 > x1) {
              blocks.push(
                <div key="conn" style={{
                  position: 'absolute', left: `${x1}px`, width: `${x2 - x1}px`,
                  bottom: '10px', height: '2px',
                  backgroundColor: color, opacity: 0.4, pointerEvents: 'none',
                }} />
              );
            }
          }
          return blocks;
        })()}

        {/* Pair connectors */}
        {Object.values(pairGroups).map(pair => {
          if (pair.length !== 2) return null;
          const [a, b] = [...pair].sort((x, y) => x.startMHz - y.startMHz);
          const req = allRequests.find(r => r.id === a.requestId);
          if (!req) return null;
          const x1 = ((a.endMHz - band.startMHz) / bandRange) * stripWidth;
          const x2 = ((b.startMHz - band.startMHz) / bandRange) * stripWidth;
          if (x2 <= x1) return null;
          return (
            <div key={`conn-${a.pairId}`} style={{
              position: 'absolute', left: `${x1}px`, width: `${x2 - x1}px`,
              bottom: '8px', height: '2px',
              backgroundColor: req.color, opacity: 0.4, pointerEvents: 'none',
            }} />
          );
        })}

        {/* Allocation blocks */}
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
              stripWidth={stripWidth}
              onDeallocate={onDeallocate}
            />
          );
        })}
      </div>

      {/* Frequency axis */}
      <div style={{ position: 'relative', width: '100%', height: '20px', marginTop: '2px' }}>
        {ticks.map(tick => {
          const left = ((tick - band.startMHz) / bandRange) * stripWidth;
          return (
            <div key={tick} style={{ position: 'absolute', left: `${left}px`, transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ width: '1px', height: '4px', backgroundColor: '#cbd5e1', margin: '0 auto' }} />
              <div style={{ color: '#94a3b8', fontSize: '10px', whiteSpace: 'nowrap', marginTop: '1px' }}>{tick}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
