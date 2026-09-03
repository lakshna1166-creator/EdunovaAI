import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Zap, 
  CheckCircle2, 
  GraduationCap 
} from 'lucide-react';

export default function AITutorModes({ activeMode = 'socratic', onModeChange }) {
  const [selectedMode, setSelectedMode] = useState(activeMode);

  const modes = [
    {
      id: 'simple',
      title: 'Simple Explanation',
      tag: 'ELI5 / Intuitive',
      desc: 'Zero jargon, relatable everyday metaphors, and visual mental models.',
      icon: Sparkles,
      color: '#0D9488',
      bg: '#F0FDF4'
    },
    {
      id: 'exam',
      title: 'Exam Mode',
      tag: 'Strict Scoring',
      desc: 'AP / University rubric grading, time bounds, and zero hints.',
      icon: GraduationCap,
      color: '#E11D48',
      bg: '#FFF1F2'
    },
    {
      id: 'socratic',
      title: 'Socratic Mode',
      tag: 'Guided Inquiry',
      desc: 'Asks targeted questions and guides you to discover answers yourself.',
      icon: HelpCircle,
      color: '#2563EB',
      bg: '#EFF6FF'
    },
    {
      id: 'deep',
      title: 'Deep Learning',
      tag: 'Math Rigor',
      desc: 'First-principles proofs, LaTeX calculus derivations, and edge cases.',
      icon: Zap,
      color: '#7C3AED',
      bg: '#F5F3FF'
    },
    {
      id: 'revision',
      title: 'Quick Revision',
      tag: 'Fast Flashpoints',
      desc: 'High-density summaries, key formulas, and instant concept checks.',
      icon: BookOpen,
      color: '#D97706',
      bg: '#FEF3C7'
    }
  ];

  const handleSelect = (modeId) => {
    setSelectedMode(modeId);
    if (onModeChange) onModeChange(modeId);
  };

  const activeModeObj = modes.find(m => m.id === selectedMode) || modes[2];

  return (
    <div
      className="glass-card"
      style={{
        padding: '18px 20px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Select AI Tutor Persona:
        </div>
        <span style={{ fontSize: '0.74rem', background: activeModeObj.bg, color: activeModeObj.color, border: `1px solid ${activeModeObj.color}35`, padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
          Active: {activeModeObj.title} ({activeModeObj.tag})
        </span>
      </div>

      {/* Mode Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }} className="tutor-modes-grid">
        {modes.map((m) => {
          const isSelected = selectedMode === m.id;
          const ModeIcon = m.icon;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelect(m.id)}
              style={{
                padding: '10px 8px',
                borderRadius: '10px',
                border: isSelected ? `2px solid ${m.color}` : '1px solid #E2E8F0',
                background: isSelected ? m.bg : '#F8FAFC',
                color: isSelected ? m.color : '#475569',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ModeIcon size={16} color={isSelected ? m.color : '#64748B'} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, lineHeight: 1.2 }}>
                {m.title}
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .tutor-modes-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
