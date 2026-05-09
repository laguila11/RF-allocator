import type { Allocation, DragPreview, FrequencyBand, FrequencyRequest, Venue } from '../types';
import { BandRow } from './BandRow';

interface Props {
  bands: FrequencyBand[];
  allRequests: FrequencyRequest[];
  allocations: Allocation[];
  venues: Venue[];
  dragPreview: DragPreview | null;
  onDeallocate: (allocationId: string) => void;
  onRegisterStrip: (bandId: string, el: HTMLElement | null) => void;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px 18px' }}>
      <div style={{ color: '#475569', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ color: accent ? '#38bdf8' : '#e2e8f0', fontSize: '20px', fontWeight: '700', marginTop: '2px' }}>{value}</div>
    </div>
  );
}

export function SpectrumView({ bands, allRequests, allocations, venues, dragPreview, onDeallocate, onRegisterStrip }: Props) {
  const totalBW = bands.reduce((s, b) => s + (b.endMHz - b.startMHz), 0);
  const usedBW = allocations.reduce((s, a) => s + (a.endMHz - a.startMHz), 0);
  const utilizationPct = totalBW > 0 ? Math.round((usedBW / totalBW) * 100) : 0;

  return (
    <div style={{ padding: '24px', overflowY: 'auto', backgroundColor: '#0a0f1e' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
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
          allRequests={allRequests}
          venues={venues}
          dragPreview={dragPreview}
          onDeallocate={onDeallocate}
          onRegisterStrip={onRegisterStrip}
        />
      ))}
    </div>
  );
}
