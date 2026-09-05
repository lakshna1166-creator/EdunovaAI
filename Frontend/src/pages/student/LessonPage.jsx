import React, { useState } from 'react';
import {
  BookOpen,
  Bot,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Cpu
} from 'lucide-react';
import StudentNavbar from '../../components/student/StudentNavbar';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import AILearningPath from '../../components/innovative/AILearningPath';
import TeacherAnimation from '../../components/innovative/TeacherAnimation';
import AdaptiveDifficulty from '../../components/innovative/AdaptiveDifficulty';

export default function LessonPage() {
  const [completedCheck, setCompletedCheck] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [teacherState, setTeacherState] = useState('idle');

  const storedLessonStr = typeof window !== 'undefined' ? sessionStorage.getItem('edunova_current_lesson') : null;
  const storedLesson = storedLessonStr ? JSON.parse(storedLessonStr) : null;
  const currentTopic = storedLesson?.topic || 'Neural Networks & Gradient Descent';
  const currentLanguage = storedLesson?.preferredLanguage || 'English';
  const currentGoal = storedLesson?.goal || 'Understand Concept';

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <StudentNavbar />

      <main className="container" style={{ padding: '36px 24px 80px', flex: 1, maxWidth: '1000px' }}>
        <PageHeader
          badgeText="AI Generated Lesson"
          badgeIcon={BookOpen}
          title="Active Lesson:"
          highlightText={currentTopic}
          description={`A personalized curriculum tailored to your learning profile in ${currentLanguage}. Goal: ${currentGoal}.`}
          breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Active Lesson' }]}
          backTo="/dashboard"
        >
          <Button variant="primary" to="/student/teacher" icon={Bot} iconRight={ArrowRight}>
            Ask AI Teacher
          </Button>
        </PageHeader>

        {/* Visual AI Learning Path */}
        <AILearningPath activeStage="Concepts" />

        {/* Adaptive Difficulty Bar */}
        <div style={{ marginBottom: '24px' }}>
          <AdaptiveDifficulty currentLevel={difficulty} onLevelChange={setDifficulty} />
        </div>
        {/* Compact AI Teacher */}
        <div style={{ marginBottom: '24px' }}>
          <TeacherAnimation
            state={teacherState}
            compact
          />
        </div>
        {/* Lesson Body Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Section 1: Intuition & Analogies */}
          <div className="glass-card" style={{ padding: '32px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                <Lightbulb size={20} />
              </div>
              <h2 style={{ fontSize: '1.35rem', color: '#0F172A' }}>1. The Core Intuitive Mental Model</h2>
            </div>

            <p style={{ color: '#334155', fontSize: '0.96rem', lineHeight: 1.7, marginBottom: '16px' }}>
              Imagine a long train of connected gears. Turning the first gear by a tiny angle rotates the second gear, which turns the third, until the output gear moves. If the final gear turned too far, how much do you adjust the first gear?
            </p>

            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '14px', padding: '18px', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E3A8A', marginBottom: '6px' }}>
                💡 Key Principle:
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#1E40AF', lineHeight: 1.6 }}>
                Each layer acts as a function composition f₃(f₂(f₁(x))). To determine how the first layer weight influences the final loss, we multiply each intermediate rate of change using the <strong>Calculus Chain Rule</strong>.
              </p>
            </div>
          </div>

          {/* Section 2: Mathematical Derivation */}
          <div className="glass-card" style={{ padding: '32px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D9488' }}>
                <Cpu size={20} />
              </div>
              <h2 style={{ fontSize: '1.35rem', color: '#0F172A' }}>2. The Chain Rule Equation</h2>
            </div>

            <p style={{ color: '#334155', fontSize: '0.96rem', lineHeight: 1.7, marginBottom: '16px' }}>
              For a 2-layer network with activation h = σ(W₁x) and output ŷ = σ(W₂h), the gradient of loss L with respect to weight W₁ is:
            </p>

            <div
              style={{
                background: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: '12px',
                padding: '16px 20px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '1rem',
                color: '#38BDF8',
                textAlign: 'center',
                marginBottom: '18px'
              }}
            >
              {'∂L / ∂W₁ = (∂L / ∂ŷ) · (∂ŷ / ∂h) · (∂h / ∂W₁)'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#475569' }}>
                <span style={{ color: '#2563EB', fontWeight: 700 }}>1.</span>
                <span><strong>∂L / ∂ŷ</strong>: How much error changes as the network prediction shifts.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#475569' }}>
                <span style={{ color: '#2563EB', fontWeight: 700 }}>2.</span>
                <span><strong>∂ŷ / ∂h</strong>: How much output shifts as hidden activation changes (via layer 2 weights).</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#475569' }}>
                <span style={{ color: '#2563EB', fontWeight: 700 }}>3.</span>
                <span><strong>∂h / ∂W₁</strong>: How much hidden activation changes when we tweak input weights.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Interactive Checkpoint */}
          <div
            className="glass-card"
            style={{
              padding: '32px',
              border: completedCheck ? '1px solid #10B981' : '1px solid #E2E8F0',
              background: completedCheck ? '#F0FDF4' : '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                <HelpCircle size={20} />
              </div>
              <h2 style={{ fontSize: '1.25rem', color: '#0F172A' }}>Quick Comprehension Check</h2>
            </div>

            <p style={{ color: '#334155', fontSize: '0.95rem', marginBottom: '16px' }}>
              If a hidden layer's activation slope σ′(z) ≈ 0 (e.g. saturated sigmoid), what happens to the gradients propagating to earlier layers?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setCompletedCheck(true);
                  setTeacherState('encouraging');
                }}
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: completedCheck ? '#ECFDF5' : '#F8FAFC',
                  border: completedCheck ? '1px solid #10B981' : '1px solid #CBD5E1',
                  color: completedCheck ? '#065F46' : '#1E293B',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                {completedCheck && <CheckCircle2 size={18} color="#059669" />}
                <span>The gradients vanish toward zero because terms multiply together (Vanishing Gradient Problem).</span>
              </button>

              <button
                type="button"
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#64748B',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                The gradients remain unchanged because earlier weights operate independently.
              </button>
            </div>

            {completedCheck && (
              <div style={{ padding: '12px 16px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', color: '#065F46', fontSize: '0.88rem', fontWeight: 700, marginBottom: '16px' }}>
                ✓ Correct! Because the chain rule is multiplicative, any zero factor squashes all preceding gradients.
              </div>
            )}

            {/* Navigation Next Steps */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <Button variant="secondary" to="/dashboard">
                Back to Dashboard
              </Button>
              <Button variant="primary" size="lg" to="/student/teacher" icon={Bot} iconRight={ArrowRight}>
                Practice with 1-on-1 AI Teacher
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
