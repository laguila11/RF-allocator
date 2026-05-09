import type { Allocation, DragPreview, FrequencyBand, FrequencyRequest, Reservation, Venue } from '../types';
import { BandRow } from './BandRow';

interface Props {
  bands: FrequencyBand[];
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
  bands, allRequests, allocations, reservations, venues,
  dragPreview, onDeallocate, onRemoveReservation, onRegisterStrip, onReserveRequest,
}: Props) {
  const totalBW = bands.reduce((s, b) => s + (b.endMHz - b.startMHz), 0);
  const usedBW = allocations.reduce((s, a) => s + (a.endMHz - a.startMHz), 0);
  const utilizationPct = totalBW > 0 ? Math.round((usedBW / totalBW) * 100) : 0;

  return (
    <div style={{ padding: '24px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <Stat label="Total Spectrum" value={`${totalBW.toFixed(1)} MHz`} />
        <Stat label="Allocated" value={`${usedBW.toFixed(2)} MHz`} />
        <Stat label="Free" value={`${(totalBW - usedBW).toFixed(2)} MHz`} />
        <Stat label="Utilization" value={`${utilizationPct}%`} accent />
      </div>

      {bands.map(band => (
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
      ))}
    </div>
  );
}
