<<<<<<< HEAD
import React, { useState, useRef } from 'react';
=======
import React, { useState } from 'react';
import TeacherAnimation from '../../components/innovative/TeacherAnimation';
>>>>>>> 6b80ab7250ac022b428cdade4e0d32f601334dd1
import {
  Bot,
  User,
  Send,
  AlertTriangle,
  ArrowRight,
  Award,
  Zap,
  Sparkles,
  RefreshCw,
  Speaker
} from 'lucide-react';
import StudentNavbar from '../../components/student/StudentNavbar';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import AITutorModes from '../../components/innovative/AITutorModes';
import MisconceptionRadar from '../../components/innovative/MisconceptionRadar';
import ExplainDifferently from '../../components/innovative/ExplainDifferently';

import { useAuth } from '../../context/AuthContext';
import { analyticsApi, voiceApi } from '../../services/api';

export default function AITeacherPage() {
  const { user } = useAuth();
  const studentName = user?.name?.split(' ')[0] || 'Student';

  const storedLessonStr = typeof window !== 'undefined' ? sessionStorage.getItem('edunova_current_lesson') : null;
  const storedLesson = storedLessonStr ? JSON.parse(storedLessonStr) : null;
  const currentTopic = storedLesson?.topic || 'Core Principles & Foundations';

  const [inputMessage, setInputMessage] = useState('');
  const [activeTutorMode, setActiveTutorMode] = useState('socratic');
  const [showExplainDifferently, setShowExplainDifferently] = useState(false);
  const [misconceptions, setMisconceptions] = useState([]);

  React.useEffect(() => {
    analyticsApi.getMisconceptions().then((res) => setMisconceptions(res?.data || [])).catch(() => setMisconceptions([]));
  }, []);

  const [messages, setMessages] = useState([]);
  const [teacherState, setTeacherState] = useState('idle');
  const hasLearningSession = !!storedLesson?.topic;


  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputMessage('');

    try {
      const { teacherApi } = await import('../../services/api');
      const result = await teacherApi.ask({
        message: userText,
        topic: currentTopic,
        tutorMode: activeTutorMode,
        history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        level: 'beginner'
      });
      const reply = result?.message?.text || result?.data?.message?.text;
      if (reply) setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
      setShowExplainDifferently(false);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: 'ai', text: 'I could not process that question yet. Please try again.' }]);
    }
  };

  // Text-to-Speech function
  const speakText = async (text) => {
    if (!text || typeof text !== 'string' || !text.trim()) {
      console.error('Invalid text for speech:', text);
      return;
    }

    try {
      const audioBlob = await voiceApi.speak(text.trim());
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
      // Clean up object URL after playback
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
    } catch (error) {
      console.error('Text-to-speech error:', error);
      // Optionally show a toast notification to the user
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <StudentNavbar />

      <main className="container" style={{ padding: '36px 24px 80px', flex: 1 }}>
        <PageHeader
          badgeText="Socratic 1-on-1 Session"
          badgeIcon={Bot}
          title="Interactive AI Teacher &"
          highlightText="Socratic Dialogue"
          description="Ask questions in plain English or test your intuition. Your AI Teacher analyzes reasoning paths, detects misconceptions, and provides multi-modal remediation."
          breadcrumbs={[{ label: 'Lesson', path: '/student/lesson' }, { label: 'AI Teacher' }]}
          backTo="/student/lesson"
        >
          {hasLearningSession && (
            <Button variant="primary" to="/student/quiz" icon={Award} iconRight={ArrowRight}>
              Take Final Quiz
            </Button>
          )}
        </PageHeader>

        {/* AI Tutor Persona Modes */}
        <AITutorModes activeMode={activeTutorMode} onModeChange={setActiveTutorMode} />

        {/* Chat Interface + Live Misconception Radar Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }} className="teacher-chat-grid">
          {/* Main Chat Stream */}
          <div
            className="glass-card"
            style={{
              padding: '24px',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '560px',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            {/* Messages */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', marginBottom: '20px' }}>
              {!hasLearningSession && messages.length === 0 && (
                <div style={{ padding: '36px 24px', textAlign: 'center', border: '1px dashed #CBD5E1', borderRadius: '16px', background: '#F8FAFC' }}>
                  <Bot size={34} color="#8B7CF6" style={{ marginBottom: '10px' }} />
                  <h3 style={{ margin: '0 0 8px', color: '#0F172A' }}>Your AI Tutor is ready</h3>
                  <p style={{ margin: 0, color: '#64748B', lineHeight: 1.6 }}>Start a learning session first. Your tutor will build the conversation from the topic you choose.</p>
                  <Button variant="primary" to="/student/start-learning" icon={ArrowRight} iconRight={ArrowRight} style={{ marginTop: '16px' }}>Start Learning</Button>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {msg.sender === 'ai' && (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                      }}
                    >
                      <Bot size={18} color="#FFFFFF" />
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '14px 18px',
                      borderRadius: '16px',
                      borderTopLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                      borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
                      background: msg.sender === 'user'
                        ? '#EFF6FF'
                        : msg.type === 'misconception'
                          ? '#FFF1F2'
                          : '#F8FAFC',
                      border: msg.sender === 'user'
                        ? '1px solid #BFDBFE'
                        : msg.type === 'misconception'
                          ? '1px solid #FECDD3'
                          : '1px solid #E2E8F0',
                      color: msg.sender === 'user' ? '#1E3A8A' : '#1E293B',
                      fontSize: '0.92rem',
                      lineHeight: 1.6
                    }}
                  >
                    {msg.type === 'misconception' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9F1239', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                        <AlertTriangle size={14} />
                        <span>Misconception Detected & Intercepted</span>
                      </div>
                    )}

                    <p style={{ margin: 0 }}>{msg.text}</p>
                    {msg.sender === 'ai' && (
                      <button
                        style={{
                          marginLeft: '8px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'inline-flex',
                          verticalAlign: 'middle',
                        }}
                        onClick={() => speakText(msg.text)}
                        title="Speak this response"
                        aria-label="Speak AI response"
                      >
                        <Speaker size={14} color="#64748B" />
                      </button>
                    )}

                    {msg.remediation && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #FECDD3', fontSize: '0.85rem', color: '#166534', fontWeight: 500 }}>
                        <strong>✨ Intuitive Analogy:</strong> {msg.remediation}
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: '#E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <User size={18} color="#475569" />
                    </div>
                  )}
                </div>
              ))}

              {/* Explain Differently Multi-Modal Options (Shown after misconception) */}
              {showExplainDifferently && (
                <ExplainDifferently />
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Type your explanation or ask a clarifying question..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#0F172A',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'var(--grad-brand)',
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>

          {/* Right Sidebar: Misconception Radar Widget */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <TeacherAnimation state={teacherState} />

            {hasLearningSession && (
              <Button
                variant="primary"
                size="lg"
                to="/student/quiz"
                icon={Award}
                iconRight={ArrowRight}
                style={{ width: '100%' }}
              >
                Proceed to Adaptive Quiz
              </Button>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 900px) {
          .teacher-chat-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
