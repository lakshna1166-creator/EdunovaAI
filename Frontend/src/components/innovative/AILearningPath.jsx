import React from 'react';
import { 
  CheckCircle2, 
  CircleDot, 
  Lock, 
  ArrowRight, 
  BookOpen, 
  HelpCircle, 
  Award, 
  Compass, 
  Sparkles 
} from 'lucide-react';

export default function AILearningPath({ activeStage = 'Practice' }) {
  const nodes = [
    { title: 'Topic Ingest', icon: BookOpen, status: 'completed', desc: 'Backprop & Chain Rule' },
    { title: 'Concepts', icon: Sparkles, status: 'completed', desc: 'Layer Function Compositions' },
    { title: 'Practice', icon: HelpCircle, status: 'current', desc: '1-on-1 Socratic Scenarios' },
    { title: 'Quiz', icon: Award, status: 'upcoming', desc: 'Adaptive Diagnostic Test' },
    { title: 'Mastery', icon: CheckCircle2, status: 'upcoming', desc: 'Ebbinghaus Memory Verification' },
    { title: 'Next Topic', icon: Compass, status: 'upcoming', desc: 'Vanishing Gradients & ReLU' }
  ];

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '24px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#2563EB" />
          <h4 style={{ fontSize: '1rem', color: '#0F172A', fontWeight: 800 }}>
            AI Adaptive Learning Path
          </h4>
        </div>
        <span style={{ fontSize: '0.78rem', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 10px', borderRadius: '999px', fontWeight: 700 }}>
          Step 3 of 6 • Active Session
        </span>
      </div>

      {/* Horizontal Path Flow */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '10px'
        }}
        className="learning-path-flow"
      >
        {nodes.map((node, i) => {
          const isCompleted = node.status === 'completed';
          const isCurrent = node.status === 'current';
          const NodeIcon = node.icon;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '14px 8px',
                borderRadius: '12px',
                background: isCurrent ? '#EFF6FF' : isCompleted ? '#F0FDF4' : '#F8FAFC',
                border: isCurrent ? '2px solid #2563EB' : isCompleted ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                position: 'relative',
                minWidth: '110px'
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: isCurrent ? '#2563EB' : isCompleted ? '#059669' : '#E2E8F0',
                  color: isCurrent || isCompleted ? '#FFFFFF' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                  boxShadow: isCurrent ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none'
                }}
              >
                {isCompleted ? <CheckCircle2 size={16} /> : isCurrent ? <NodeIcon size={16} /> : <Lock size={15} />}
              </div>

              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isCurrent ? '#1D4ED8' : isCompleted ? '#065F46' : '#64748B', marginBottom: '2px' }}>
                {node.title}
              </span>

              <span style={{ fontSize: '0.7rem', color: '#64748B', lineHeight: 1.2 }}>
                {node.desc}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .learning-path-flow {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
