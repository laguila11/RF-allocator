import type { FrequencyRequest } from '../types';
import { RequestCard } from './RequestCard';

interface Props {
  requests: FrequencyRequest[];
}

export function RequestPanel({ requests }: Props) {
  const byPriority = (a: FrequencyRequest, b: FrequencyRequest) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  };

  return (
    <div style={{
      padding: '20px 16px',
      borderLeft: '1px solid #1e293b',
      overflowY: 'auto',
      backgroundColor: '#0a0f1e',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Pending
        </h2>
        <p style={{ color: '#475569', fontSize: '11px', margin: '4px 0 0' }}>
          {requests.length} unassigned · drag to assign
        </p>
      </div>

      {requests.length === 0 ? (
        <div style={{ color: '#1e3a5f', fontSize: '12px', textAlign: 'center', marginTop: '40px', fontStyle: 'italic' }}>
          All requests assigned
        </div>
      ) : (
        [...requests].sort(byPriority).map(req => (
          <RequestCard key={req.id} request={req} />
        ))
      )}

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {(['high', 'medium', 'low'] as const).map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#6b7280' }} />
              <span style={{ color: '#475569', fontSize: '10px', textTransform: 'capitalize' }}>{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
