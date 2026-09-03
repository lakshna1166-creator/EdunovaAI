import React, { useState } from 'react';
import { 
  GraduationCap, 
  UploadCloud, 
  Brain, 
  MessageSquare, 
  CheckCircle, 
  ArrowRight
} from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import Button from '../common/Button';

export default function StudentExperience() {
  const [activeStep, setActiveStep] = useState(0);

  const studentSteps = [
    {
      title: 'Topic & Material Upload',
      tag: 'Step 1 & 2',
      desc: 'Drop in your PDF notes, homework assignment, or simply enter a topic like "Quantum Entanglement".',
      preview: {
        type: 'input',
        title: 'Ingestion & Vector Parsing',
        items: ['Lecture_04_Linear_Algebra.pdf (Parsed 24 pages)', 'Extracted 18 core definitions', 'Mapped 6 prerequisite dependencies']
      }
    },
    {
      title: 'Cognitive Learning Profile',
      tag: 'Step 3',
      desc: 'EduMind analyzes your mastery level, cognitive preferences (analogy, math, visual), and optimal pacing.',
      preview: {
        type: 'profile',
        title: 'Student Cognitive Baseline',
        items: ['Pacing: Accelerated', 'Explanation: Analogy-first + Visual diagrams', 'Prerequisites: 100% Verified']
      }
    },
    {
      title: 'AI Teacher & Socratic Q&A',
      tag: 'Step 4 & 5',
      desc: 'Engage in a live, conversational tutoring session. As you answer, EduMind evaluates cognitive logic.',
      preview: {
        type: 'chat',
        title: 'Live Socratic Guidance',
        items: ['Socratic Hint: Consider what happens to momentum when mass remains constant.', 'Student Response: Momentum doubles if velocity doubles.']
      }
    },
    {
      title: 'Misconception Correction',
      tag: 'Step 6',
      desc: 'Flawed intuition detected? The system automatically triggers adaptive re-teaching before proceeding.',
      preview: {
        type: 'adaptive',
        title: 'Adaptive Remediation Active',
        items: ['Flagged: Equating velocity with acceleration', 'Remediation: Visualizing gravitational free-fall with calculus']
      }
    },
    {
      title: 'Quiz & Mastery Report',
      tag: 'Step 7 & 8',
      desc: 'Complete an adaptive final quiz, view your retention forecast, and receive recommended next topics.',
      preview: {
        type: 'report',
        title: 'Concept Mastery: 96%',
        items: ['Retained 5 core mental models', 'Streak: 7 Days Active', 'Recommended Next: Special Relativity Foundations']
      }
    }
  ];

  return (
    <section id="student-experience" className="section" style={{ background: '#F8FAFC' }}>
      <div className="container">
        <SectionHeader
          badgeText="Student Journey"
          badgeIcon={GraduationCap}
          title="The Student"
          highlightText="Learning Workflow"
          description="Experience a personalized, 1-on-1 AI education journey designed to guarantee concept mastery, not just surface memorization."
        />

        <div
          className="glass-card"
          style={{
            padding: '36px',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          {/* Top Workflow Pills */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '16px',
              borderBottom: '1px solid #F1F5F9',
              marginBottom: '32px'
            }}
          >
            {studentSteps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: activeStep === idx ? '1px solid #2563EB' : '1px solid #E2E8F0',
                  background: activeStep === idx ? '#EFF6FF' : '#F8FAFC',
                  color: activeStep === idx ? '#1D4ED8' : '#64748B',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: activeStep === idx ? '#2563EB' : '#94A3B8' }}>
                  {step.tag}
                </span>
                <span>{step.title}</span>
              </button>
            ))}
          </div>

          {/* Workflow Interactive Split Screen */}
          <div className="grid-2" style={{ alignItems: 'center' }}>
            {/* Left: Step Description */}
            <div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                {studentSteps[activeStep].tag}
              </div>
              <h3 style={{ fontSize: '1.85rem', marginBottom: '14px', color: '#0F172A' }}>
                {studentSteps[activeStep].title}
              </h3>
              <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.7, marginBottom: '28px' }}>
                {studentSteps[activeStep].desc}
              </p>
              
              <div style={{ display: 'flex', gap: '14px' }}>
                <Button
                  variant="primary"
                  size="md"
                  to="/student/start-learning"
                  iconRight={ArrowRight}
                >
                  Try Student Experience
                </Button>
              </div>
            </div>

            {/* Right: Simulated Feature Preview */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '18px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
                  {studentSteps[activeStep].preview.title}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {studentSteps[activeStep].preview.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      fontSize: '0.88rem',
                      color: '#1E293B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
                    }}
                  >
                    <CheckCircle size={16} color="#059669" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
