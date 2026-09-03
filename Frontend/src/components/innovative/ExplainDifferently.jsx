import React, { useState } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  Layers, 
  Eye, 
  BookOpen, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

export default function ExplainDifferently({ onSelectExplanation }) {
  const [selectedStyle, setSelectedStyle] = useState('analogy');

  const explanations = {
    analogy: {
      title: 'Mechanical Gear-Train Analogy',
      icon: Lightbulb,
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A',
      content: 'Think of 3 interconnected gears of varying sizes. Rotating Gear A by a tiny millimeter causes Gear B to rotate, which spins Gear C. If the final gear turned too far, the influence of Gear A is found by multiplying each gear ratio together (Gear A ratio × Gear B ratio × Gear C ratio). That is precisely what the Chain Rule calculates.'
    },
    example: {
      title: 'Concrete Numerical Walkthrough',
      icon: Layers,
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      content: 'Let input x = 2, weight w₁ = 3 (so hidden h = 6). Let weight w₂ = 4 (so output ŷ = 24). If target is 20, Error = 4. When we nudge w₁ by +0.1, h becomes 6.2, and ŷ becomes 24.8. The error jumped by 0.8. Notice how the multiplier 4 (from w₂) amplified the shift in w₁! (0.8 = 4 × 0.2).'
    },
    simpler: {
      title: 'Simpler Everyday Language (No Jargon)',
      icon: BookOpen,
      color: '#059669',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      content: 'When an AI makes a mistake at the end of a long calculation, we trace the error backward. If a worker early on made a small decision that got multiplied by 5 managers down the line, we adjust that worker by taking into account all 5 managers\' amplification.'
    },
    visual: {
      title: 'Visual / Geometric Explanation',
      icon: Eye,
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      content: 'Picture a multi-tiered waterfall. Water drops from Level 1 to Level 2 to Level 3. A change in the width of the top gate creates a ripple that cascades through the height of every single step below. The gradient is the slope of that cascading wave.'
    }
  };

  const activeExp = explanations[selectedStyle];

  const handleSelect = (key) => {
    setSelectedStyle(key);
    if (onSelectExplanation) onSelectExplanation(key);
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
        marginTop: '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F172A', fontWeight: 800, fontSize: '0.92rem' }}>
          <RefreshCw size={16} color="#2563EB" />
          <span>Explain Differently: Choose Your Perspective</span>
        </div>
        <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
          Multi-Modal Remediation
        </span>
      </div>

      {/* 4 Selector Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }} className="explain-tabs-grid">
        {[
          { id: 'analogy', label: '💡 Analogy' },
          { id: 'example', label: '🧩 Number Example' },
          { id: 'simpler', label: '📖 Simpler Language' },
          { id: 'visual', label: '🎨 Visual Diagram' }
        ].map((tab) => {
          const isActive = selectedStyle === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              style={{
                padding: '8px 6px',
                borderRadius: '8px',
                border: isActive ? '2px solid #2563EB' : '1px solid #E2E8F0',
                background: isActive ? '#EFF6FF' : '#F8FAFC',
                color: isActive ? '#1D4ED8' : '#64748B',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Explanation Content */}
      <div
        style={{
          background: activeExp.bg,
          border: `1px solid ${activeExp.border}`,
          borderRadius: '12px',
          padding: '16px',
          fontSize: '0.9rem',
          color: '#1E293B',
          lineHeight: 1.6
        }}
      >
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: activeExp.color, marginBottom: '6px', textTransform: 'uppercase' }}>
          {activeExp.title}
        </div>
        <p style={{ margin: 0 }}>
          {activeExp.content}
        </p>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .explain-tabs-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
