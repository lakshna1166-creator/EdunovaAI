import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  BookOpen, 
  Bot, 
  Award, 
  ArrowRight, 
  PlusCircle, 
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  Compass,
  BarChart2,
  History,
  Target,
  Sparkles,
  Loader2
} from 'lucide-react';
import StudentNavbar from '../../components/student/StudentNavbar';
import Button from '../../components/common/Button';
import { studentApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [materialsData, setMaterialsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchStudentData = async () => {
      try {
        const [dashRes, progRes, histRes, matRes] = await Promise.all([
          studentApi.getDashboard().catch(() => null),
          studentApi.getProgress().catch(() => null),
          studentApi.getHistory().catch(() => null),
          studentApi.getMaterials().catch(() => null)
        ]);

        if (isMounted) {
          if (dashRes?.data) setDashboardData(dashRes.data);
          if (progRes?.data) setProgressData(progRes.data);
          if (histRes?.history) setHistoryData(histRes.history);
          if (matRes?.materials) setMaterialsData(matRes.materials);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStudentData();

    return () => {
      isMounted = false;
    };
  }, []);

  const studentName = user?.name || dashboardData?.student?.name || 'Student';
  const studentEmail = user?.email || dashboardData?.student?.email || '';
  const streakDays = user?.profile?.streak_days ?? dashboardData?.student?.streakDays ?? 0;
  const totalXp = user?.profile?.total_xp ?? dashboardData?.student?.totalXp ?? 0;
  const cognitivePace = user?.profile?.cognitive_pace || dashboardData?.student?.cognitivePace || '1.2x Active';
  const overallMastery = progressData?.overallScore != null ? `${progressData.overallScore}%` : '0%';

  const activeCourses = dashboardData?.activeCourses || [];
  const studyGoals = dashboardData?.studyGoals || [];

  const strongConcepts = progressData?.strongConcepts || [];

  const weakConcepts = progressData?.weakConcepts || [];

  const assessmentScores = progressData?.assessmentScores || [];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
        <StudentNavbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#2563EB' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>Loading your personal dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <StudentNavbar />

      <main className="container" style={{ padding: '36px 20px 80px', flex: 1 }}>
        {/* Top Welcome Banner */}
        <div
          className="glass-card"
          style={{
            padding: '32px',
            marginBottom: '32px',
            borderRadius: '24px',
            border: '1px solid #BFDBFE',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)',
            boxShadow: '0 10px 30px -5px rgba(37, 99, 235, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          <div style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Student Dashboard
              </span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }} />
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Pace: {cognitivePace}</span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.3rem)', color: '#0F172A', marginBottom: '8px', fontWeight: 800 }}>
              Welcome back, <span style={{ color: '#2563EB' }}>{studentName}!</span>
            </h1>

            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6 }}>
              You are currently on a <strong style={{ color: '#D97706' }}>{streakDays}-day study streak</strong> with <strong style={{ color: '#2563EB' }}>{totalXp} XP</strong> earned. Your AI Tutor is ready for your next personalized session.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
              <Button variant="primary" to="/learning-setup" icon={Compass} iconRight={ArrowRight} style={{ fontWeight: 700 }}>
                Start Learning
              </Button>
              <Button variant="secondary" to="/progress" icon={BarChart2} style={{ fontWeight: 700 }}>
                View Progress
              </Button>
            </div>
          </div>

          {/* Progress Ring Visual */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              background: '#FFFFFF',
              padding: '18px 24px',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
            }}
          >
            <div style={{ position: 'relative', width: '84px', height: '84px' }}>
              <svg width="84" height="84" viewBox="0 0 84 84">
                <circle cx="42" cy="42" r="34" stroke="#E2E8F0" strokeWidth="8" fill="transparent" />
                <circle
                  cx="42"
                  cy="42"
                  r="34"
                  stroke="#2563EB"
                  strokeWidth="8"
                  strokeDasharray="213.6"
                  strokeDashoffset={213.6 * (1 - 0.86)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  color: '#0F172A'
                }}
              >
                {overallMastery}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Overall Mastery</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Advanced Rank</div>
              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                +14% Growth this week
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Active Topics & Goals */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px', marginBottom: '32px' }} className="dash-main-grid">
          {/* Left Column: Active Learning Paths */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                Current Learning Path
              </h2>
              <Link to="/learning-setup" style={{ fontSize: '0.85rem', color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>
                + Add Topic
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeCourses.map((course) => (
                <div
                  key={course.id}
                  className="glass-card"
                  style={{
                    padding: '22px 24px',
                    borderRadius: '18px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: `${course.color}15`,
                          color: course.color,
                          textTransform: 'uppercase'
                        }}
                      >
                        {course.badge}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginTop: '6px' }}>
                        {course.title}
                      </h3>
                      <div style={{ fontSize: '0.88rem', color: '#64748B', marginTop: '2px' }}>
                        Active: <strong style={{ color: '#334155' }}>{course.currentTopic}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: course.color }}>
                        {course.progress}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Mastery: {course.mastery}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden', marginBottom: '14px' }}>
                    <div
                      style={{
                        width: `${course.progress}%`,
                        height: '100%',
                        background: course.color,
                        borderRadius: '999px',
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      Next: <strong style={{ color: '#0F172A' }}>{course.nextMilestone}</strong>
                    </span>
                    <Link
                      to="/learning-setup"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: course.color,
                        textDecoration: 'none'
                      }}
                    >
                      Continue ➔
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Personal Study Goals */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                Study Goals
              </h2>
            </div>

            <div
              className="glass-card"
              style={{
                padding: '24px',
                borderRadius: '18px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {studyGoals.map((goal) => (
                  <div
                    key={goal.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #F1F5F9'
                    }}
                  >
                    <CheckCircle2
                      size={18}
                      color={goal.status === 'completed' ? '#10B981' : '#CBD5E1'}
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: goal.status === 'completed' ? '#94A3B8' : '#1E293B',
                          textDecoration: goal.status === 'completed' ? 'line-through' : 'none'
                        }}
                      >
                        {goal.title}
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: goal.priority === 'high' ? '#EF4444' : '#3B82F6',
                          textTransform: 'uppercase'
                        }}
                      >
                        {goal.priority || 'medium'} priority
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '16px' }}>
                <Link
                  to="/progress"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    color: '#2563EB',
                    fontWeight: 700,
                    textDecoration: 'none',
                    padding: '8px',
                    borderRadius: '8px',
                    background: '#EFF6FF'
                  }}
                >
                  Manage All Goals ➔
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Diagnostic Breakdown: Strong, Needs Improvement, Past Work */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {/* Strong Areas */}
          <div
            className="glass-card"
            style={{
              padding: '24px',
              borderRadius: '18px',
              border: '1px solid #BBF7D0',
              background: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                <Zap size={18} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Strong Concepts
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {strongConcepts.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.86rem', color: '#166534', lineHeight: 1.4 }}>
                  <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Improvement */}
          <div
            className="glass-card"
            style={{
              padding: '24px',
              borderRadius: '18px',
              border: '1px solid #FECDD3',
              background: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E11D48' }}>
                <AlertCircle size={18} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Needs Improvement
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {weakConcepts.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.86rem', color: '#9F1239', lineHeight: 1.4 }}>
                  <AlertCircle size={16} color="#E11D48" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Past Work / Materials */}
          <div
            className="glass-card"
            style={{
              padding: '24px',
              borderRadius: '18px',
              border: '1px solid #BFDBFE',
              background: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                  <History size={18} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Recent Activity
                </h3>
              </div>
              <Link to="/history" style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>
                All History ➔
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historyData.slice(0, 3).map((hist) => (
                <div key={hist.id} style={{ padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                    {hist.title}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>
                    Score: <strong style={{ color: '#059669' }}>{hist.score}</strong> • {new Date(hist.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {historyData.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
                  No recent activities recorded yet. Click <strong>Start Learning</strong> to begin.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Assessment Scores Section */}
        <div
          className="glass-card"
          style={{
            padding: '24px 28px',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Recent Assessment Scores
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '2px' }}>
                Performance across quizzes and Socratic comprehension checks
              </p>
            </div>
            <Link to="/progress" style={{ fontSize: '0.85rem', color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>
              View Detailed Analytics ➔
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {assessmentScores.map((sc, i) => (
              <div
                key={i}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0'
                }}
              >
                <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>{sc.assessmentName}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB' }}>{sc.score}</span>
                  <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>/ {sc.total}</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '4px' }}>{sc.date}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 860px) {
          .dash-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
