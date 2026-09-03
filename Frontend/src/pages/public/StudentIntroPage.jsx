import React from 'react';
import { 
  GraduationCap, 
  ArrowRight,
  Sparkles,
  Bot,
  Brain,
  Zap,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import CTA from '../../components/landing/CTA';

export default function StudentIntroPage() {
  const steps = [
    { num: '01', title: 'Upload Notes or Enter Topic', desc: 'Paste syllabus keywords, lecture transcripts, or upload your textbook PDF. EduNovaAI structures the learning tree.' },
    { num: '02', title: 'Cognitive Baseline Calibration', desc: 'AI gauges your foundational prerequisites and calibrates explanation style (visual diagrams, intuitive analogies, or mathematical rigor).' },
    { num: '03', title: 'Socratic 1-on-1 AI Teacher', desc: 'Engage in natural conversation. The AI tutor asks guiding questions, gives real-time hints, and ensures active cognitive recall.' },
    { num: '04', title: 'Misconception Detection & Re-teaching', desc: 'When you get an answer wrong, EduNovaAI flags the exact flawed mental model and switches to an alternate explanation.' },
    { num: '05', title: 'Adaptive Final Quiz & Report', desc: 'Test mastery on dynamic scenarios, earn retention milestones, and get recommendations for your next topic.' },
  ];

  return (
    <div style={{ paddingTop: '120px', background: '#FFFFFF' }}>
      <div className="container">
        <PageHeader
          badgeText="Student Journey"
          badgeIcon={GraduationCap}
          title="Master Any Concept with"
          highlightText="Your Personal AI Teacher"
          description="EduNovaAI adapts to your learning pace, catches misunderstandings before they compound, and ensures you retain what you learn long-term."
          breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Student Journey' }]}
        >
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="primary" to="/learning-setup" iconRight={ArrowRight}>
              Start Learning Now
            </Button>
            <Button variant="secondary" to="/dashboard">
              Student Dashboard
            </Button>
          </div>
        </PageHeader>

        {/* 5-Step Student Journey Grid */}
        <div style={{ marginBottom: '80px' }}>
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 40px' }}>
            <h2 style={{ fontSize: '2.2rem', color: '#0F172A', marginBottom: '12px', fontWeight: 800 }}>
              The 5-Stage <span className="gradient-text-brand">Student Learning Loop</span>
            </h2>
            <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.6 }}>
              Designed around evidence-based cognitive psychology: spaced repetition, active recall, and Socratic inquiry.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}
          >
            {steps.map((item) => (
              <div
                key={item.num}
                className="glass-card"
                style={{
                  padding: '30px',
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
                }}
              >
                <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 800, color: '#2563EB', marginBottom: '12px' }}>
                  {item.num}
                </div>
                <h3 style={{ fontSize: '1.2rem', color: '#0F172A', marginBottom: '10px', fontWeight: 700 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <CTA />
      </div>
    </div>
  );
}
