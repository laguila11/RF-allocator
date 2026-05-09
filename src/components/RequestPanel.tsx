import type { FrequencyRequest, Venue } from '../types';
import { RequestCard } from './RequestCard';

interface Props {
  requests: FrequencyRequest[];
  venues: Venue[];
  selectedVenueId: string;
  onVenueChange: (id: string) => void;
}

export function RequestPanel({ requests, venues, selectedVenueId, onVenueChange }: Props) {
  const byPriority = (a: FrequencyRequest, b: FrequencyRequest) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  };

  return (
    <div style={{
      padding: '16px',
      borderLeft: '1px solid #1e293b',
      overflowY: 'auto',
      backgroundColor: '#0a0f1e',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Venue selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ color: '#475569', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
          Venue
        </label>
        <select
          value={selectedVenueId}
          onChange={e => onVenueChange(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            color: '#f1f5f9',
            fontSize: '13px',
            fontWeight: '600',
            padding: '7px 10px',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23475569' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            paddingRight: '28px',
          }}
        >
          {venues.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* Pending list */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Pending
        </div>
        <div style={{ color: '#475569', fontSize: '11px', marginTop: '3px' }}>
          {requests.length} unassigned · drag to assign
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {requests.length === 0 ? (
          <div style={{ color: '#1e3a5f', fontSize: '12px', textAlign: 'center', marginTop: '40px', fontStyle: 'italic' }}>
            All requests assigned
          </div>
        ) : (
          [...requests].sort(byPriority).map(req => (
            <RequestCard key={req.id} request={req} />
          ))
        )}
      </div>

      <div style={{ paddingTop: '16px', borderTop: '1px solid #1e293b', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {(['high', 'medium', 'low'] as const).map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                backgroundColor: p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#6b7280',
              }} />
              <span style={{ color: '#475569', fontSize: '10px', textTransform: 'capitalize' }}>{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
