import React, { useEffect, useState } from 'react';
import { 
  Brain, 
  ShieldCheck, 
  Zap,
  Award,
  Layers,
  Dna
} from 'lucide-react';
import StudentNavbar from '../../components/student/StudentNavbar';
import PageHeader from '../../components/common/PageHeader';
import AILearningDNA from '../../components/innovative/AILearningDNA';
import KnowledgeMasteryMap from '../../components/innovative/KnowledgeMasteryMap';
import { studentApi, analyticsApi } from '../../services/api';

export default function LearningProfile() {
  const [profile, setProfile] = useState(null);
  const [mastery, setMastery] = useState([]);
  const [misconceptions, setMisconceptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([studentApi.getProfile(), analyticsApi.getMasteryMap(), analyticsApi.getMisconceptions()])
      .then(([p, m, c]) => {
        setProfile(p?.data || null);
        setMastery(m?.data || []);
        setMisconceptions(c?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const learningDNA = profile?.learningDNA || {};
  const verifiedPrereqs = mastery.filter(x => Number(x.mastery || 0) >= 80).map(x => ({
    subject: 'Learning topic', topic: x.title, score: `${Number(x.mastery || 0)}%`
  }));

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <StudentNavbar />
      <main className="container" style={{ padding: '36px 24px 80px', flex: 1, maxWidth: '1050px' }}>
        <PageHeader badgeText="Cognitive Engine Profile" badgeIcon={Brain} title="Your AI" highlightText="Learning DNA & Cognitive Model" description="Your learning profile is built from your own activity. Nothing is pre-filled as mastered before you learn." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Learning Profile' }]} backTo="/dashboard" />

        {loading ? (
          <div className="glass-card" style={{ padding: '36px', textAlign: 'center', background: '#FFFFFF' }}>Loading your learning profile...</div>
        ) : (
          <>
            <div style={{ marginBottom: '32px' }}>
              <AILearningDNA data={learningDNA} />
            </div>
            <div style={{ marginBottom: '32px' }}>
              <KnowledgeMasteryMap data={mastery} />
            </div>
            <div className="grid-2" style={{ gap: '28px' }}>
              <div className="glass-card" style={{ padding: '28px', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><ShieldCheck size={20} color="#059669" /><h3 style={{ fontSize: '1.2rem', color: '#0F172A' }}>Verified Prerequisites</h3></div>
                {verifiedPrereqs.length ? verifiedPrereqs.map((item, idx) => (
                  <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div><div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{item.subject}</div><div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{item.topic}</div></div>
                    <span style={{ height: 'fit-content', fontSize: '0.78rem', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '3px 10px', borderRadius: '999px', fontWeight: 800 }}>{item.score}</span>
                  </div>
                )) : <Empty text="No concepts have been mastered yet. Complete learning activities to build your mastery map." />}
              </div>
              <div className="glass-card" style={{ padding: '28px', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><Zap size={20} color="#D97706" /><h3 style={{ fontSize: '1.2rem', color: '#0F172A' }}>Conquered Misconceptions</h3></div>
                {misconceptions.length ? misconceptions.map((item, idx) => (
                  <div key={idx} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}><strong style={{ color: '#B45309' }}>{item.misconception}</strong><div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '6px' }}>{item.frequency}</div></div>
                )) : <Empty text="No misconceptions recorded yet. Your tutor will add learning signals as you practice." />}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ padding: '24px', borderRadius: '12px', background: '#F8FAFC', border: '1px dashed #CBD5E1', color: '#64748B', lineHeight: 1.6 }}>{text}</div>;
}
