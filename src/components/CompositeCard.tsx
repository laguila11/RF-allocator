import type { CompositeRequest } from '../types';
import { RequestCard } from './RequestCard';

interface Props {
  composite: CompositeRequest;
  allocatedIds: Set<string>;
}

export function CompositeCard({ composite, allocatedIds }: Props) {
  const total = composite.memberRequests.length;
  const allocated = composite.memberRequests.filter(r => allocatedIds.has(r.id)).length;
  const allDone = allocated === total;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      marginBottom: '10px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      {/* Group header */}
      <div style={{
        padding: '8px 10px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'flex-start', gap: '8px',
      }}>
        {/* Bundle icon */}
        <div style={{
          width: '20px', height: '20px', flexShrink: 0, marginTop: '1px',
          display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: '3px', borderRadius: '1px', backgroundColor: i < allocated ? '#16a34a' : '#cbd5e1' }} />
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '12px', lineHeight: 1.3 }}>
            {composite.label}
          </div>
          <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px', lineHeight: 1.3 }}>
            {composite.description}
          </div>
        </div>

        <div style={{
          fontSize: '10px', fontWeight: '700', flexShrink: 0,
          color: allDone ? '#15803d' : '#92400e',
          backgroundColor: allDone ? '#dcfce7' : '#fef9c3',
          border: `1px solid ${allDone ? '#86efac' : '#fde68a'}`,
          borderRadius: '4px', padding: '2px 7px', lineHeight: 1.6,
        }}>
          {allocated}/{total}
        </div>
      </div>

      {/* Member requests */}
      <div style={{ padding: '6px 8px 2px' }}>
        {composite.memberRequests.map(req => {
          if (allocatedIds.has(req.id)) {
            return (
              <div key={req.id} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '5px 8px', marginBottom: '4px',
                borderRadius: '5px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
              }}>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  backgroundColor: '#16a34a', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#166534' }}>{req.label}</span>
                <span style={{ fontSize: '10px', color: '#86efac', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {req.device}
                </span>
              </div>
            );
          }
          return <RequestCard key={req.id} request={req} />;
        })}
      </div>
    </div>
  );
}
