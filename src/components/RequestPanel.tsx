import type { CompositeRequest, FrequencyRequest } from '../types';
import { RequestCard } from './RequestCard';
import { CompositeCard } from './CompositeCard';

interface Props {
  requests: FrequencyRequest[];
  compositeGroups: CompositeRequest[];
  allocatedIds: Set<string>;
}

export function RequestPanel({ requests, compositeGroups, allocatedIds }: Props) {
  const isEmpty = requests.length === 0 && compositeGroups.length === 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      overflow: 'hidden',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <div style={{ color: '#475569', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Pending Requests
        </div>
        <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>
          {compositeGroups.length > 0 && `${compositeGroups.length} bundle${compositeGroups.length > 1 ? 's' : ''}`}
          {compositeGroups.length > 0 && requests.length > 0 && ' · '}
          {requests.length > 0 && `${requests.length} unassigned`}
          {!isEmpty && ' · drag to place'}
          {isEmpty && 'All requests assigned'}
        </div>
      </div>

      {/* Request list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {isEmpty ? (
          <div style={{ color: '#cbd5e1', fontSize: '12px', textAlign: 'center', marginTop: '40px', fontStyle: 'italic' }}>
            All requests assigned
          </div>
        ) : (
          <>
            {compositeGroups.map(c => (
              <CompositeCard key={c.id} composite={c} allocatedIds={allocatedIds} />
            ))}
            {requests.map(req => (
              <RequestCard key={req.id} request={req} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
