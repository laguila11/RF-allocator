import { useEffect, useRef, useState } from 'react';
import type { Allocation, BandGridParams, DragPreview, FrequencyBand, FrequencyRequest, Reservation, Service } from '../types';
import { BandRow } from './BandRow';

const INNER_PAD = 48;   // 24 px each side
const MIN_STRIP = 80;   // minimum strip width in px

interface Props {
  bands: FrequencyBand[];
  services: Service[];
  selectedServiceId: string;
  selectedVenueId: string;
  allRequests: FrequencyRequest[];
  allocations: Allocation[];
  reservations: Reservation[];
  dragPreview: DragPreview | null;
  onDeallocate: (id: string) => void;
  onRemoveReservation: (id: string) => void;
  onRegisterStrip: (bandId: string, el: HTMLElement | null) => void;
  onRegisterGrid: (bandId: string, params: BandGridParams | null) => void;
  onReserveRequest: (bandId: string, startMHz: number, endMHz: number) => void;
}

export function SpectrumView({
  bands, services, selectedServiceId, selectedVenueId, allRequests, allocations, reservations,
  dragPreview, onDeallocate, onRemoveReservation, onRegisterStrip, onRegisterGrid, onReserveRequest,
}: Props) {
  const [containerWidth, setContainerWidth] = useState(900);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width || 900);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visibleBands = selectedServiceId === 'all'
    ? bands
    : (() => {
        const svc = services.find(s => s.id === selectedServiceId);
        return svc ? bands.filter(b => svc.bandIds.includes(b.id)) : bands;
      })();

  const venueAllocations = allocations.filter(a => a.venueId === selectedVenueId);

  // ── Proportional strip widths ─────────────────────────────────────────────
  // Each band gets a strip whose width is proportional to its MHz range.
  // MIN_STRIP ensures narrow bands stay readable; scaling keeps total ≤ availWidth.
  const availWidth = Math.max(MIN_STRIP, containerWidth - INNER_PAD);
  const maxRange = visibleBands.length > 0
    ? Math.max(...visibleBands.map(b => b.endMHz - b.startMHz))
    : 1;
  const rawWidths = visibleBands.map(b =>
    Math.max(((b.endMHz - b.startMHz) / maxRange) * availWidth, MIN_STRIP),
  );
  const totalRaw = rawWidths.reduce((s, w) => s + w, 0);
  const scale = totalRaw > availWidth ? availWidth / totalRaw : 1;
  const stripWidths = rawWidths.map(w => Math.max(Math.floor(w * scale), 12));

  const activeService = selectedServiceId !== 'all'
    ? services.find(s => s.id === selectedServiceId) ?? null
    : null;

  const bandRow = (band: FrequencyBand, idx: number) => (
    <BandRow
      key={band.id}
      band={band}
      stripWidth={stripWidths[idx] ?? availWidth}
      allocations={venueAllocations.filter(a => a.bandId === band.id)}
      reservations={reservations.filter(r => r.bandId === band.id)}
      allRequests={allRequests}
      dragPreview={dragPreview}
      onDeallocate={onDeallocate}
      onRemoveReservation={onRemoveReservation}
      onRegisterStrip={onRegisterStrip}
      onRegisterGrid={onRegisterGrid}
      onReserveRequest={onReserveRequest}
    />
  );

  return (
    <div ref={rootRef} style={{ padding: '20px 24px', backgroundColor: '#f8fafc' }}>
      {activeService ? (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '20px', paddingBottom: '12px',
            borderBottom: `2px solid ${activeService.color}44`,
          }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '3px',
              backgroundColor: activeService.color, flexShrink: 0,
            }} />
            <span style={{ color: '#1e293b', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {activeService.name}
            </span>
            <div style={{ height: '1px', flex: 1, backgroundColor: `${activeService.color}22` }} />
            <span style={{
              fontSize: '11px', color: activeService.color, fontWeight: '600',
              backgroundColor: `${activeService.color}12`,
              padding: '2px 8px', borderRadius: '4px',
            }}>
              {visibleBands.length} {visibleBands.length === 1 ? 'band' : 'bands'}
            </span>
          </div>
          {visibleBands.map((b, i) => bandRow(b, i))}
        </div>
      ) : (
        visibleBands.map((b, i) => bandRow(b, i))
      )}
    </div>
  );
}
