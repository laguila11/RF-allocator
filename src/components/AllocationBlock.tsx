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
  const roleLabel = allocation.pairRole === 'primary' ? ' [TX]' : allocation.pairRole === 'secondary' ? ' [RX]' : '';
  const isSecondary = allocation.pairRole === 'secondary';

  return (
    <div
      title={`${request.label}${roleLabel} — ${request.device}\n${venueName}\n${allocation.startMHz.toFixed(3)}–${allocation.endMHz.toFixed(3)} MHz  (${bwLabel})\nClick to unassign`}
      onClick={() => onDeallocate(allocation.id)}
      style={{
        position: 'absolute',
        left: `${left}px`,
        width: `${Math.max(width, 28)}px`,
        top: '6px',
        bottom: '6px',
        backgroundColor: request.color,
        opacity: isSecondary ? 0.75 : 1,
        borderRadius: '4px',
        border: isSecondary ? `2px dashed ${request.color}` : 'none',
        outline: isSecondary ? `2px solid rgba(255,255,255,0.6)` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: '700',
        color: '#fff',
        cursor: 'pointer',
        overflow: 'hidden',
        userSelect: 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'filter 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.88)')}
      onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
    >
      <span style={{ padding: '0 4px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {request.label}{roleLabel}
      </span>
    </div>
  );
}
