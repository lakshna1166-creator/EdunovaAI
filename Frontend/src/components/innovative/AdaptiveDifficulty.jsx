import React, { useState } from 'react';
import { 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  HelpCircle, 
  ShieldAlert, 
  Sliders 
} from 'lucide-react';

export default function AdaptiveDifficulty({ currentLevel = 'medium', onLevelChange }) {
  const [level, setLevel] = useState(currentLevel);
  const [lastAction, setLastAction] = useState('Optimal zone maintained (+1.2x pacing)');

  const levels = [
    {
      id: 'easy',
      name: 'Foundational',
      color: '#059669',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      description: 'Definitions, core intuitive mental models, and guided visual examples.'
    },
    {
      id: 'medium',
      name: 'Intermediate',
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      description: 'Multi-step reasoning, analytical derivations, and direct calculus applications.'
    },
    {
      id: 'hard',
      name: 'Advanced / Olympiad',
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      description: 'Edge-case synthesis, proofs, and multi-concept transfer scenarios.'
    }
  ];

  const handleSelectLevel = (newLevel) => {
    setLevel(newLevel);
    if (newLevel === 'hard') {
      setLastAction('Elevated difficulty: 2 consecutive flawless conceptual answers.');
    } else if (newLevel === 'easy') {
      setLastAction('Lowered cognitive load: Remediation mode active.');
    } else {
      setLastAction('Targeting sweet spot: 85% zone of proximal development.');
    }
    if (onLevelChange) onLevelChange(newLevel);
  };

  const activeLevelObj = levels.find(l => l.id === level) || levels[1];

  return (
    <div
      className="glass-card"
      style={{
        padding: '20px 24px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563EB, #0D9488)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <Sliders size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: 800 }}>
              Adaptive Difficulty Engine
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              Dynamic Calibrator (Zone of Proximal Development)
            </span>
          </div>
        </div>

        {/* Current Active Badge */}
        <span
          style={{
            fontSize: '0.78rem',
            padding: '3px 10px',
            borderRadius: '999px',
            background: activeLevelObj.bg,
            color: activeLevelObj.color,
            border: `1px solid ${activeLevelObj.border}`,
            fontWeight: 800
          }}
        >
          Level: {activeLevelObj.name}
        </span>
      </div>

      {/* Difficulty Level Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
        {levels.map((lvl) => {
          const isActive = level === lvl.id;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => handleSelectLevel(lvl.id)}
              style={{
                padding: '10px 8px',
                borderRadius: '10px',
                border: isActive ? `2px solid ${lvl.color}` : '1px solid #E2E8F0',
                background: isActive ? lvl.bg : '#F8FAFC',
                color: isActive ? lvl.color : '#64748B',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 2px 8px ${lvl.color}25` : 'none'
              }}
            >
              {lvl.name}
            </button>
          );
        })}
      </div>

      {/* Description & Adaptive Status */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '0.82rem' }}>
        <p style={{ margin: 0, color: '#334155', lineHeight: 1.45 }}>
          {activeLevelObj.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563EB', fontWeight: 600, fontSize: '0.76rem', marginTop: '6px' }}>
          <Zap size={13} />
          <span>{lastAction}</span>
        </div>
      </div>
    </div>
  );
}
