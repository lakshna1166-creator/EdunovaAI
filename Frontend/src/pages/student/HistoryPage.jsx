import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, 
  BookOpen, 
  Award, 
  Bot, 
  UploadCloud, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Filter, 
  Loader2,
  FileText,
  CheckCircle2
} from 'lucide-react';
import StudentNavbar from '../../components/student/StudentNavbar';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import { studentApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function HistoryPage() {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'lesson' | 'quiz' | 'upload' | 'ai_chat'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const [histRes, matRes] = await Promise.all([
          studentApi.getHistory().catch(() => null),
          studentApi.getMaterials().catch(() => null)
        ]);

        if (isMounted) {
          if (histRes?.history) setHistoryItems(histRes.history);
          if (matRes?.materials) setMaterials(matRes.materials);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => { isMounted = false; };
  }, []);

  const studentName = user?.name || 'Student';

  const filteredHistory = historyItems.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'lesson':
        return <BookOpen size={18} color="#2563EB" />;
      case 'quiz':
        return <Award size={18} color="#7C3AED" />;
      case 'upload':
        return <UploadCloud size={18} color="#059669" />;
      case 'ai_chat':
        return <Bot size={18} color="#D97706" />;
      default:
        return <History size={18} color="#64748B" />;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'lesson':
        return { label: 'Lesson', bg: '#EFF6FF', color: '#2563EB' };
      case 'quiz':
        return { label: 'Quiz', bg: '#FAF5FF', color: '#7C3AED' };
      case 'upload':
        return { label: 'Uploaded Material', bg: '#ECFDF5', color: '#059669' };
      case 'ai_chat':
        return { label: 'AI Socratic Chat', bg: '#FEF3C7', color: '#D97706' };
      default:
        return { label: 'Activity', bg: '#F1F5F9', color: '#475569' };
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
        <StudentNavbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#2563EB' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>Loading your personal learning history...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <StudentNavbar />

      <main className="container" style={{ padding: '36px 20px 80px', flex: 1, maxWidth: '960px' }}>
        <PageHeader
          badgeText="Learning Records"
          badgeIcon={History}
          title="Personal Learning"
          highlightText="Activity History"
          description={`Review past learning sessions, completed lessons, uploaded study documents, and quiz assessments, ${studentName}.`}
          breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'History' }]}
          backTo="/dashboard"
        />

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'lesson', label: 'Lessons' },
            { id: 'quiz', label: 'Quizzes & Assessments' },
            { id: 'upload', label: 'Uploaded Materials' },
            { id: 'ai_chat', label: 'AI Tutor Sessions' }
          ].map((flt) => (
            <button
              key={flt.id}
              type="button"
              onClick={() => setFilterType(flt.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: filterType === flt.id ? '1px solid #2563EB' : '1px solid #E2E8F0',
                background: filterType === flt.id ? '#2563EB' : '#FFFFFF',
                color: filterType === flt.id ? '#FFFFFF' : '#334155',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
              }}
            >
              {flt.label}
            </button>
          ))}
        </div>

        {/* Uploaded Materials Summary Strip if any */}
        {materials.length > 0 && filterType !== 'quiz' && filterType !== 'lesson' && filterType !== 'ai_chat' && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', background: '#FFFFFF', border: '1px solid #E2E8F0', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Your Uploaded Study Materials ({materials.length})
              </h2>
              <Link to="/learning-setup" style={{ fontSize: '0.82rem', color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>
                + Upload New
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color="#2563EB" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {mat.fileName}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Topic: {mat.topic} • {mat.fileSize}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Activities List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredHistory.map((item) => {
            const badge = getTypeBadge(item.type);

            return (
              <div
                key={item.id}
                className="glass-card"
                style={{
                  padding: '22px 26px',
                  borderRadius: '20px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '18px'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: badge.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {getTypeIcon(item.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: badge.bg,
                        color: badge.color,
                        textTransform: 'uppercase'
                      }}
                    >
                      {badge.label}
                    </span>

                    <span style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0F172A', margin: '4px 0 6px 0' }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                    {item.details}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #F8FAFC' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      Topic: <strong style={{ color: '#0F172A' }}>{item.topic}</strong>
                    </span>

                    {item.score && (
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px' }}>
                        Result: {item.score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredHistory.length === 0 && (
            <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              <History size={36} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.15rem', color: '#0F172A', fontWeight: 700, marginBottom: '6px' }}>
                No history records found for this filter
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '20px' }}>
                Start an interactive session or upload a document to build your learning history.
              </p>
              <Button variant="primary" to="/learning-setup" style={{ fontWeight: 700 }}>
                Start Learning Now
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
