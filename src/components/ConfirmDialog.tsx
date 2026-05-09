import { useEffect, useRef } from 'react';

interface Props {
  title: string;
  detail: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, detail, confirmLabel = 'Remove', onConfirm, onCancel }: Props) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmBtnRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onConfirm();
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onConfirm, onCancel]);

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
        width: '360px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.14)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
            backgroundColor: '#fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ef4444', fontSize: '17px', fontWeight: '700', lineHeight: 1,
          }}>
            !
          </div>
          <div style={{ color: '#1e293b', fontSize: '15px', fontWeight: '700' }}>{title}</div>
        </div>

        <div style={{
          backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: '6px', padding: '10px 12px', marginBottom: '20px',
          fontFamily: 'ui-monospace, Consolas, monospace', fontSize: '12px',
          color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line',
        }}>
          {detail}
        </div>

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
            ref={confirmBtnRef}
            onClick={onConfirm}
            style={{
              padding: '8px 18px', borderRadius: '6px', border: 'none',
              backgroundColor: '#ef4444',
              color: '#ffffff', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#dc2626')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ef4444')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
