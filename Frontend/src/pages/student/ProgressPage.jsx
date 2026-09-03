import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Clock, 
  BookOpen, 
  Loader2,
  PlusCircle,
  Target
} from 'lucide-react';
import StudentNavbar from '../../components/student/StudentNavbar';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import { studentApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ProgressPage() {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState('medium');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProgress = async () => {
      try {
        const [progRes, goalsRes] = await Promise.all([
          studentApi.getProgress().catch(() => null),
          studentApi.getGoals().catch(() => null)
        ]);

        if (isMounted) {
          if (progRes?.data) setProgressData(progRes.data);
          if (goalsRes?.goals) setGoals(goalsRes.goals);
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProgress();
    return () => { isMounted = false; };
  }, []);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    try {
      const res = await studentApi.createGoal({
        title: newGoalTitle.trim(),
        priority: newGoalPriority
      });
      if (res?.goal) {
        setGoals([res.goal, ...goals]);
        setNewGoalTitle('');
      }
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const studentName = user?.name || progressData?.studentName || 'Student';
  const overallScore = progressData?.overallScore ?? 0;
  const lessonsCompleted = progressData?.lessonsCompleted ?? 0;
  const quizzesTaken = progressData?.quizzesTaken ?? 0;
  const totalHoursLearned = progressData?.totalHoursLearned ?? 0;

  const topicProgress = progressData?.topicProgress || [];

  const strongConcepts = progressData?.strongConcepts || [];

  const weakConcepts = progressData?.weakConcepts || [];

  const assessmentScores = progressData?.assessmentScores || [];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
        <StudentNavbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#2563EB' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>Loading your personalized progress analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <StudentNavbar />

      <main className="container" style={{ padding: '36px 20px 80px', flex: 1, maxWidth: '1080px' }}>
        <PageHeader
          badgeText="Analytics & Mastery"
          badgeIcon={BarChart2}
          title="Learning Progress &"
          highlightText="Mastery Analytics"
          description={`Track your personal comprehension trajectory, strengths, and areas for refinement, ${studentName}.`}
          breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Progress' }]}
          backTo="/dashboard"
        />

        {/* Top Summary Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="glass-card" style={{ padding: '24px', borderRadius: '18px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2563EB', marginBottom: '8px' }}>
              <TrendingUp size={20} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>Overall Mastery</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>{overallScore}%</div>
            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>Top 10% percentile</div>
          </div>

          <div className="glass-card" style={{ padding: '24px', borderRadius: '18px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#059669', marginBottom: '8px' }}>
              <BookOpen size={20} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>Lessons Mastered</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>{lessonsCompleted}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>Across all topics</div>
          </div>

          <div className="glass-card" style={{ padding: '24px', borderRadius: '18px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#7C3AED', marginBottom: '8px' }}>
              <Award size={20} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>Quizzes Passed</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>{quizzesTaken}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>88% average score</div>
          </div>

          <div className="glass-card" style={{ padding: '24px', borderRadius: '18px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#D97706', marginBottom: '8px' }}>
              <Clock size={20} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>Study Time</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>{totalHoursLearned}h</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>Personal active learning</div>
          </div>
        </div>

        {/* Topic Breakdown Section */}
        <div className="glass-card" style={{ padding: '28px 32px', borderRadius: '24px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '20px' }}>
            Topic Mastery Breakdown
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {topicProgress.map((tp, idx) => (
              <div key={idx} style={{ paddingBottom: '16px', borderBottom: idx < topicProgress.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>{tp.category}</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: '2px 0 0 0' }}>{tp.topic}</h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563EB' }}>{tp.progress}%</span>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{tp.completedModules}/{tp.totalModules} modules</div>
                  </div>
                </div>

                <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${tp.progress}%`, height: '100%', background: 'linear-gradient(90deg, #2563EB, #4F46E5)', borderRadius: '999px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column: Strong Concepts vs Needs Improvement */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid #BBF7D0', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={20} color="#059669" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Strong Concepts</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {strongConcepts.map((sc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.9rem', color: '#166534', lineHeight: 1.4 }}>
                  <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{sc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid #FECDD3', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertCircle size={20} color="#E11D48" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Needs Improvement</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {weakConcepts.map((wc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.9rem', color: '#9F1239', lineHeight: 1.4 }}>
                  <AlertCircle size={16} color="#E11D48" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{wc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Study Goals Manager */}
        <div className="glass-card" style={{ padding: '28px 32px', borderRadius: '24px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>
            Manage Your Study Goals
          </h2>

          <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="e.g. Master Chain Rule derivations before Friday"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              style={{
                flex: 1,
                minWidth: '240px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
            <select
              value={newGoalPriority}
              onChange={(e) => setNewGoalPriority(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                fontSize: '0.95rem',
                outline: 'none',
                background: '#FFFFFF'
              }}
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <Button type="submit" variant="primary" size="md" icon={PlusCircle} style={{ fontWeight: 700 }}>
              Add Goal
            </Button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {goals.map((g) => (
              <div
                key={g.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={18} color={g.status === 'completed' ? '#059669' : '#94A3B8'} />
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: g.status === 'completed' ? '#94A3B8' : '#0F172A', textDecoration: g.status === 'completed' ? 'line-through' : 'none' }}>
                    {g.title}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: g.priority === 'high' ? '#FEE2E2' : '#EFF6FF', color: g.priority === 'high' ? '#DC2626' : '#2563EB', textTransform: 'uppercase' }}>
                  {g.priority || 'medium'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
