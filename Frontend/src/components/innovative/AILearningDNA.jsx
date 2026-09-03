import React, { useState } from 'react';
import { 
  Dna, 
  Brain, 
  Globe, 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Gauge, 
  Layers 
} from 'lucide-react';

export default function AILearningDNA({ compact = false, data = {} }) {
  const [selectedLanguage, setSelectedLanguage] = useState(data?.preferredLanguage || 'Not set');
  const learningPace = data?.cognitivePace || 'Not calibrated';
  const hasActivity = Array.isArray(data?.strengths) && data.strengths.length > 0 || Number(data?.conceptMasteryIndex || 0) > 0;

  const languages = ['Not set', 'English (US)', 'Spanish (Español)', 'Mandarin (中文)', 'German (Deutsch)', 'French (Français)', 'Hindi (हिंदी)'];

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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Dna size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#0F172A', fontWeight: 800 }}>
              AI Learning DNA™
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              Real-time Cognitive Learner Fingerprint
            </span>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            padding: '3px 10px',
            borderRadius: '999px',
            background: '#EFF6FF',
            color: '#2563EB',
            border: '1px solid #BFDBFE',
            fontWeight: 700
          }}
        >
          {hasActivity ? 'Adaptive profile active' : 'Awaiting first learning session'}
        </span>
      </div>

      {/* Grid of DNA Attributes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        {/* Modality Breakdown */}
        <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            <Layers size={14} color="#2563EB" />
            <span>Learning Modality</span>
          </div>
          <div style={{ padding: '14px 0 4px', color: '#64748B', lineHeight: 1.6, fontSize: '0.82rem' }}>
            {hasActivity ? 'Your modality profile will adapt from your real learning interactions.' : 'Not enough activity yet. Your AI Tutor will learn your preferred style after you begin a session.'}
          </div>
        </div>

        {/* Cognitive Pace & Language */}
        <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            <Gauge size={14} color="#059669" />
            <span>Pacing & Language</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: '#475569' }}>Cognitive Speed:</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#059669' }}>
              {typeof learningPace === 'number' ? `${learningPace}x` : learningPace}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Preferred Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '0.8rem',
                color: '#0F172A',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cognitive Retention & Strengths */}
        <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            <TrendingUp size={14} color="#7C3AED" />
            <span>Retention Forecast</span>
          </div>

          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7C3AED', marginBottom: '2px' }}>
            {data?.cognitiveRetentionRate || '0%'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            {hasActivity ? 'Calculated from your recorded learning activity' : 'No learning history yet'}
          </span>
        </div>
      </div>

      {/* Strengths & Weak Areas Tags */}
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: '14px' }}>
        {/* Strengths */}
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '12px 14px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
            <CheckCircle2 size={14} />
            <span>Verified Strengths</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(data?.strengths || []).map((tag, i) => (
              <span key={i} style={{ background: '#FFFFFF', border: '1px solid #86EFAC', color: '#166534', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Weak Areas Under Remediation */}
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', padding: '12px 14px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E11D48', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
            <AlertCircle size={14} />
            <span>Active Friction Points</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(data?.areasForGrowth || []).map((tag, i) => (
              <span key={i} style={{ background: '#FFFFFF', border: '1px solid #FDA4AF', color: '#9F1239', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
