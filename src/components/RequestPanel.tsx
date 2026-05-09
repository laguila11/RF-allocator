import type { CompositeRequest, FrequencyRequest, Service, Venue } from '../types';
import { RequestCard } from './RequestCard';
import { CompositeCard } from './CompositeCard';

interface Props {
  requests: FrequencyRequest[];
  compositeGroups: CompositeRequest[];
  allocatedIds: Set<string>;
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
  requests, compositeGroups, allocatedIds,
  venues, services,
  selectedVenueId, selectedServiceId,
  onVenueChange, onServiceChange,
}: Props) {
  // Filter standalone requests by service
  const filteredRequests = selectedServiceId === 'all'
    ? requests
    : requests.filter(r => r.serviceId === selectedServiceId);

  // Composite groups appear under "All Services" or "Other Services"
  const filteredComposites = selectedServiceId === 'all' || selectedServiceId === 'svc-other'
    ? compositeGroups
    : [];

  const isEmpty = filteredRequests.length === 0 && filteredComposites.length === 0;

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
          {filteredRequests.length > 0 && `${filteredRequests.length} unassigned`}
          {filteredRequests.length > 0 && filteredComposites.length > 0 && ' · '}
          {filteredComposites.length > 0 && `${filteredComposites.length} bundle${filteredComposites.length > 1 ? 's' : ''} pending`}
          {!isEmpty && ' · drag to place'}
          {isEmpty && (requests.length === 0 && compositeGroups.length === 0 ? 'All requests assigned' : 'No requests for this service')}
        </div>
      </div>

      {/* Request list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {isEmpty ? (
          <div style={{ color: '#cbd5e1', fontSize: '12px', textAlign: 'center', marginTop: '40px', fontStyle: 'italic' }}>
            {requests.length === 0 && compositeGroups.length === 0
              ? 'All requests assigned'
              : 'No requests for this service'}
          </div>
        ) : (
          <>
            {filteredComposites.map(c => (
              <CompositeCard key={c.id} composite={c} allocatedIds={allocatedIds} />
            ))}
            {filteredRequests.map(req => (
              <RequestCard key={req.id} request={req} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
