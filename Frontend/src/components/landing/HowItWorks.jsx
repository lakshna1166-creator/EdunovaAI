import React, { useState } from 'react';
import { 
  FileText, 
  Brain, 
  Sparkles, 
  Bot, 
  RefreshCw, 
  TrendingUp, 
  CheckCircle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import { howItWorksSteps } from '../../data/landingData';
import AILearningLoop from '../innovative/AILearningLoop';

const iconMap = {
  FileText: FileText,
  Brain: Brain,
  Sparkles: Sparkles,
  Bot: Bot,
  RefreshCw: RefreshCw,
  TrendingUp: TrendingUp,
};

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="section" style={{ background: '#F8FAFC', overflow: 'visible' }}>
      <div className="container how-it-works-container" style={{ overflow: 'visible' }}>
        <SectionHeader
          badgeText="Intelligent Learning Loop"
          badgeIcon={Lightbulb}
          title="How EduMind AI"
          highlightText="Transforms Your Learning"
          description="A continuous cognitive feedback loop that personalizes lesson pacing, tests comprehension dynamically, and closes knowledge gaps in real-time."
        />

        {/* 6 Step Interactive Grid with Smooth Lift Hover Physics */}
        <div className="grid-3 how-it-works-grid" style={{ gap: '32px', marginBottom: '48px', overflow: 'visible', paddingTop: '10px', paddingBottom: '20px' }}>
          {howItWorksSteps.map((item, index) => {
            const Icon = iconMap[item.icon] || Sparkles;
            const isActive = activeStep === index;

            return (
              <div
                key={item.step}
                className="how-it-works-card"
                onClick={() => setActiveStep(index)}
                style={{
                  padding: '32px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  background: '#FFFFFF',
                  borderColor: isActive ? item.color : '#E2E8F0',
                  boxShadow: isActive ? `0 14px 30px -8px ${item.color}30, 0 0 0 1px ${item.color}60` : 'var(--shadow-card)',
                  transform: 'translateZ(0)',
                  willChange: 'transform, box-shadow'
                }}
              >
                {/* Header: Step Number & Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div
                    className="step-icon-badge"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `rgba(${parseInt(item.color.slice(1, 3), 16)}, ${parseInt(item.color.slice(3, 5), 16)}, ${parseInt(item.color.slice(5, 7), 16)}, 0.1)`,
                      border: `1px solid ${item.color}35`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color,
                      boxShadow: `0 4px 12px ${item.color}20`,
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                    }}
                  >
                    <Icon size={24} />
                  </div>
                  <span
                    className="step-number"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: isActive ? item.color : '#CBD5E1',
                      transition: 'color 0.3s ease'
                    }}
                  >
                    {item.step}
                  </span>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: '1.25rem',
                    marginBottom: '10px',
                    color: '#0F172A',
                    fontWeight: 700
                  }}
                >
                  {item.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.92rem',
                    color: '#475569',
                    lineHeight: 1.65,
                    marginBottom: '20px',
                    flexGrow: 1
                  }}
                >
                  {item.description}
                </p>

                {/* Sub-features list */}
                <div
                  style={{
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  {item.details.map((detail, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155', fontWeight: 500 }}>
                      <CheckCircle size={15} color={item.color} />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 9-Stage Visual AI Learning Loop */}
        <AILearningLoop />
      </div>

      <style>{`
        .how-it-works-card {
          transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), 
                      box-shadow 0.38s cubic-bezier(0.16, 1, 0.3, 1), 
                      border-color 0.38s ease !important;
        }
        .how-it-works-card:hover {
          transform: translateY(-15px) scale(1.02) !important;
          border-color: #2563EB !important;
          box-shadow: 0 25px 50px -12px rgba(37, 99, 235, 0.24), 0 0 0 1px rgba(37, 99, 235, 0.4) !important;
          z-index: 10;
        }
        .how-it-works-card:hover .step-icon-badge {
          transform: scale(1.1) rotate(2deg);
        }
        .how-it-works-card:hover .step-number {
          color: #2563EB !important;
        }
      `}</style>
    </section>
  );
}