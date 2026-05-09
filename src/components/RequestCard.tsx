import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { FrequencyRequest } from '../types';

interface Props {
  request: FrequencyRequest;
  overlay?: boolean;
}

export function RequestCard({ request, overlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: request.id,
    data: { type: 'request', request },
  });

  const bwLabel = request.bandwidthMHz >= 1
    ? `${request.bandwidthMHz} MHz`
    : `${Math.round(request.bandwidthMHz * 1000)} kHz`;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging && !overlay ? 0.4 : 1,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderLeft: `3px solid ${request.color}`,
        borderRadius: '6px',
        padding: '8px 10px',
        marginBottom: '6px',
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none',
        boxShadow: overlay ? '0 4px 16px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.04)',
      }}
      {...attributes}
      {...listeners}
    >
      <div style={{
        width: '8px', height: '28px', borderRadius: '2px',
        backgroundColor: request.color, flexShrink: 0, opacity: 0.85,
      }} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '12px' }}>{request.label}</span>
          {request.duplexOffsetMHz !== undefined && (
            <span style={{
              fontSize: '9px', fontWeight: '600', color: '#7c3aed',
              backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe',
              borderRadius: '3px', padding: '1px 4px', lineHeight: 1.4,
            }}>
              DUPLEX
            </span>
          )}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
          {request.device}
        </div>
      </div>
      <div style={{ color: '#94a3b8', fontSize: '10px', flexShrink: 0, textAlign: 'right' }}>
        <div>{bwLabel}</div>
        {request.duplexOffsetMHz !== undefined && (
          <div style={{ color: '#c4b5fd', fontSize: '9px' }}>+{request.duplexOffsetMHz * 1000}k offset</div>
        )}
      </div>
    </div>
  );
}
