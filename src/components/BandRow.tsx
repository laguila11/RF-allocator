import { useCallback, useEffect, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Allocation, DragPreview, FrequencyBand, FrequencyRequest, Reservation, Venue } from '../types';
import { AllocationBlock } from './AllocationBlock';
import { ReservationBlock } from './ReservationBlock';

const STRIP_HEIGHT = 48;
const DEFAULT_SNAP_MHZ = 0.00625;

function gridSteps(range: number) {
  if (range >= 500) return { major: 100, minor: 20  };
  if (range >= 200) return { major: 50,  minor: 10  };
  if (range >= 100) return { major: 20,  minor: 5   };
  if (range >= 50)  return { major: 10,  minor: 2   };
  if (range >= 20)  return { major: 5,   minor: 1   };
  if (range >= 8)   return { major: 2,   minor: 0.5 };
  return                   { major: 1,   minor: 0.2 };
}

function buildGridLines(start: number, end: number, width: number) {
  const range = end - start;
  const { major: majorStep, minor: minorStep } = gridSteps(range);
  const lines: Array<{ left: number; major: boolean }> = [];
  let f = Math.round(Math.ceil(start / minorStep) * minorStep * 1000) / 1000;
  while (f < end - 1e-9) {
    const major = Math.abs(((f - start) / majorStep) % 1) < 1e-4;
    lines.push({ left: ((f - start) / range) * width, major });
    f = Math.round((f + minorStep) * 1000) / 1000;
  }
  return lines;
}

function generateTicks(start: number, end: number): number[] {
  const range = end - start;
  const step = range >= 500 ? 100 : range >= 200 ? 50 : range >= 100 ? 20 : range >= 50 ? 10 : range >= 20 ? 5 : range >= 8 ? 2 : 1;
  const ticks: number[] = [];
  let f = Math.ceil(start / step) * step;
  while (f <= end) { ticks.push(f); f += step; }
  return ticks;
}

// Format a frequency value for tick labels and headers
function fmtMHz(mhz: number): string {
  if (mhz >= 3000) {
    const g = mhz / 1000;
    return `${g % 1 === 0 ? g.toFixed(1) : g.toFixed(2).replace(/0+$/, '')} GHz`;
  }
  return `${mhz} MHz`;
}

function fmtBandRange(start: number, end: number): string {
  if (start >= 3000) {
    const fmt = (v: number) => {
      const g = v / 1000;
      return (g % 1 === 0 ? g.toFixed(1) : g.toFixed(3).replace(/\.?0+$/, ''));
    };
    return `${fmt(start)}–${fmt(end)} GHz`;
  }
  return `${start}–${end} MHz`;
}

function fmtBW(bwMHz: number): string {
  return bwMHz >= 1 ? `${bwMHz.toFixed(bwMHz % 1 === 0 ? 0 : 1)} MHz` : `${Math.round(bwMHz * 1000)} kHz`;
}

interface Props {
  band: FrequencyBand;
  allocations: Allocation[];
  reservations: Reservation[];
  allRequests: FrequencyRequest[];
  venues: Venue[];
  dragPreview: DragPreview | null;
  onDeallocate: (id: string) => void;
  onRemoveReservation: (id: string) => void;
  onRegisterStrip: (bandId: string, el: HTMLElement | null) => void;
  onReserveRequest: (bandId: string, startMHz: number, endMHz: number) => void;
}

