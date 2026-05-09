import type { Allocation, FrequencyBand, FrequencyRequest } from '../types';

interface Props {
  allocation: Allocation;
  band: FrequencyBand;
  request: FrequencyRequest;
  venueName: string;
  stripWidth: number;
  onDeallocate: (allocationId: string) => void;
}

export function AllocationBlock({ allocation, band, request, venueName, stripWidth, onDeallocate }: Props) {
  const bandRange = band.endMHz - band.startMHz;
  const left = ((allocation.startMHz - band.startMHz) / bandRange) * stripWidth;
  const width = ((allocation.endMHz - allocation.startMHz) / bandRange) * stripWidth;
  const bwLabel = allocation.endMHz - allocation.startMHz >= 1
    ? `${(allocation.endMHz - allocation.startMHz).toFixed(1)} MHz`
    : `${Math.round((allocation.endMHz - allocation.startMHz) * 1000)} kHz`;

  return (
    <div
      title={`${request.label} — ${request.device}\n${venueName}\n${allocation.startMHz.toFixed(3)}–${allocation.endMHz.toFixed(3)} MHz  (${bwLabel})\nClick to unassign`}
      onClick={() => onDeallocate(allocation.id)}
      style={{
        position: 'absolute',
        left: `${left}px`,
        width: `${Math.max(width, 28)}px`,
        top: '4px', bottom: '4px',
        backgroundColor: request.color,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: '700',
        color: '#fff',
        cursor: 'pointer',
        overflow: 'hidden',
        userSelect: 'none',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        transition: 'filter 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.2)')}
      onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
    >
      <span style={{ padding: '0 4px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {request.label}
      </span>
    </div>
  );
}
