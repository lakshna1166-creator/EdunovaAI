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
  Layers
} from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
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

export default function Features() {
  return (
    <section id="features" className="section" style={{ background: '#FFFFFF' }}>
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <SectionHeader
          badgeText="Next-Generation AI Capabilities"
          badgeIcon={Layers}
          title="Engineered for"
          highlightText="True Conceptual Mastery"
          description="EduMind AI goes far beyond generic chatbots. Our multi-agent cognitive architecture powers continuous formative evaluation and deep retention."
        />

        {/* 8 AI Features Grid (4x2 on desktop) */}
        <div className="grid-4" style={{ gap: '24px' }}>
          {aiFeatures.map((feat) => {
            const Icon = featureIconMap[feat.icon] || Sparkles;

            return (
              <div
                key={feat.id}
                className="glass-card"
                style={{
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '20px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                {/* Icon & Tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: `rgba(${parseInt(feat.color.slice(1, 3), 16)}, ${parseInt(feat.color.slice(3, 5), 16)}, ${parseInt(feat.color.slice(5, 7), 16)}, 0.1)`,
                      border: `1px solid ${feat.color}35`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: feat.color,
                      boxShadow: `0 4px 12px ${feat.color}15`
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: '#F1F5F9',
                      color: '#475569',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    {feat.tag}
                  </span>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    marginBottom: '10px',
                    color: '#0F172A'
                  }}
                >
                  {feat.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: '#475569',
                    lineHeight: 1.6
                  }}
                >
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
