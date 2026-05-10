import type { Allocation, BandGridParams, DragPreview, FrequencyBand, FrequencyRequest, Reservation, Service } from '../types';
import { BandRow } from './BandRow';

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
  const visibleBands = selectedServiceId === 'all'
    ? bands
    : (() => {
        const svc = services.find(s => s.id === selectedServiceId);
        return svc ? bands.filter(b => svc.bandIds.includes(b.id)) : bands;
      })();

  const venueAllocations = allocations.filter(a => a.venueId === selectedVenueId);

  const activeService = selectedServiceId !== 'all'
    ? services.find(s => s.id === selectedServiceId) ?? null
    : null;

  // Each BandRow measures its own width via ResizeObserver and fills the container.
  // numCols = floor(stripWidth / CELL_MIN_PX) → maximum columns → fewest rows → shortest page.
  const bandRow = (band: FrequencyBand) => (
    <BandRow
      key={band.id}
      band={band}
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
    <div style={{ padding: '20px 24px', backgroundColor: '#f8fafc' }}>
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
          {visibleBands.map(bandRow)}
        </div>
      ) : (
        visibleBands.map(bandRow)
      )}
    </div>
  );
}
