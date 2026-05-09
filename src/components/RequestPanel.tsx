import type { FrequencyRequest, Venue } from '../types';
import { RequestCard } from './RequestCard';

interface Props {
  requests: FrequencyRequest[];
  venues: Venue[];
  selectedVenueId: string;
  onVenueChange: (id: string) => void;
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export function RequestPanel({ requests, venues, selectedVenueId, onVenueChange }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      overflow: 'hidden',
    }}>
      {/* Venue selector */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <label style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
          Venue
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={selectedVenueId}
            onChange={e => onVenueChange(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              color: '#1e293b',
              fontSize: '13px',
              fontWeight: '600',
              padding: '7px 32px 7px 10px',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
            }}
          >
            {venues.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1l5 5 5-5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ color: '#475569', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Pending Requests
        </div>
        <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>
          {requests.length} unassigned · drag to place
        </div>
      </div>

      {/* Request list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {requests.length === 0 ? (
          <div style={{ color: '#cbd5e1', fontSize: '12px', textAlign: 'center', marginTop: '40px', fontStyle: 'italic' }}>
            All requests assigned
          </div>
        ) : (
          [...requests]
            .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
            .map(req => <RequestCard key={req.id} request={req} />)
        )}
      </div>

      {/* Legend */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
          {(['high', 'medium', 'low'] as const).map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#94a3b8' }} />
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'capitalize' }}>{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
