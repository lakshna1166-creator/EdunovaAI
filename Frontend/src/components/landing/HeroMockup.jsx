import React from 'react';
import { 
  Bot, 
  User, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Cpu, 
  Zap, 
  BookOpen
} from 'lucide-react';

export default function HeroMockup() {
  return (
    <div
      className="glass-card"
      style={{
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        borderRadius: '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 40px rgba(37, 99, 235, 0.06)',
        background: '#FFFFFF',
        overflow: 'hidden'
      }}
    >
      {/* Mockup Top Application Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 22px',
          borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFC',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Window controls and Topic */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#EF4444' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#F59E0B' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#10B981' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '10px', borderLeft: '1px solid #E2E8F0' }}>
            <Cpu size={16} color="#2563EB" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
              Topic: Neural Networks & Backpropagation
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '999px',
                background: '#EFF6FF',
                color: '#2563EB',
                border: '1px solid #BFDBFE',
                fontWeight: 700
              }}
            >
              Adaptive Mode Active
            </span>
          </div>
        </div>

        {/* Live Mastery Meter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>Concept Mastery:</span>
            <div
              style={{
                width: '90px',
                height: '8px',
                background: '#E2E8F0',
                borderRadius: '999px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: '92%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #2563EB, #10B981)',
                  borderRadius: '999px'
                }}
              />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669' }}>92%</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '8px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#059669',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            <Zap size={14} />
            <span>AI Teacher Live</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Screen Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: '380px' }} className="hero-mockup-grid">
        {/* Left Column: Socratic Dialogue Stream */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '1px solid #E2E8F0' }}>
          {/* AI Message */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              <Bot size={18} color="#FFFFFF" />
            </div>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                borderTopLeftRadius: '4px',
                padding: '14px 18px',
                fontSize: '0.92rem',
                color: '#1E293B',
                lineHeight: 1.5,
                maxWidth: '92%'
              }}
            >
              <p style={{ margin: 0 }}>
                Let's test our intuition. Why do we apply the <strong>Chain Rule</strong> during the backward pass rather than calculating each layer's gradient independently?
              </p>
            </div>
          </div>

          {/* Student Answer */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
            <div
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '14px',
                borderTopRightRadius: '4px',
                padding: '12px 18px',
                fontSize: '0.9rem',
                color: '#1E3A8A',
                lineHeight: 1.5,
                maxWidth: '85%'
              }}
            >
              <p style={{ margin: 0 }}>
                "Because each layer multiplies the inputs directly, so we just add the errors together at the end?"
              </p>
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <User size={18} color="#475569" />
            </div>
          </div>

          {/* Misconception Detection Alert Banner */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <AlertCircle size={18} color="#E11D48" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#9F1239', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Misconception Detected & Intercepted
              </div>
              <div style={{ fontSize: '0.85rem', color: '#881337', marginTop: '2px', lineHeight: 1.4 }}>
                Error propagation is <strong>multiplicative composite</strong>, not additive. Neural layers act as function compositions \(f(g(x))\).
              </div>
            </div>
          </div>

          {/* AI Adaptive Re-Teaching Card */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0D9488, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
              }}
            >
              <Sparkles size={18} color="#FFFFFF" />
            </div>
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '14px',
                padding: '14px 18px',
                fontSize: '0.9rem',
                color: '#166534',
                lineHeight: 1.5,
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#059669', fontWeight: 700, fontSize: '0.8rem' }}>
                <RefreshCw size={14} />
                <span>Adaptive Visual Analogy</span>
              </div>
              <p style={{ margin: 0, color: '#166534' }}>
                Think of a chain of gears: turning Gear A rotates Gear B, which rotates Gear C. A small change in Gear A multiplies through every connection. That is why we compute:
              </p>
              <div
                style={{
                  margin: '8px 0 0 0',
                  padding: '8px 14px',
                  background: '#0F172A',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.85rem',
                  color: '#38BDF8'
                }}
              >
                {'∂L/∂w₁ = (∂L/∂y) · (∂y/∂h) · (∂h/∂w₁)'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Cognitive Diagnostics */}
        <div
          style={{
            padding: '22px',
            background: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Cognitive Profile
            </div>
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748B' }}>Learning Style</span>
                <span style={{ color: '#2563EB', fontWeight: 700 }}>Visual + Socratic</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748B' }}>Pace Calibrator</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>Optimal (1.2x)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748B' }}>Prerequisites</span>
                <span style={{ color: '#4F46E5', fontWeight: 700 }}>Verified (100%)</span>
              </div>
            </div>
          </div>

          {/* RAG Knowledge Grounding */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              RAG Sources Ingested
            </div>
            <div
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#1E3A8A', fontWeight: 600 }}>
                <BookOpen size={14} color="#2563EB" />
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  DeepLearning_Book_Ch6.pdf
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                Chunk vector similarity: <strong style={{ color: '#2563EB' }}>0.96</strong>
              </div>
            </div>
          </div>

          {/* Upcoming Concept Milestone */}
          <div style={{ marginTop: 'auto' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
                border: '1px solid #BFDBFE',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 600 }}>Next Topic Recommendation:</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                Activation Functions & Vanishing Gradients
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .hero-mockup-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
