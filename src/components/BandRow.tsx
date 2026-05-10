import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Allocation, BandGridParams, DragPreview, FrequencyBand, FrequencyRequest, Reservation } from '../types';

const CELL_W = 12;   // fixed cell width px
const CELL_H = 32;   // fixed cell height px
const CELL_GAP = 1;
const MAX_CELLS = 512;

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
      return g % 1 === 0 ? g.toFixed(1) : g.toFixed(3).replace(/\.?0+$/, '');
    };
    return `${fmt(start)}–${fmt(end)} GHz`;
  }
  return `${start}–${end} MHz`;
}

function fmtBW(bwMHz: number): string {
  return bwMHz >= 1
    ? `${bwMHz.toFixed(bwMHz % 1 === 0 ? 0 : 1)} MHz`
    : `${Math.round(bwMHz * 1000)} kHz`;
}

interface Props {
  band: FrequencyBand;
  allocations: Allocation[];
  reservations: Reservation[];
  allRequests: FrequencyRequest[];
  dragPreview: DragPreview | null;
  onDeallocate: (id: string) => void;
  onRemoveReservation: (id: string) => void;
  onRegisterStrip: (bandId: string, el: HTMLElement | null) => void;
  onRegisterGrid?: (bandId: string, params: BandGridParams | null) => void;
  onReserveRequest: (bandId: string, startMHz: number, endMHz: number) => void;
}

