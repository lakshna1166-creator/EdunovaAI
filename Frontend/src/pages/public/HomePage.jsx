import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Lightbulb,
  Layers,
  GraduationCap,
  Sparkles,
  Bot,
  Brain,
  ShieldCheck,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

import Hero from '../../components/landing/Hero';
import MetricsStrip from '../../components/landing/MetricsStrip';
import CTA from '../../components/landing/CTA';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

import {
  howItWorksSteps,
  aiFeatures
} from '../../data/landingData';

export default function HomePage() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* =====================================================
          HERO SECTION
          ===================================================== */}
      <Hero />

      {/* =====================================================
          METRICS STRIP
          ===================================================== */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <MetricsStrip />
      </div>

      {/* =====================================================
          HOW IT WORKS
          ===================================================== */}
      <section
        className="section"
        style={{
          background: '#F8FAFC',
          position: 'relative',
          zIndex: 2,
          padding: '80px 0'
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '48px',
              flexWrap: 'wrap',
              gap: '20px'
            }}
          >
            <div>
              <div style={{ marginBottom: '12px' }}>
                <Badge icon={Lightbulb}>
                  The Learning Process
                </Badge>
              </div>

              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                  color: '#0F172A',
                  fontWeight: 800,
                  lineHeight: 1.2
                }}
              >
                How EduNovaAI{' '}
                <span className="gradient-text-brand">
                  Works
                </span>
              </h2>

              <p
                style={{
                  color: '#475569',
                  maxWidth: '600px',
                  marginTop: '8px',
                  fontSize: '1rem',
                  lineHeight: 1.6
                }}
              >
                A 6-step cognitive loop that personalizes lesson pacing, tests comprehension with Socratic checks, and eliminates misconceptions in real time.
              </p>
            </div>

            <Button
              variant="secondary"
              to="/how-it-works"
              iconRight={ArrowRight}
            >
              View Full 6-Step Workflow
            </Button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}
          >
            {howItWorksSteps.slice(0, 3).map((item) => (
              <div
                key={item.step}
                className="interactive-card"
                style={{
                  padding: '28px',
                  borderRadius: '20px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: item.color,
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      background: `${item.color}15`,
                      borderRadius: '12px'
                    }}
                  >
                    {item.badge}
                  </span>

                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      color: '#94A3B8',
                      fontSize: '1.1rem'
                    }}
                  >
                    {item.step}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '1.2rem',
                    marginBottom: '10px',
                    color: '#0F172A',
                    fontWeight: 700
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.9rem',
                    color: '#475569',
                    lineHeight: 1.6
                  }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          AI FEATURES
          ===================================================== */}
      <section
        className="section"
        style={{
          background: '#FFFFFF',
          position: 'relative',
          zIndex: 2,
          padding: '80px 0'
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '48px',
              flexWrap: 'wrap',
              gap: '20px'
            }}
          >
            <div>
              <div style={{ marginBottom: '12px' }}>
                <Badge icon={Layers}>
                  AI Capabilities
                </Badge>
              </div>

              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                  color: '#0F172A',
                  fontWeight: 800,
                  lineHeight: 1.2
                }}
              >
                Core <span className="gradient-text-glow">AI Features</span>
              </h2>

              <p
                style={{
                  color: '#475569',
                  maxWidth: '600px',
                  marginTop: '8px',
                  fontSize: '1rem',
                  lineHeight: 1.6
                }}
              >
                Built with RAG retrieval, Socratic dialogue reasoning, and dynamic cognitive trajectory modeling.
              </p>
            </div>

            <Button
              variant="secondary"
              to="/features"
              iconRight={ArrowRight}
            >
              Explore All Features
            </Button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px'
            }}
          >
            {aiFeatures.slice(0, 4).map((feat) => (
              <div
                key={feat.id}
                className="interactive-card"
                style={{
                  padding: '26px',
                  borderRadius: '20px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: feat.color,
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '12px',
                    letterSpacing: '0.04em'
                  }}
                >
                  {feat.tag}
                </span>

                <h3
                  style={{
                    fontSize: '1.15rem',
                    marginBottom: '8px',
                    color: '#0F172A',
                    fontWeight: 700
                  }}
                >
                  {feat.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.88rem',
                    color: '#475569',
                    lineHeight: 1.55
                  }}
                >
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          STUDENT PERSONALIZED LEARNING SUITE
          ===================================================== */}
      <section
        className="section"
        style={{
          background: '#F8FAFC',
          position: 'relative',
          zIndex: 2,
          padding: '80px 0'
        }}
      >
        <div className="container">
          <div
            className="interactive-card"
            style={{
              padding: 'clamp(28px, 5vw, 48px)',
              borderRadius: '28px',
              border: '1px solid #BFDBFE',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)',
              boxShadow: '0 20px 45px -10px rgba(37, 99, 235, 0.08)'
            }}
          >
            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 16px',
                  borderRadius: '999px',
                  background: '#DBEAFE',
                  color: '#1D4ED8',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '16px'
                }}
              >
                <GraduationCap size={16} />
                <span>100% Student-Centered Learning</span>
              </div>

              <h3
                style={{
                  fontSize: 'clamp(1.75rem, 3.2vw, 2.3rem)',
                  color: '#0F172A',
                  marginBottom: '16px',
                  fontWeight: 800,
                  lineHeight: 1.2
                }}
              >
                Your Personal AI Tutor. Built for Mastery.
              </h3>

              <p
                style={{
                  color: '#475569',
                  lineHeight: 1.65,
                  fontSize: '1.05rem',
                  marginBottom: '32px'
                }}
              >
                Upload textbooks, lecture notes, or syllabus prompts. EduNovaAI breaks down complex subjects with intuitive visual analogies, detects misconceptions before they compound, and tracks your personal mastery velocity.
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  to="/student/start-learning"
                  iconRight={ArrowRight}
                  style={{ fontWeight: 700 }}
                >
                  Start Personalized Learning
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  to="/student"
                  style={{ fontWeight: 700 }}
                >
                  Explore Student Journey
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
          ===================================================== */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <CTA />
      </div>
    </div>
  );
}