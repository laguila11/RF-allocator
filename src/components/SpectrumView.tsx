import type { Allocation, DragPreview, FrequencyBand, FrequencyRequest, Reservation, Service, Venue } from '../types';
import { BandRow } from './BandRow';

interface Props {
  bands: FrequencyBand[];
  services: Service[];
  selectedServiceId: string;
  allRequests: FrequencyRequest[];
  allocations: Allocation[];
  reservations: Reservation[];
  venues: Venue[];
  dragPreview: DragPreview | null;
  onDeallocate: (id: string) => void;
  onRemoveReservation: (id: string) => void;
  onRegisterStrip: (bandId: string, el: HTMLElement | null) => void;
  onReserveRequest: (bandId: string, startMHz: number, endMHz: number) => void;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
      borderRadius: '8px', padding: '10px 18px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ color: accent ? '#2563eb' : '#1e293b', fontSize: '20px', fontWeight: '700', marginTop: '2px' }}>{value}</div>
    </div>
  );
}

export function SpectrumView({
  bands, services, selectedServiceId, allRequests, allocations, reservations, venues,
  dragPreview, onDeallocate, onRemoveReservation, onRegisterStrip, onReserveRequest,
}: Props) {
  const totalBW = bands.reduce((s, b) => s + (b.endMHz - b.startMHz), 0);
  const usedBW = allocations.reduce((s, a) => s + (a.endMHz - a.startMHz), 0);
  const utilizationPct = totalBW > 0 ? Math.round((usedBW / totalBW) * 100) : 0;

  // Determine which bands to show
  const visibleBands = selectedServiceId === 'all'
    ? bands
    : (() => {
        const svc = services.find(s => s.id === selectedServiceId);
        return svc ? bands.filter(b => svc.bandIds.includes(b.id)) : bands;
      })();

  const activeService = selectedServiceId !== 'all'
    ? services.find(s => s.id === selectedServiceId) ?? null
    : null;

  const bandRow = (band: FrequencyBand) => (
    <BandRow
      key={band.id}
      band={band}
      allocations={allocations.filter(a => a.bandId === band.id)}
      reservations={reservations.filter(r => r.bandId === band.id)}
      allRequests={allRequests}
      venues={venues}
      dragPreview={dragPreview}
      onDeallocate={onDeallocate}
      onRemoveReservation={onRemoveReservation}
      onRegisterStrip={onRegisterStrip}
      onReserveRequest={onReserveRequest}
    />
  );

  return (
    <div style={{ padding: '24px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <Stat label="Total Spectrum" value={`${totalBW.toFixed(1)} MHz`} />
        <Stat label="Allocated" value={`${usedBW.toFixed(2)} MHz`} />
        <Stat label="Free" value={`${(totalBW - usedBW).toFixed(2)} MHz`} />
        <Stat label="Utilization" value={`${utilizationPct}%`} accent />
      </div>

      {activeService ? (
        /* ── Filtered: single service ── */
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
        /* ── All services: flat band list ── */
        visibleBands.map(bandRow)
      )}
    </div>
  );
}