export function BandRow({
  band, allocations, reservations, allRequests,
  dragPreview, onDeallocate, onRemoveReservation, onRegisterStrip, onRegisterGrid, onReserveRequest,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: band.id });
  const stripElRef = useRef<HTMLElement | null>(null);

  const reservingRef = useRef(false);
  const reserveStartRef = useRef(0);
  const [reserveSelection, setReserveSelection] = useState<{ startMHz: number; endMHz: number } | null>(null);

  // ── Grid geometry (fixed cell size, width proportional to band) ───────────
  const bandRange = band.endMHz - band.startMHz;
  const rawCells = Math.max(1, Math.round(bandRange / (band.channelMHz ?? 0.00625)));
  const numCells = Math.min(rawCells, MAX_CELLS);
  const displayChannelMHz = bandRange / numCells;
  const numCols = numCells; // single row — width reflects band size

  // Stable refs so closures don't stale
  const numCellsRef = useRef(numCells);
  const displayChannelMHzRef = useRef(displayChannelMHz);
  const bandRef = useRef(band);
  numCellsRef.current = numCells;
  displayChannelMHzRef.current = displayChannelMHz;
  bandRef.current = band;

  const setRef = useCallback((el: HTMLElement | null) => {
    setNodeRef(el);
    onRegisterStrip(band.id, el);
    stripElRef.current = el;
  }, [band.id, setNodeRef, onRegisterStrip]);

  // Report fixed grid geometry to parent (used for drag-position calculation)
  useEffect(() => {
    onRegisterGrid?.(band.id, { numCols, cellHeightPx: CELL_H, channelMHz: displayChannelMHz, numCells });
    return () => onRegisterGrid?.(band.id, null);
  }, [band.id, numCols, displayChannelMHz, numCells, onRegisterGrid]);

  // ── Coordinate → frequency (single-row, fixed cell width) ────────────────
  const snapCell = useCallback((clientX: number, _clientY: number): number => {
    if (!stripElRef.current) return bandRef.current.startMHz;
    const rect = stripElRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(clientX - rect.left, rect.width - 1));
    const col = Math.min(Math.floor(relX / (CELL_W + CELL_GAP)), numCellsRef.current - 1);
    return bandRef.current.startMHz + col * displayChannelMHzRef.current;
  }, []);

  // ── Right-click drag reservation ──────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!reservingRef.current) return;
      const cur = snapCell(e.clientX, e.clientY);
      const start = reserveStartRef.current;
      setReserveSelection({
        startMHz: Math.min(start, cur),
        endMHz: Math.max(start, cur) + displayChannelMHzRef.current,
      });
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button !== 2 || !reservingRef.current) return;
      reservingRef.current = false;
      setReserveSelection(prev => {
        if (!prev) return null;
        if (prev.endMHz - prev.startMHz >= displayChannelMHzRef.current) {
          onReserveRequest(bandRef.current.id, prev.startMHz, prev.endMHz);
        }
        return null;
      });
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [snapCell, onReserveRequest]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 2) return;
    e.preventDefault();
    const snapped = snapCell(e.clientX, e.clientY);
    reserveStartRef.current = snapped;
    reservingRef.current = true;
    setReserveSelection({ startMHz: snapped, endMHz: snapped + displayChannelMHz });
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const usedBW = allocations.reduce((s, a) => s + (a.endMHz - a.startMHz), 0);
  const reservedBW = reservations.reduce((s, r) => s + (r.endMHz - r.startMHz), 0);
  const utilizationPct = Math.round((usedBW / bandRange) * 100);

  const preview = dragPreview?.bandId === band.id ? dragPreview : null;

  // ── Pre-compute cell state maps ───────────────────────────────────────────
  const cellAllocMap = useMemo(() => {
    const map: Array<Allocation | null> = new Array(numCells).fill(null);
    for (const alloc of allocations) {
      const s = Math.max(0, Math.floor((alloc.startMHz - band.startMHz) / displayChannelMHz));
      const e = Math.min(numCells, Math.ceil((alloc.endMHz - band.startMHz) / displayChannelMHz));
      for (let i = s; i < e; i++) if (!map[i]) map[i] = alloc;
    }
    return map;
  }, [allocations, band.startMHz, displayChannelMHz, numCells]);

  const cellResMap = useMemo(() => {
    const map = new Map<number, Reservation>();
    for (const res of reservations) {
      const s = Math.max(0, Math.floor((res.startMHz - band.startMHz) / displayChannelMHz));
      const e = Math.min(numCells, Math.ceil((res.endMHz - band.startMHz) / displayChannelMHz));
      for (let i = s; i < e; i++) if (!map.has(i)) map.set(i, res);
    }
    return map;
  }, [reservations, band.startMHz, displayChannelMHz, numCells]);

  const cellPreviewSet = useMemo(() => {
    if (!preview) return new Set<number>();
    const set = new Set<number>();
    const mark = (s: number, e: number) => {
      const si = Math.max(0, Math.floor((s - band.startMHz) / displayChannelMHz));
      const ei = Math.min(numCells, Math.ceil((e - band.startMHz) / displayChannelMHz));
      for (let i = si; i < ei; i++) set.add(i);
    };
    mark(preview.startMHz, preview.endMHz);
    if (preview.secondary) mark(preview.secondary.startMHz, preview.secondary.endMHz);
    return set;
  }, [preview, band.startMHz, displayChannelMHz, numCells]);

  const cellSelectSet = useMemo(() => {
    if (!reserveSelection) return new Set<number>();
    const set = new Set<number>();
    const s = Math.min(reserveSelection.startMHz, reserveSelection.endMHz);
    const e = Math.max(reserveSelection.startMHz, reserveSelection.endMHz);
    const si = Math.max(0, Math.floor((s - band.startMHz) / displayChannelMHz));
    const ei = Math.min(numCells, Math.ceil((e - band.startMHz) / displayChannelMHz));
    for (let i = si; i < ei; i++) set.add(i);
    return set;
  }, [reserveSelection, band.startMHz, displayChannelMHz, numCells]);

  return (
    <div style={{ marginBottom: '18px' }}>
      {/* Band header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{ width: '3px', height: '14px', backgroundColor: band.color, borderRadius: '2px', flexShrink: 0 }} />
        <span style={{ color: '#1e293b', fontWeight: '700', fontSize: '12px' }}>{band.name}</span>
        <span style={{ color: '#94a3b8', fontSize: '11px' }}>{fmtBandRange(band.startMHz, band.endMHz)}</span>
        <span style={{ color: '#94a3b8', fontSize: '10px' }}>
          {allocations.length} assigned · {utilizationPct}% used
          {reservedBW > 0 && ` · ${fmtBW(reservedBW)} reserved`}
        </span>
      </div>

      {/* Fixed-width cell grid — width reflects actual band size */}
      <div
        ref={setRef}
        onMouseDown={handleMouseDown}
        onContextMenu={e => e.preventDefault()}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${numCols}, ${CELL_W}px)`,
          gap: `${CELL_GAP}px`,
          backgroundColor: isOver ? `${band.color}44` : '#d1d5db',
          border: `1px solid ${isOver ? band.color : '#e2e8f0'}`,
          borderRadius: '4px',
          overflow: 'hidden',
          cursor: 'crosshair',
          boxShadow: isOver ? `0 0 0 2px ${band.color}33` : 'none',
          transition: 'box-shadow 0.1s, border-color 0.1s',
          userSelect: 'none',
        }}
      >
        {Array.from({ length: numCells }, (_, idx) => {
          const alloc = cellAllocMap[idx];
          const res = cellResMap.get(idx);
          const isPrev = cellPreviewSet.has(idx);
          const isSel = cellSelectSet.has(idx);

          let bg: string;
          if (isSel) {
            bg = 'rgba(245,158,11,0.5)';
          } else if (isPrev) {
            bg = preview!.valid ? 'rgba(22,163,74,0.4)' : 'rgba(220,38,38,0.35)';
          } else if (alloc) {
            const req = allRequests.find(r => r.id === alloc.requestId);
            bg = req?.color ?? '#94a3b8';
          } else if (res) {
            bg = 'rgba(245,158,11,0.25)';
          } else {
            bg = '#f8fafc';
          }

          const req = alloc ? allRequests.find(r => r.id === alloc.requestId) : null;
          const roleTag = alloc?.pairRole === 'primary' ? ' [TX]' : alloc?.pairRole === 'secondary' ? ' [RX]' : '';
          const bwLabel = alloc ? fmtBW(alloc.endMHz - alloc.startMHz) : '';
          const tip = req
            ? `${req.label}${roleTag}\n${req.device}\n${bwLabel} · ${alloc!.startMHz.toFixed(3)}–${alloc!.endMHz.toFixed(3)} MHz\nClick to remove`
            : res
            ? `Reserved: ${res.reason}\nClick to remove`
            : '';

          return (
            <div
              key={idx}
              title={tip}
              style={{
                height: `${CELL_H}px`,
                backgroundColor: bg,
                opacity: alloc?.pairRole === 'secondary' ? 0.7 : 1,
                cursor: alloc || res ? 'pointer' : 'crosshair',
              }}
              onClick={() => {
                if (alloc) onDeallocate(alloc.id);
                else if (res) onRemoveReservation(res.id);
              }}
            />
          );
        })}
      </div>

      {/* Frequency axis */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', padding: '0 1px', minWidth: `${numCells * (CELL_W + CELL_GAP)}px` }}>
        <span style={{ color: '#94a3b8', fontSize: '9px' }}>{fmtMHz(band.startMHz)}</span>
        <span style={{ color: '#cbd5e1', fontSize: '9px', fontStyle: 'italic' }}>{fmtBW(displayChannelMHz)}/cell · {numCells} ch</span>
        <span style={{ color: '#94a3b8', fontSize: '9px' }}>{fmtMHz(band.endMHz)}</span>
      </div>
    </div>
  );
}
