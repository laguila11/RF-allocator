import { useEffect, useRef, useState } from 'react';
import type { PendingReserve } from '../types';

interface Props {
  pending: PendingReserve;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function ReserveDialog({ pending, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const bwkHz = Math.round((pending.endMHz - pending.startMHz) * 1000);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && reason.trim()) onConfirm(reason.trim());
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(15,23,42,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000,
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        width: '380px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.14)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', flexShrink: 0,
          }}>
            🚧
          </div>
          <div>
            <div style={{ color: '#1e293b', fontSize: '15px', fontWeight: '700' }}>Reserve Frequencies</div>
            <div style={{ color: '#64748b', fontSize: '12px', fontFamily: 'ui-monospace, monospace', marginTop: '1px' }}>
              {pending.startMHz.toFixed(3)} – {pending.endMHz.toFixed(3)} MHz · {bwkHz} kHz
            </div>
          </div>
        </div>

        <label style={{ color: '#475569', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
          Reason <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          ref={inputRef}
          value={reason}
          onChange={e => setReason(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Guard band, Intermod zone, TV channel 21…"
          style={{
            width: '100%',
            padding: '9px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#1e293b',
            outline: 'none',
            marginBottom: '20px',
            boxSizing: 'border-box',
          }}
          onFocus={e => (e.target.style.borderColor = '#f59e0b')}
          onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
        />

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 18px', borderRadius: '6px',
              border: '1px solid #e2e8f0', backgroundColor: '#ffffff',
              color: '#64748b', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            style={{
              padding: '8px 18px', borderRadius: '6px', border: 'none',
              backgroundColor: reason.trim() ? '#f59e0b' : '#fde68a',
              color: '#ffffff', fontSize: '13px', fontWeight: '600',
              cursor: reason.trim() ? 'pointer' : 'default',
              transition: 'background-color 0.15s',
            }}
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
}
