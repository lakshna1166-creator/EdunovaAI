import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  BookOpen 
} from 'lucide-react';
import Button from '../common/Button';

export default function SmartStudyPlanner({ onStartSession }) {
  const [availableTime, setAvailableTime] = useState(45); // in minutes

  const plans = {
    15: [
      { time: '5 mins', activity: 'Socratic Flashpoint Review', focus: 'Chain Rule Derivatives', color: '#2563EB' },
      { time: '10 mins', activity: '3-Question Adaptive Sprint', focus: 'Layer Sensitivity Diagnostics', color: '#059669' }
    ],
    30: [
      { time: '8 mins', activity: 'Misconception Interception', focus: 'Tabular Integration Sign Rules', color: '#E11D48' },
      { time: '14 mins', activity: '1-on-1 AI Teacher Dialogue', focus: 'Backprop Gradient Chaining', color: '#2563EB' },
      { time: '8 mins', activity: 'Adaptive Final Quiz', focus: 'Mastery Score Verification', color: '#059669' }
    ],
    45: [
      { time: '10 mins', activity: 'Prerequisite Spaced Recall', focus: 'Eigenvalues & Matrix Dot Products', color: '#7C3AED' },
      { time: '20 mins', activity: 'Core AI Lesson & Derivations', focus: 'Vanishing Gradients & Activation Fixes', color: '#2563EB' },
      { time: '15 mins', activity: 'Socratic Problem Scenarios', focus: 'Interactive Case Simulations', color: '#059669' }
    ],
    60: [
      { time: '12 mins', activity: 'Cognitive Warmup & Review', focus: 'Neural Network Architectures', color: '#7C3AED' },
      { time: '25 mins', activity: 'Deep Socratic Tutoring Session', focus: 'Transformer Multi-Head Attention', color: '#2563EB' },
      { time: '13 mins', activity: 'Misconception Stress-Test', focus: 'Edge Cases & Mathematical Proofs', color: '#E11D48' },
      { time: '10 mins', activity: 'Mastery Quiz & Report Sync', focus: 'Verified Milestone Logging', color: '#059669' }
    ]
  };

  const currentPlan = plans[availableTime] || plans[45];

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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <Clock size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#0F172A', fontWeight: 800 }}>
              Smart Study Planner™
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
              Adaptive Time-Budgeted Learning Generator
            </span>
          </div>
        </div>

        <span style={{ fontSize: '0.75rem', background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', padding: '3px 10px', borderRadius: '999px', fontWeight: 700 }}>
          Today's Optimized Schedule
        </span>
      </div>

      {/* Time Selector Buttons */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 700, marginBottom: '8px' }}>
          How much time do you have right now?
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[15, 30, 45, 60].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setAvailableTime(mins)}
              style={{
                padding: '8px 4px',
                borderRadius: '10px',
                border: availableTime === mins ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                background: availableTime === mins ? '#F5F3FF' : '#F8FAFC',
                color: availableTime === mins ? '#6D28D9' : '#64748B',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              {mins} Mins
            </button>
          ))}
        </div>
      </div>

      {/* Generated Plan Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
        {currentPlan.map((block, idx) => (
          <div
            key={idx}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: block.color,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: `${block.color}15`,
                  border: `1px solid ${block.color}35`,
                  whiteSpace: 'nowrap'
                }}
              >
                {block.time}
              </span>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                  {block.activity}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                  Target: {block.focus}
                </div>
              </div>
            </div>
            <Zap size={15} color={block.color} style={{ flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* Quick Launch CTA */}
      <Button
        variant="primary"
        size="md"
        to="/student/start-learning"
        iconRight={ArrowRight}
        style={{ width: '100%' }}
      >
        Start {availableTime}-Minute Adaptive Session
      </Button>
    </div>
  );
}
