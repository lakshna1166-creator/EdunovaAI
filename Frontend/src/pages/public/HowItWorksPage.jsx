import React, { useState } from 'react';
import { 
  FileText, 
  Brain, 
  Sparkles, 
  Bot, 
  RefreshCw, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  Lightbulb 
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import CTA from '../../components/landing/CTA';
import { howItWorksSteps } from '../../data/landingData';
import AILearningLoop from '../../components/innovative/AILearningLoop';

const iconMap = {
  FileText: FileText,
  Brain: Brain,
  Sparkles: Sparkles,
  Bot: Bot,
  RefreshCw: RefreshCw,
  TrendingUp: TrendingUp,
};

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div style={{ paddingTop: '120px', background: '#FFFFFF', overflow: 'visible' }}>
      <div className="container" style={{ overflow: 'visible' }}>
        <PageHeader
          badgeText="Cognitive Pipeline"
          badgeIcon={Lightbulb}
          title="How EduNovaAI"
          highlightText="Adapts to Your Mind"
          description="A continuous 6-stage cognitive loop that analyzes your learning profile, teaches interactively, pinpoints flawed reasoning, and guides you to complete concept mastery."
          breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'How It Works' }]}
        />

        {/* 6 Stage Interactive Breakdown with Lift Hover Physics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px', marginBottom: '60px', alignItems: 'start', overflow: 'visible' }} className="how-it-works-layout">
          {/* Left: Step Selector Cards with Smooth Lift Physics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'visible' }}>
            {howItWorksSteps.map((step, idx) => {
              const Icon = iconMap[step.icon] || Sparkles;
              const isSelected = activeStep === idx;
              const isHovered = hoveredCard === idx;

              return (
                <div
                  key={step.step}
                  onClick={() => setActiveStep(idx)}
                  onMouseEnter={() => setHoveredCard(idx)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="how-it-works-card"
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '18px',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    border: isSelected ? `2px solid ${step.color}` : isHovered ? `1px solid ${step.color}` : '1px solid #E2E8F0',
                    background: isSelected ? '#EFF6FF' : '#FFFFFF',
                    boxShadow: isHovered
                      ? `0 25px 50px -12px rgba(37, 99, 235, 0.2), 0 0 0 1px ${step.color}`
                      : isSelected
                      ? `0 8px 24px ${step.color}20`
                      : 'var(--shadow-card)',
                    transform: isHovered
                      ? 'translateY(-14px) scale(1.02)'
                      : isSelected
                      ? 'translateX(6px)'
                      : 'translateY(0) scale(1)',
                    transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.38s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.38s ease'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: `rgba(${parseInt(step.color.slice(1, 3), 16)}, ${parseInt(step.color.slice(3, 5), 16)}, ${parseInt(step.color.slice(5, 7), 16)}, 0.1)`,
                      border: `1px solid ${step.color}35`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: step.color,
                      flexShrink: 0
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: step.color, textTransform: 'uppercase' }}>
                        Step {step.step}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                      {step.title}
                    </div>
                  </div>

                  <ArrowRight size={18} color={isSelected || isHovered ? step.color : '#94A3B8'} />
                </div>
              );
            })}
          </div>

          {/* Right: Active Step Deep Dive Card */}
          <div
            className="glass-card"
            style={{
              padding: '36px',
              borderRadius: '24px',
              border: `1px solid ${howItWorksSteps[activeStep].color}50`,
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-card-hover)',
              position: 'sticky',
              top: '120px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: `rgba(${parseInt(howItWorksSteps[activeStep].color.slice(1, 3), 16)}, ${parseInt(howItWorksSteps[activeStep].color.slice(3, 5), 16)}, ${parseInt(howItWorksSteps[activeStep].color.slice(5, 7), 16)}, 0.1)`,
                  color: howItWorksSteps[activeStep].color,
                  border: `1px solid ${howItWorksSteps[activeStep].color}40`
                }}
              >
                {howItWorksSteps[activeStep].badge}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800, color: '#CBD5E1' }}>
                {howItWorksSteps[activeStep].step}
              </span>
            </div>

            <h3 style={{ fontSize: '1.75rem', color: '#0F172A', marginBottom: '16px' }}>
              {howItWorksSteps[activeStep].title}
            </h3>

            <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.7, marginBottom: '28px' }}>
              {howItWorksSteps[activeStep].description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', padding: '18px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Key Pipeline Actions:
              </span>
              {howItWorksSteps[activeStep].details.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: '#334155', fontWeight: 500 }}>
                  <CheckCircle size={16} color={howItWorksSteps[activeStep].color} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <Button variant="primary" to="/learning-setup" iconRight={ArrowRight}>
                Try This Step Live
              </Button>
            </div>
          </div>
        </div>

        {/* 9-Stage Visual AI Learning Loop */}
        <div style={{ marginBottom: '60px' }}>
          <AILearningLoop />
        </div>

        {/* Bottom CTA */}
        <CTA />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .how-it-works-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
