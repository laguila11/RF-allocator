import type { FrequencyBand, Reservation } from '../types';

interface Props {
  reservation: Reservation;
  band: FrequencyBand;
  stripWidth: number;
  onRemove: (id: string) => void;
}

export function ReservationBlock({ reservation, band, stripWidth, onRemove }: Props) {
  const bandRange = band.endMHz - band.startMHz;
  const left = ((reservation.startMHz - band.startMHz) / bandRange) * stripWidth;
  const width = Math.max(((reservation.endMHz - reservation.startMHz) / bandRange) * stripWidth, 14);
  const bwkHz = Math.round((reservation.endMHz - reservation.startMHz) * 1000);

  return (
    <div
      title={`RESERVED — ${reservation.reason}\n${reservation.startMHz.toFixed(3)}–${reservation.endMHz.toFixed(3)} MHz (${bwkHz} kHz)\nClick to remove`}
      onClick={() => onRemove(reservation.id)}
      onContextMenu={e => e.preventDefault()}
      style={{
        position: 'absolute',
        left: `${left}px`,
        width: `${width}px`,
        top: '4px',
        bottom: '4px',
        backgroundImage:
          'repeating-linear-gradient(45deg, #f59e0b28 0px, #f59e0b28 5px, #fef3c740 5px, #fef3c740 10px)',
        border: '1.5px solid #f59e0baa',
        borderRadius: '4px',
        cursor: 'pointer',
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        transition: 'opacity 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.6')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      {width > 36 && (
        <span style={{
          fontSize: '9px', fontWeight: '600', color: '#92400e',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          padding: '0 4px',
        }}>
          {reservation.reason}
        </span>
      )}
    </div>
  );
}
