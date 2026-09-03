import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  ArrowRight, 
  BarChart2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import StudentNavbar from '../../components/student/StudentNavbar';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import AdaptiveDifficulty from '../../components/innovative/AdaptiveDifficulty';
import { quizApi } from '../../services/api';

export default function QuizPage() {
  const navigate = useNavigate();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [difficulty, setDifficulty] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const questions = [
    {
      id: 1,
      question: "In a deep neural network, why does calculating ∂L/∂w₁ require multiplying partial derivatives across each layer instead of adding them?",
      options: [
        "Because layers are composite mathematical functions f(g(h(x))) following the Chain Rule.",
        "Because matrix addition is computationally prohibited on GPUs.",
        "Because learning rates require multiplicative scaling to remain stable.",
        "Because bias weights cancel out additive error vectors."
      ],
      correct: 0
    },
    {
      id: 2,
      question: "What is the primary catalyst of the Vanishing Gradient Problem during backpropagation?",
      options: [
        "Having too high a learning rate causing divergence.",
        "Repeated multiplication of derivatives that are strictly less than 1 across many layers.",
        "Zero-initialized biases causing division by zero errors.",
        "Using excessive training epochs on small datasets."
      ],
      correct: 1
    },
    {
      id: 3,
      question: "How does EduNovaAI distinguish between a computational slip and a fundamental cognitive misconception?",
      options: [
        "By comparing the student's answer against typical wrong-option distractor mental models.",
        "By measuring the exact typing speed of the user.",
        "By randomly assigning difficulty ratings to student answers.",
        "By resetting the entire course upon any incorrect submission."
      ],
      correct: 0
    }
  ];

  const handleSelect = (qId, optionIdx) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
    // Adaptive difficulty logic: correct answer escalates difficulty
    if (optionIdx === questions.find(q => q.id === qId)?.correct) {
      setDifficulty('hard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isComplete || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await quizApi.submitQuiz({ answers: selectedAnswers });
      sessionStorage.setItem('edunova_last_quiz_report', JSON.stringify(result?.data || {}));
      navigate('/student/report');
    } catch (error) {
      setSubmitError(error.message || 'Unable to save your quiz result. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComplete = Object.keys(selectedAnswers).length === questions.length;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <StudentNavbar />

      <main className="container" style={{ padding: '36px 24px 80px', flex: 1, maxWidth: '900px' }}>
        <PageHeader
          badgeText="Adaptive Assessment"
          badgeIcon={Award}
          title="Concept Mastery"
          highlightText="Final Quiz"
          description="Answer these diagnostic scenario-based questions to solidify your understanding and generate your verified mastery report."
          breadcrumbs={[{ label: 'AI Teacher', path: '/student/teacher' }, { label: 'Quiz' }]}
          backTo="/student/teacher"
        />

        {/* Adaptive Difficulty Gauge */}
        <div style={{ marginBottom: '24px' }}>
          <AdaptiveDifficulty currentLevel={difficulty} onLevelChange={setDifficulty} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {questions.map((q, qIndex) => (
            <div key={q.id} className="glass-card" style={{ padding: '28px', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, color: '#2563EB', padding: '2px 8px', borderRadius: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  Q{qIndex + 1}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  Conceptual Reasoning (Level: {difficulty.toUpperCase()})
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', color: '#0F172A', marginBottom: '20px', lineHeight: 1.5 }}>
                {q.question}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {q.options.map((option, optIdx) => {
                  const isSelected = selectedAnswers[q.id] === optIdx;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelect(q.id, optIdx)}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: isSelected ? '#EFF6FF' : '#F8FAFC',
                        border: isSelected ? '1px solid #2563EB' : '1px solid #E2E8F0',
                        color: isSelected ? '#1E3A8A' : '#334155',
                        textAlign: 'left',
                        fontSize: '0.92rem',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.12)' : 'none'
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid #2563EB' : '2px solid #CBD5E1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }} />}
                      </div>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submit Action */}
          {submitError && (
            <div role="alert" style={{ padding: '12px 14px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: '0.9rem' }}>
              {submitError}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '14px' }}>
            <Button variant="secondary" to="/student/teacher">
              Back to AI Teacher
            </Button>
            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={!isComplete || isSubmitting}
              icon={BarChart2}
              iconRight={ArrowRight}
              style={{ opacity: isComplete ? 1 : 0.6 }}
            >
              {isSubmitting ? 'Saving result…' : 'Submit & View Learning Report'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
