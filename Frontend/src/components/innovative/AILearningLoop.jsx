import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  CheckCircle, 
  Radar, 
  Sliders, 
  Sparkles, 
  Award, 
  Compass, 
  ArrowRight, 
  RefreshCw 
} from 'lucide-react';

const loopStages = [
  {
    step: '01',
    title: 'LEARN',
    desc: 'Student accesses personalized modular lesson generated from textbook, syllabus, or topic query.',
    icon: BookOpen,
    color: '#2563EB',
    bg: '#EFF6FF',
    badge: 'Cognitive Ingestion'
  },
  {
    step: '02',
    title: 'ANSWER',
    desc: 'Student engages in Socratic interaction, solves problem scenarios, or explains concept in natural language.',
    icon: HelpCircle,
    color: '#4F46E5',
    bg: '#EEF2FF',
    badge: 'Active Recall'
  },
  {
    step: '03',
    title: 'EVALUATE',
    desc: 'Multi-agent LLM evaluates cognitive reasoning paths, mathematical derivation steps, and semantic accuracy.',
    icon: CheckCircle,
    color: '#0284C7',
    bg: '#F0F9FF',
    badge: 'Real-Time Assessment'
  },
  {
    step: '04',
    title: 'DETECT MISCONCEPTION',
    desc: 'Pins the exact root cognitive fallacy from distractors rather than just marking the answer incorrect.',
    icon: Radar,
    color: '#E11D48',
    bg: '#FFF1F2',
    badge: 'Fallacy Interception'
  },
  {
    step: '05',
    title: 'ADAPT',
    desc: 'Calibrates explanation modality (Visual, Analogy, Mathematical, or Simpler) and adjusts difficulty dynamically.',
    icon: Sliders,
    color: '#D97706',
    bg: '#FEF3C7',
    badge: 'Dynamic Calibration'
  },
  {
    step: '06',
    title: 'RE-TEACH',
    desc: 'Synthesizes targeted intuitive analogies, interactive diagrams, or gear-train simulations to bridge the gap.',
    icon: Sparkles,
    color: '#0D9488',
    bg: '#F0FDF4',
    badge: 'Remediation Engine'
  },
  {
    step: '07',
    title: 'RE-TEST',
    desc: 'Presents a fresh isomorphic transfer scenario to verify that the core misconception has been completely corrected.',
    icon: RefreshCw,
    color: '#6366F1',
    bg: '#F5F3FF',
    badge: 'Concept Verification'
  },
  {
    step: '08',
    title: 'MASTERY',
    desc: 'Logs verified mastery into the student\'s Knowledge Map and calculates Ebbinghaus retention curves.',
    icon: Award,
    color: '#059669',
    bg: '#ECFDF5',
    badge: 'Mastery Confirmed'
  },
  {
    step: '09',
    title: 'NEXT RECOMMENDATION',
    desc: 'Predicts the optimal next prerequisite concept based on curriculum graphs and knowledge dependency trees.',
    icon: Compass,
    color: '#7C3AED',
    bg: '#FAF5FF',
    badge: 'Curriculum Progression'
  }
];

export default function AILearningLoop() {
  const [activeStep, setActiveStep] = useState(0);
  const current = loopStages[activeStep];
  const Icon = current.icon;

  return (
    <div
      className="glass-card"
      style={{
        padding: '36px',
        borderRadius: '24px',
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        boxShadow: 'var(--shadow-card)',
        margin: '20px 0'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 32px' }}>
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#2563EB',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '4px 12px',
            borderRadius: '999px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            display: 'inline-block',
            marginBottom: '10px'
          }}
        >
          Closed-Loop Cognitive Architecture
        </span>
        <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', color: '#0F172A', fontWeight: 800, marginBottom: '8px' }}>
          The 9-Stage <span className="gradient-text-brand">AI Learning Loop</span>
        </h3>
        <p style={{ color: '#475569', fontSize: '0.95rem' }}>
          How EduNovaAI turns learning friction into guaranteed concept retention through continuous diagnostic remediation.
        </p>
      </div>

      {/* 9 Stage Flow Pills */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '16px',
          marginBottom: '28px'
        }}
        className="loop-grid-nav"
      >
        {loopStages.map((st, i) => {
          const isCurrent = activeStep === i;
          const StageIcon = st.icon;

          return (
            <button
              key={st.step}
              type="button"
              onClick={() => setActiveStep(i)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 6px',
                borderRadius: '12px',
                border: isCurrent ? `2px solid ${st.color}` : '1px solid #E2E8F0',
                background: isCurrent ? st.bg : '#F8FAFC',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '85px',
                boxShadow: isCurrent ? `0 4px 12px ${st.color}25` : 'none'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: isCurrent ? st.color : '#E2E8F0',
                  color: isCurrent ? '#FFFFFF' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <StageIcon size={14} />
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isCurrent ? st.color : '#64748B', textTransform: 'uppercase', textAlign: 'center' }}>
                {st.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Stage Deep Dive Highlight */}
      <div
        style={{
          background: current.bg,
          border: `1px solid ${current.color}40`,
          borderRadius: '18px',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', maxWidth: '720px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: current.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0,
              boxShadow: `0 4px 12px ${current.color}35`
            }}
          >
            <Icon size={24} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: current.color, textTransform: 'uppercase' }}>
                Stage {current.step} • {current.badge}
              </span>
            </div>
            <h4 style={{ fontSize: '1.25rem', color: '#0F172A', fontWeight: 800, marginBottom: '6px' }}>
              {current.title}
            </h4>
            <p style={{ margin: 0, color: '#334155', fontSize: '0.92rem', lineHeight: 1.55 }}>
              {current.desc}
            </p>
          </div>
        </div>

        {/* Next / Previous quick stepper */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : loopStages.length - 1))}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#475569',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setActiveStep((prev) => (prev + 1) % loopStages.length)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: current.color,
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Next Stage</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .loop-grid-nav {
            display: flex !important;
            flex-wrap: nowrap !important;
          }
        }
      `}</style>
    </div>
  );
}
