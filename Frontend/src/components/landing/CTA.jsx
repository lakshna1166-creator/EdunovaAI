import React from 'react';
import { ArrowRight, Sparkles, GraduationCap, CheckCircle2, Compass } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function CTA() {
  return (
    <section className="section" style={{ paddingBottom: '100px', background: '#FFFFFF' }}>
      <div className="container">
        <div
          className="glass-card"
          style={{
            padding: '64px 40px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '28px',
            border: '1px solid #BFDBFE',
            background: 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 50%, #F0FDF4 100%)',
            boxShadow: '0 20px 50px -15px rgba(37, 99, 235, 0.15)'
          }}
        >
          {/* Ambient Glows inside card */}
          <div
            className="glow-orb glow-orb-indigo"
            style={{
              width: '400px',
              height: '400px',
              top: '-150px',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '780px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <Badge icon={Sparkles}>
                Unlock Your Full Potential
              </Badge>
            </div>

            <h2
              style={{
                fontSize: 'clamp(2.2rem, 4.5vw, 3.25rem)',
                fontWeight: 800,
                color: '#0F172A',
                lineHeight: 1.15,
                marginBottom: '18px',
                letterSpacing: '-0.03em'
              }}
            >
              Start Learning with Your{' '}
              <span className="gradient-text-glow">Personal AI Teacher</span> Today
            </h2>

            <p
              style={{
                fontSize: '1.15rem',
                color: '#475569',
                lineHeight: 1.65,
                marginBottom: '36px'
              }}
            >
              Master complex subjects faster with personalized AI instruction, real-time misconception interception, and adaptive Socratic dialogue.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                marginBottom: '32px'
              }}
            >
              <Button
                variant="primary"
                size="lg"
                to="/learning-setup"
                iconRight={ArrowRight}
                icon={GraduationCap}
                style={{ fontWeight: 800, padding: '14px 32px' }}
              >
                Start Learning Now
              </Button>

              <Button
                variant="secondary"
                size="lg"
                to="/features"
                style={{ fontWeight: 700, background: '#FFFFFF', color: '#0F172A' }}
              >
                Explore Features
              </Button>
            </div>

            {/* Feature Checkpoints */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                flexWrap: 'wrap',
                color: '#64748B',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>100% Free for Students</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>Instant PDF & Notes Ingestion</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>Socratic AI Dialogue</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
