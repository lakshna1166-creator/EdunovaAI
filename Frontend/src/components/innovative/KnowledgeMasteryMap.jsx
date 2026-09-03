import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Filter, 
  Sparkles 
} from 'lucide-react';

export default function KnowledgeMasteryMap({ compact = false, data = [] }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'mastered' | 'learning' | 'needs_practice'

  const filteredItems = data.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'mastered') return String(item.status).toLowerCase().includes('mastered');
    if (filter === 'learning') return String(item.status).toLowerCase().includes('progress');
    if (filter === 'needs_practice') return String(item.status).toLowerCase().includes('review');
    return true;
  });

  const counts = {
    mastered: data.filter(i => String(i.status).toLowerCase().includes('mastered')).length,
    learning: data.filter(i => String(i.status).toLowerCase().includes('progress')).length,
    needs_practice: data.filter(i => String(i.status).toLowerCase().includes('review')).length
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: compact ? '20px' : '28px',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      {/* Header & Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#0F172A', fontWeight: 800 }}>
              Knowledge Mastery Map™
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Concept Mastery Radar across Enrolled Domains
            </span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              border: filter === 'all' ? '1px solid #2563EB' : '1px solid #E2E8F0',
              background: filter === 'all' ? '#EFF6FF' : '#F8FAFC',
              color: filter === 'all' ? '#1D4ED8' : '#64748B',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            All ({data.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('mastered')}
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              border: filter === 'mastered' ? '1px solid #059669' : '1px solid #E2E8F0',
              background: filter === 'mastered' ? '#ECFDF5' : '#F8FAFC',
              color: filter === 'mastered' ? '#065F46' : '#64748B',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🟢 Mastered ({counts.mastered})
          </button>
          <button
            type="button"
            onClick={() => setFilter('learning')}
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              border: filter === 'learning' ? '1px solid #2563EB' : '1px solid #E2E8F0',
              background: filter === 'learning' ? '#EFF6FF' : '#F8FAFC',
              color: filter === 'learning' ? '#1D4ED8' : '#64748B',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🔵 Learning ({counts.learning})
          </button>
          <button
            type="button"
            onClick={() => setFilter('needs_practice')}
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              border: filter === 'needs_practice' ? '1px solid #D97706' : '1px solid #E2E8F0',
              background: filter === 'needs_practice' ? '#FEF3C7' : '#F8FAFC',
              color: filter === 'needs_practice' ? '#92400E' : '#64748B',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🟡 Needs Practice ({counts.needs_practice})
          </button>
        </div>
      </div>

      {/* Grid of Concept Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'repeat(2, 1fr)',
          gap: '12px'
        }}
      >
        {filteredItems.map((item) => {
          let badgeColor = '#059669';
          let badgeBg = '#ECFDF5';
          let badgeBorder = '#A7F3D0';
          let label = 'Mastered';

          if (String(item.status).toLowerCase().includes('progress')) {
            badgeColor = '#2563EB';
            badgeBg = '#EFF6FF';
            badgeBorder = '#BFDBFE';
            label = 'In Progress';
          } else if (String(item.status).toLowerCase().includes('review')) {
            badgeColor = '#D97706';
            badgeBg = '#FEF3C7';
            badgeBorder = '#FDE68A';
            label = 'Needs Practice';
          }

          return (
            <div
              key={item.id}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  {item.category || 'Learning'}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                  {item.name || item.title}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                  Last active: {item.lastPracticed ? new Date(item.lastPracticed).toLocaleDateString() : 'Recorded activity'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: badgeColor }}>
                  {Number(item.score ?? item.mastery ?? 0)}%
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: badgeBg,
                    color: badgeColor,
                    border: `1px solid ${badgeBorder}`,
                    fontWeight: 700,
                    display: 'inline-block',
                    marginTop: '2px'
                  }}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
