import type { FrequencyRequest, Service, Venue } from '../types';
import { RequestCard } from './RequestCard';

interface Props {
  requests: FrequencyRequest[];
  venues: Venue[];
  services: Service[];
  selectedVenueId: string;
  selectedServiceId: string;
  onVenueChange: (id: string) => void;
  onServiceChange: (id: string) => void;
}

function ChevronIcon() {
  return (
    <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      width="12" height="8" viewBox="0 0 12 8" fill="none">
      <path d="M1 1l5 5 5-5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const selectStyle: React.CSSProperties = {
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
};

export function RequestPanel({
  requests, venues, services,
  selectedVenueId, selectedServiceId,
  onVenueChange, onServiceChange,
}: Props) {
  const filtered = selectedServiceId === 'all'
    ? requests
    : requests.filter(r => r.serviceId === selectedServiceId);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      overflow: 'hidden',
    }}>
      {/* Selectors */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
            Venue
          </label>
          <div style={{ position: 'relative' }}>
            <select value={selectedVenueId} onChange={e => onVenueChange(e.target.value)} style={selectStyle}>
              {venues.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <ChevronIcon />
          </div>
        </div>

        <div>
          <label style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
            Service
          </label>
          <div style={{ position: 'relative' }}>
            <select value={selectedServiceId} onChange={e => onServiceChange(e.target.value)} style={selectStyle}>
              <option value="all">All Services</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronIcon />
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ color: '#475569', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Pending Requests
        </div>
        <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>
          {filtered.length} unassigned · drag to place
        </div>
      </div>

      {/* Request list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {filtered.length === 0 ? (
          <div style={{ color: '#cbd5e1', fontSize: '12px', textAlign: 'center', marginTop: '40px', fontStyle: 'italic' }}>
            {requests.length === 0 ? 'All requests assigned' : 'No requests for this service'}
          </div>
        ) : (
          filtered.map(req => <RequestCard key={req.id} request={req} />)
        )}
      </div>

      {/* Color legend */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Color = Venue</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {venues.map(v => {
            const svcId = selectedServiceId !== 'all' ? selectedServiceId : 'svc-wmic';
            const sampleReq = v.requests.find(r => r.serviceId === svcId) ?? v.requests[0];
            return (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: sampleReq?.color ?? '#94a3b8', flexShrink: 0 }} />
                <span style={{ color: '#64748b', fontSize: '11px' }}>{v.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
