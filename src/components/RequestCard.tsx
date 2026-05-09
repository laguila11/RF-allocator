import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { FrequencyRequest } from '../types';

const PRIORITY_DOT: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#6b7280',
};

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
        backgroundColor: '#1e293b',
        border: `2px solid ${request.color}`,
        borderRadius: '6px',
        padding: '8px 10px',
        marginBottom: '8px',
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none',
        boxShadow: overlay ? '0 4px 16px rgba(0,0,0,0.5)' : 'none',
      }}
      {...attributes}
      {...listeners}
    >
      <div style={{
        width: '9px', height: '9px', borderRadius: '50%',
        backgroundColor: PRIORITY_DOT[request.priority], flexShrink: 0,
      }} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontWeight: '700', color: '#f1f5f9', fontSize: '13px' }}>{request.label}</div>
        <div style={{ color: '#94a3b8', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {request.device}
        </div>
      </div>
      <div style={{ color: '#64748b', fontSize: '11px', flexShrink: 0 }}>{bwLabel}</div>
    </div>
  );
}
