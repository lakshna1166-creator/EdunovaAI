import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, GraduationCap, ShieldCheck, CheckCircle2, Bot, BookOpen, Zap, Lock, LogIn, UserPlus, X } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import HeroImageSlider from './HeroImageSlider';
import { useAuth } from '../../context/AuthContext';

export default function Hero() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleStartLearning = () => {
    if (isAuthenticated) {
      navigate('/learning-setup');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <section
      id="home"
      style={{
        position: 'relative',
        paddingTop: '150px',
        paddingBottom: '80px',
        overflow: 'hidden',
        background: '#FFFFFF'
      }}
    >
      {/* Background AI Education Photo Slider - Responsive */}
      <HeroImageSlider />

      {/* Ambient Lighting Orbs */}
      <div
        className="glow-orb glow-orb-indigo"
        style={{
          width: '550px',
          height: '550px',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none'
        }}
      />
      <div
        className="glow-orb glow-orb-cyan"
        style={{
          width: '400px',
          height: '400px',
          top: '30%',
          right: '-100px',
          pointerEvents: 'none'
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Top Feature Pill Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '22px' }}>
          <Badge icon={Sparkles}>
            Next-Gen AI Personalized Learning Platform
          </Badge>
        </div>

        {/* Pure White Rounded Hero Text Container */}
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            maxWidth: '920px',
            margin: '0 auto 32px',
            padding: '36px 28px',
            borderRadius: '28px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.12), 0 0 30px rgba(37, 99, 235, 0.06)'
          }}
        >
          <h1
            className="floating-hero-heading"
            style={{
              fontSize: 'clamp(2.3rem, 5vw, 4.2rem)',
              lineHeight: 1.12,
              marginBottom: '18px',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.035em'
            }}
          >
            Your Personal AI Teacher.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #0284C7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}
            >
              Learns How You Learn.
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.22rem)',
              color: '#475569',
              lineHeight: 1.65,
              maxWidth: '740px',
              margin: '0 auto',
              fontWeight: 500
            }}
          >
            Upload your documents or enter any topic. EduNovaAI creates an
            individualized curriculum, guides you with Socratic dialogue, intercepts
            misconceptions in real time, and adapts continuously until you achieve mastery.
          </p>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '36px'
          }}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartLearning}
            iconRight={ArrowRight}
            icon={GraduationCap}
            style={{
              fontWeight: 800,
              fontSize: '1.05rem',
              padding: '14px 32px',
              boxShadow: '0 10px 28px -2px rgba(37, 99, 235, 0.45)'
            }}
          >
            Start Learning
          </Button>

          <Button
            variant="secondary"
            size="lg"
            to="/how-it-works"
            style={{
              fontWeight: 700,
              background: '#FFFFFF',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)'
            }}
          >
            How It Works
          </Button>
        </div>

        {/* Trust Highlights Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            margin: '0 auto 40px',
            padding: '12px 24px',
            borderRadius: '999px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
            color: '#334155',
            fontSize: '0.875rem',
            fontWeight: 700,
            width: '100%',
            maxWidth: '760px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={17} color="#2563EB" />
            <span>Fact-Grounded RAG Knowledge</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={17} color="#6366F1" />
            <span>Instant Socratic Remediation</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={17} color="#0D9488" />
            <span>Zero Prerequisite Gaps</span>
          </div>
        </div>

        {/* Interactive Responsive AI Showcase Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: '24px',
              borderRadius: '20px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB'
                }}
              >
                <Bot size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Socratic AI Tutor
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
                  ● Active 24/7 Guidance
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              Guided step-by-step inquiry that leads you to deep conceptual breakthroughs rather than spoon-fed answers.
            </p>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '24px',
              borderRadius: '20px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#F0FDF4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}
              >
                <Zap size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Misconception Radar
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 700 }}>
                  ● Real-Time Interception
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              Detects cognitive misunderstandings instantly and re-explains foundations with intuitive visual mental models.
            </p>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '24px',
              borderRadius: '20px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#FAF5FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7C3AED'
                }}
              >
                <BookOpen size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Document Ingestion
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#7C3AED', fontWeight: 700 }}>
                  ● PDF, DOCX, PPT, Notes
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              Ingest your textbooks, syllabus, and study notes for grounded curriculum synthesis and targeted quizzes.
            </p>
          </div>
        </div>
      </div>

      {/* Start Learning Authentication Prompt Modal */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
              padding: '36px 32px',
              textAlign: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                color: '#2563EB',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                border: '1px solid #BFDBFE'
              }}
            >
              <Lock size={26} />
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Start Learning with EduNovaAI
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '28px' }}>
              Please login or create an account to continue your personalized learning.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/login', { state: { from: { pathname: '/learning-setup' } } });
                }}
                icon={LogIn}
                style={{ width: '100%', fontWeight: 700 }}
              >
                Login
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/signup');
                }}
                icon={UserPlus}
                style={{ width: '100%', fontWeight: 700 }}
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
