import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  Compass, 
  Share2, 
  Download
} from 'lucide-react';
import StudentNavbar from '../../components/student/StudentNavbar';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';

export default function ReportPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <StudentNavbar />

      <main className="container" style={{ padding: '36px 24px 80px', flex: 1, maxWidth: '960px' }}>
        <PageHeader
          badgeText="Cognitive Assessment"
          badgeIcon={Award}
          title="Mastery & Analytics"
          highlightText="Learning Report"
          description="Congratulations! You have verified concept mastery on Backpropagation & Multilayer Gradient Descent."
          breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Learning Report' }]}
          backTo="/dashboard"
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" size="sm" icon={Share2}>
              Share
            </Button>
            <Button variant="secondary" size="sm" icon={Download}>
              Download PDF
            </Button>
          </div>
        </PageHeader>

        {/* Top Big Score Card */}
        <div
          className="glass-card"
          style={{
            padding: '36px',
            borderRadius: '24px',
            border: '1px solid #BBF7D0',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Verified Concept Mastery
            </span>
            <h2 style={{ fontSize: '2.5rem', color: '#0F172A', margin: '6px 0' }}>
              Neural Networks & Backprop: <span style={{ color: '#059669' }}>96%</span>
            </h2>
            <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: '520px' }}>
              You correctly reasoned through layer sensitivity, gradient chaining, and the vanishing gradient phenomenon.
            </p>
          </div>

          <div style={{ textAlign: 'center', background: '#FFFFFF', padding: '20px 28px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#D97706' }}>🏆 A+</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>Cognitive Grade</div>
          </div>
        </div>

        {/* 2 Column Stats: Conquered Concepts & Retention Forecast */}
        <div className="grid-2" style={{ gap: '28px', marginBottom: '32px' }}>
          {/* Mastered Principles */}
          <div className="glass-card" style={{ padding: '28px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <CheckCircle2 size={20} color="#059669" />
              <h3 style={{ fontSize: '1.15rem', color: '#0F172A' }}>Mastered Competencies</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { title: 'Calculus Chain Rule Formulation', desc: 'Accurately computes composite derivatives.' },
                { title: 'Layer Blame Sensitivity', desc: 'Understands why high activation neurons receive more blame.' },
                { title: 'Vanishing Gradient Diagnostics', desc: 'Identifies saturation issues with sigmoid activations.' },
              ].map((item, idx) => (
                <div key={idx} style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>{item.title}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Retention Forecast */}
          <div className="glass-card" style={{ padding: '28px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <TrendingUp size={20} color="#2563EB" />
              <h3 style={{ fontSize: '1.15rem', color: '#0F172A' }}>Memory & Retention Curve</h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6, marginBottom: '20px' }}>
              Based on the Ebbinghaus Forgetting Curve calibrated to your study cadence:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#334155', marginBottom: '4px' }}>
                  <span>Day 1 Retention</span>
                  <span style={{ color: '#059669', fontWeight: 800 }}>98%</span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: '98%', height: '100%', background: '#10B981' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#334155', marginBottom: '4px' }}>
                  <span>Day 7 Retention Forecast</span>
                  <span style={{ color: '#2563EB', fontWeight: 800 }}>91%</span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: '91%', height: '100%', background: '#2563EB' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#334155', marginBottom: '4px' }}>
                  <span>Day 30 Retention Forecast</span>
                  <span style={{ color: '#7C3AED', fontWeight: 800 }}>84%</span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: '84%', height: '100%', background: '#7C3AED' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Recommended Topic Banner */}
        <div
          className="glass-card"
          style={{
            padding: '32px',
            borderRadius: '20px',
            border: '1px solid #BFDBFE',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563EB', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
              <Compass size={16} />
              <span>Recommended Next Step:</span>
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#0F172A', margin: 0 }}>
              Activation Functions: ReLU, Leaky ReLU & GELU
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#475569', marginTop: '4px', margin: 0 }}>
              Solve the vanishing gradient problem you explored today.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" to="/dashboard">
              Dashboard
            </Button>
            <Button variant="primary" to="/learning-setup" iconRight={ArrowRight}>
              Start Next Topic
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
