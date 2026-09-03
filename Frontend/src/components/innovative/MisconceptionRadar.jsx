import React, { useState } from 'react';
import { 
  Radar, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Layers 
} from 'lucide-react';

export default function MisconceptionRadar({ selectedId = null, onSelect, data = [] }) {
  const [activeId, setActiveId] = useState(selectedId);
  const activeItem = data.find(m => m.id === activeId) || data[0];

  const handleSelect = (id) => {
    setActiveId(id);
    if (onSelect) onSelect(id);
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #E11D48 0%, #F43F5E 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)'
            }}
          >
            <Radar size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#0F172A', fontWeight: 800 }}>
              Misconception Radar™
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
              Cognitive Distractor & Fallacy Detection
            </span>
          </div>
        </div>

        {activeItem && (
          <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '999px', background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', fontWeight: 800, textTransform: 'uppercase' }}>
            Recorded
          </span>
        )}
      </div>

      {!activeItem ? (
        <div style={{ padding: '28px', textAlign: 'center', borderRadius: '14px', background: '#F8FAFC', border: '1px dashed #CBD5E1', color: '#64748B', lineHeight: 1.6 }}>
          <CheckCircle2 size={28} color="#10B981" style={{ marginBottom: '8px' }} />
          <div style={{ color: '#0F172A', fontWeight: 800, marginBottom: '5px' }}>No misconceptions recorded</div>
          <div>Your radar will populate only after the AI Tutor detects a real misconception during your learning.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
            {data.map((m, idx) => (
              <button key={m.id || idx} type="button" onClick={() => handleSelect(m.id || idx)} style={{ padding: '6px 12px', borderRadius: '8px', border: activeId === (m.id || idx) ? '1px solid #2563EB' : '1px solid #E2E8F0', background: activeId === (m.id || idx) ? '#EFF6FF' : '#F8FAFC', color: activeId === (m.id || idx) ? '#1D4ED8' : '#64748B', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {m.concept || m.misconception || m.category}
              </button>
            ))}
          </div>
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <AlertTriangle size={18} color="#C2410C" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Detected learning friction</div>
                <div style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 600, marginTop: '4px', lineHeight: 1.5 }}>{activeItem.misconception}</div>
              </div>
            </div>
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #FED7AA', fontSize: '0.8rem', color: '#475569' }}>
              <strong>Recorded frequency:</strong> {activeItem.frequency || 'Recorded'}
            </div>
          </div>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '14px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px' }}><Sparkles size={16} /><span>AI remediation</span></div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#166534', lineHeight: 1.55 }}>{activeItem.remediation || 'The AI Tutor will generate a remediation based on this recorded misconception.'}</p>
          </div>
        </>
      )}
    </div>
  );
}