export function BandRow({
  band, allocations, reservations, allRequests, venues,
  dragPreview, onDeallocate, onRemoveReservation, onRegisterStrip, onReserveRequest,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: band.id });
  const [stripWidth, setStripWidth] = useState(800);
  const roRef = useRef<ResizeObserver | null>(null);
  const stripElRef = useRef<HTMLElement | null>(null);

  // Right-click selection state
  const reservingRef = useRef(false);
  const reserveStartRef = useRef(0);
  const [reserveSelection, setReserveSelection] = useState<{ startMHz: number; endMHz: number } | null>(null);

  const setRef = useCallback((el: HTMLElement | null) => {
    setNodeRef(el);
    onRegisterStrip(band.id, el);
    stripElRef.current = el;
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

  // Window-level handlers for right-click drag (so selection works even when cursor leaves the strip)
  useEffect(() => {
    const snap = band.snapMHz ?? DEFAULT_SNAP_MHZ;
    const snapFreq = (clientX: number) => {
      if (!stripElRef.current) return 0;
      const rect = stripElRef.current.getBoundingClientRect();
      const relX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const raw = band.startMHz + (relX / rect.width) * (band.endMHz - band.startMHz);
      return Math.max(band.startMHz, Math.min(Math.round(raw / snap) * snap, band.endMHz));
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!reservingRef.current) return;
      setReserveSelection({ startMHz: reserveStartRef.current, endMHz: snapFreq(e.clientX) });
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button !== 2 || !reservingRef.current) return;
      reservingRef.current = false;
      setReserveSelection(prev => {
        if (!prev) return null;
        const [s, end] = [Math.min(prev.startMHz, prev.endMHz), Math.max(prev.startMHz, prev.endMHz)];
        if (end - s >= snap * 4) onReserveRequest(band.id, s, end);
        return null;
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [band, onReserveRequest]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 2) return;
    e.preventDefault();
    if (!stripElRef.current) return;
    const snap = band.snapMHz ?? DEFAULT_SNAP_MHZ;
    const rect = stripElRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const raw = band.startMHz + (relX / rect.width) * (band.endMHz - band.startMHz);
    const snapped = Math.max(band.startMHz, Math.min(Math.round(raw / snap) * snap, band.endMHz));
    reserveStartRef.current = snapped;
    reservingRef.current = true;
    setReserveSelection({ startMHz: snapped, endMHz: snapped });
  };

  const bandRange = band.endMHz - band.startMHz;
  const usedBW = allocations.reduce((s, a) => s + (a.endMHz - a.startMHz), 0);
  const reservedBW = reservations.reduce((s, r) => s + (r.endMHz - r.startMHz), 0);
  const utilizationPct = Math.round((usedBW / bandRange) * 100);
  const gridLines = buildGridLines(band.startMHz, band.endMHz, stripWidth);
  const ticks = generateTicks(band.startMHz, band.endMHz);
  const preview = dragPreview?.bandId === band.id ? dragPreview : null;

  // Cell-grid mode: render discrete channel cells as CSS background
  const channelMHz = band.channelMHz ?? DEFAULT_SNAP_MHZ;
  const cellWidthPx = stripWidth > 0 ? (channelMHz / bandRange) * stripWidth : 0;
  const showCellGrid = cellWidthPx >= 4;
  const cellGridStyle: React.CSSProperties = showCellGrid ? {
    backgroundImage: [
      `repeating-linear-gradient(to right, rgba(203,213,225,0.5) 0, rgba(203,213,225,0.5) 1px, transparent 1px, transparent ${cellWidthPx}px)`,
      `repeating-linear-gradient(to bottom, rgba(203,213,225,0.2) 0, rgba(203,213,225,0.2) 1px, transparent 1px, transparent 8px)`,
    ].join(', '),
  } : {};

  const pairGroups: Record<string, Allocation[]> = {};
  for (const a of allocations) {
    if (a.pairId) {
      if (!pairGroups[a.pairId]) pairGroups[a.pairId] = [];
      pairGroups[a.pairId].push(a);
    }
  }

  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{ width: '3px', height: '14px', backgroundColor: band.color, borderRadius: '2px', flexShrink: 0 }} />
        <span style={{ color: '#1e293b', fontWeight: '700', fontSize: '12px' }}>{band.name}</span>
        <span style={{ color: '#94a3b8', fontSize: '11px' }}>{fmtBandRange(band.startMHz, band.endMHz)}</span>
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '10px' }}>
          {allocations.length} assigned · {utilizationPct}% used
          {reservedBW > 0 && ` · ${fmtBW(reservedBW)} reserved`}
        </span>
      </div>

      <div
        ref={setRef}
        onMouseDown={handleMouseDown}
        onContextMenu={e => e.preventDefault()}
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
          cursor: 'crosshair',
          ...cellGridStyle,
        }}
      >
        {/* Band tint */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: band.color, opacity: 0.03, pointerEvents: 'none' }} />

        {/* Grid lines — only for narrow-channel bands where cell grid is not visible */}
        {!showCellGrid && gridLines.map(({ left, major }, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${left}px`, top: 0, bottom: 0, width: '1px',
            backgroundColor: major ? '#94a3b8' : '#e2e8f0',
            opacity: major ? 0.7 : 1,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Empty hint */}
        {allocations.length === 0 && reservations.length === 0 && !preview && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#cbd5e1', fontSize: '12px', pointerEvents: 'none', fontStyle: 'italic',
          }}>
            Drop requests here · right-click drag to reserve
          </div>
        )}

        {/* Right-click selection overlay */}
        {reserveSelection && (() => {
          const [s, e] = [Math.min(reserveSelection.startMHz, reserveSelection.endMHz), Math.max(reserveSelection.startMHz, reserveSelection.endMHz)];
          const left = ((s - band.startMHz) / bandRange) * stripWidth;
          const w = Math.max(((e - s) / bandRange) * stripWidth, 2);
          return (
            <div style={{
              position: 'absolute', left: `${left}px`, width: `${w}px`,
              top: '2px', bottom: '2px',
              backgroundColor: '#f59e0b', opacity: 0.22,
              borderRadius: '3px', border: '2px dashed #d97706',
              pointerEvents: 'none',
            }} />
          );
        })()}

        {/* Drag preview ghost(s) */}
        {preview && (() => {
          const color = preview.valid ? '#16a34a' : '#dc2626';
          const blocks = [];
          const addGhost = (sStart: number, sEnd: number, key: string) => {
            const l = ((sStart - band.startMHz) / bandRange) * stripWidth;
            const w = Math.max(((sEnd - sStart) / bandRange) * stripWidth, 24);
            blocks.push(
              <div key={key} style={{
                position: 'absolute', left: `${l}px`, width: `${w}px`,
                top: '3px', bottom: '3px',
                backgroundColor: color, opacity: 0.18,
                borderRadius: '4px', border: `2px dashed ${color}`,
                pointerEvents: 'none',
              }} />
            );
          };
          addGhost(preview.startMHz, preview.endMHz, 'pri');
          if (preview.secondary) {
            addGhost(preview.secondary.startMHz, preview.secondary.endMHz, 'sec');
            const x1 = ((preview.endMHz - band.startMHz) / bandRange) * stripWidth;
            const x2 = ((preview.secondary.startMHz - band.startMHz) / bandRange) * stripWidth;
            if (x2 > x1) blocks.push(
              <div key="conn" style={{
                position: 'absolute', left: `${x1}px`, width: `${x2 - x1}px`,
                bottom: '6px', height: '2px',
                backgroundColor: color, opacity: 0.4, pointerEvents: 'none',
              }} />
            );
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
              bottom: '5px', height: '2px',
              backgroundColor: req.color, opacity: 0.4, pointerEvents: 'none',
            }} />
          );
        })}

        {/* Reservation blocks */}
        {reservations.map(r => (
          <ReservationBlock
            key={r.id}
            reservation={r}
            band={band}
            stripWidth={stripWidth}
            onRemove={onRemoveReservation}
          />
        ))}

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
              <div style={{ color: '#94a3b8', fontSize: '10px', whiteSpace: 'nowrap', marginTop: '1px' }}>{fmtMHz(tick)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
