import React from 'react';
import { 
  UserCheck, 
  Database, 
  MessageSquareText, 
  ShieldAlert, 
  Sliders, 
  Globe, 
  CheckCircle2, 
  BarChart3, 
  Sparkles, 
  Layers, 
  Zap, 
  Check, 
  X 
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import CTA from '../../components/landing/CTA';
import { aiFeatures } from '../../data/landingData';

const featureIconMap = {
  UserCheck,
  Database,
  MessageSquareText,
  ShieldAlert,
  Sliders,
  Globe,
  CheckCircle2,
  BarChart3
};

export default function FeaturesPage() {
  return (
    <div style={{ paddingTop: '120px', background: '#FFFFFF' }}>
      <div className="container">
        <PageHeader
          badgeText="Next-Gen Architecture"
          badgeIcon={Layers}
          title="AI-Powered"
          highlightText="Personalized Learning Features"
          description="Explore the cognitive engineering, RAG retrieval mechanisms, and adaptive Socratic systems that make EduNovaAI your ultimate personal AI teacher."
          breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Features' }]}
        />

        {/* 8 Core Features Expanded Grid */}
        <div className="grid-2" style={{ gap: '28px', marginBottom: '80px' }}>
          {aiFeatures.map((feat) => {
            const Icon = featureIconMap[feat.icon] || Sparkles;

            return (
              <div
                key={feat.id}
                className="glass-card"
                style={{
                  padding: '36px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '24px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      background: `rgba(${parseInt(feat.color.slice(1, 3), 16)}, ${parseInt(feat.color.slice(3, 5), 16)}, ${parseInt(feat.color.slice(5, 7), 16)}, 0.1)`,
                      border: `1px solid ${feat.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: feat.color,
                      boxShadow: `0 4px 12px ${feat.color}20`
                    }}
                  >
                    <Icon size={26} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      background: '#F1F5F9',
                      color: '#334155',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    {feat.tag}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '12px', color: '#0F172A' }}>
                  {feat.title}
                </h3>

                <p style={{ fontSize: '0.96rem', color: '#475569', lineHeight: 1.65, marginBottom: '20px' }}>
                  {feat.description}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#2563EB', fontWeight: 600 }}>
                  <Zap size={14} />
                  <span>Real-time cognitive evaluation active</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table: Traditional Chatbots vs EduNovaAI */}
        <div style={{ marginBottom: '80px' }}>
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 40px' }}>
            <h2 style={{ fontSize: '2.2rem', color: '#0F172A', marginBottom: '12px', fontWeight: 800 }}>
              Why EduNovaAI is <span className="gradient-text-glow">Different</span>
            </h2>
            <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.6 }}>
              Generic LLM chatbots provide direct answers without teaching. EduNovaAI acts as an intentional, adaptive Socratic tutor.
            </p>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '32px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              borderRadius: '20px',
              overflowX: 'auto'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 700, fontSize: '0.9rem' }}>Feature</th>
                  <th style={{ padding: '16px', color: '#DC2626', fontWeight: 700, fontSize: '0.9rem' }}>Generic AI Chatbots</th>
                  <th style={{ padding: '16px', color: '#059669', fontWeight: 800, fontSize: '0.95rem' }}>EduNovaAI</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Teaching Style', bad: 'Dumps direct solution text', good: 'Socratic dialogue with guiding questions' },
                  { feature: 'Misconception Handling', bad: 'Ignores flawed logic', good: 'Detects root cognitive fallacy & re-teaches' },
                  { feature: 'Knowledge Base', bad: 'Hallucination prone', good: 'Strict RAG grounding on your uploaded notes/PDFs' },
                  { feature: 'Pacing & Difficulty', bad: 'Static, one-size-fits-all', good: 'Dynamically adapts in real time to mastery level' },
                  { feature: 'Personal Analytics', bad: 'No progress reporting', good: 'Mastery curves, retention forecasting & weak spot radar' }
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px', color: '#0F172A', fontWeight: 700, fontSize: '0.9rem' }}>{row.feature}</td>
                    <td style={{ padding: '16px', color: '#64748B', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <X size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                        <span>{row.bad}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#0F172A', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={16} color="#059669" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, color: '#059669' }}>{row.good}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <CTA />
      </div>
    </div>
  );
}
