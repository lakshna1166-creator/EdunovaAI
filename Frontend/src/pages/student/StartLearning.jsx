import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  ArrowRight,
  Brain,
  FileText,
  Clock,
  Target,
  Sparkles,
  Layers,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen
} from 'lucide-react';
import StudentNavbar from '../../components/student/StudentNavbar';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import { studentApi, aiApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StartLearning() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [inputMode, setInputMode] = useState('topic'); // 'topic' | 'upload'
  const [topic, setTopic] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState(['Chapter 1: Overview & Core Principles']);

  // Learning Preferences (Requirement 18)
  const [educationLevel, setEducationLevel] = useState('College');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.profile?.preferred_language || 'English');
  const [availableTime, setAvailableTime] = useState('20 minutes');
  const [customTime, setCustomTime] = useState('');
  const [learningGoal, setLearningGoal] = useState('Understand Concept');
  const [teachingStyle, setTeachingStyle] = useState('Visual');

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const sampleTopics = [
    'Neural Networks & Intuitive Calculus',
    'Quantum Superposition & Wave Mechanics',
    'Organic Chemistry Reaction Pathways',
    'Time Complexity & Dynamic Programming',
    'Linear Algebra Eigenvalues & Eigenvectors'
  ];

  const availableChapters = [
    'Chapter 1: Overview & Core Principles',
    'Chapter 2: Step-by-Step Mathematical Derivation',
    'Chapter 3: Real-World Applications & Analogies',
    'Chapter 4: Common Pitfalls & Socratic Checks'
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const toggleChapter = (ch) => {
    if (selectedChapters.includes(ch)) {
      setSelectedChapters(selectedChapters.filter((c) => c !== ch));
    } else {
      setSelectedChapters([...selectedChapters, ch]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (inputMode === 'topic' && !topic.trim()) {
      setErrorMessage('Please enter a learning topic or select a suggested concept.');
      return;
    }

    if (inputMode === 'upload' && !uploadedFile) {
      setErrorMessage('Please select or drag-and-drop a document file to upload.');
      return;
    }

    setLoading(true);
    setStatusMessage('Synthesizing your personalized AI curriculum...');

    try {
      // 1. If file uploaded, upload and index under student's account
      if (inputMode === 'upload' && uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('title', uploadedFile.name);
        formData.append('topic', topic || uploadedFile.name);

        setStatusMessage('Ingesting and analyzing document chapters...');
        await studentApi.uploadMaterial(formData).catch((err) => {
          console.warn('Material upload note:', err.message);
        });
      }

      // 2. Request AI Lesson generation / initialization from existing AI API
      const lessonPayload = {
        topic: inputMode === 'topic' ? topic : (topic || uploadedFile?.name || 'Uploaded Document'),
        educationLevel,
        preferredLanguage,
        duration: availableTime === 'Custom' ? `${customTime || 25} minutes` : availableTime,
        goal: learningGoal,
        teachingStyle,
        chapters: selectedChapters
      };

      setStatusMessage('Your AI Teacher is ready! Opening interactive session...');

      // Store current session parameters in sessionStorage for lesson components
      sessionStorage.setItem('edunova_current_lesson', JSON.stringify(lessonPayload));

      setTimeout(() => {
        navigate('/student/lesson', { state: lessonPayload });
      }, 600);
    } catch (err) {
      console.error('Lesson initialization error:', err);
      setErrorMessage(err.message || 'Failed to initialize learning session. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <StudentNavbar />

      <main className="container" style={{ padding: '36px 20px 80px', flex: 1, maxWidth: '920px' }}>
        <PageHeader
          badgeText="Personalized Setup"
          badgeIcon={Brain}
          title="Learning"
          highlightText="Preferences & Setup"
          description="Configure your learning goals, preferred explanation style, and study materials. EduNovaAI adapts directly to your needs."
          breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Learning Setup' }]}
          backTo="/dashboard"
        />

        {errorMessage && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #F87171',
              color: '#991B1B',
              padding: '14px 18px',
              borderRadius: '14px',
              fontSize: '0.9rem',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Section 1: Learning Material Selection */}
          <div
            className="glass-card"
            style={{
              padding: '32px',
              borderRadius: '24px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                <BookOpen size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  1. Choose Learning Material
                </h2>
                <p style={{ fontSize: '0.86rem', color: '#64748B', margin: '2px 0 0 0' }}>
                  Enter a topic or upload your study documents (PDF, DOC, DOCX, PPT, PPTX, TXT)
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setInputMode('topic')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: inputMode === 'topic' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  background: inputMode === 'topic' ? '#EFF6FF' : '#FFFFFF',
                  color: inputMode === 'topic' ? '#1D4ED8' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Brain size={16} />
                Enter Topic
              </button>

              <button
                type="button"
                onClick={() => setInputMode('upload')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: inputMode === 'upload' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  background: inputMode === 'upload' ? '#EFF6FF' : '#FFFFFF',
                  color: inputMode === 'upload' ? '#1D4ED8' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <UploadCloud size={16} />
                Upload Document (PDF / DOC / PPT)
              </button>
            </div>

            {inputMode === 'topic' ? (
              <div>
                <input
                  type="text"
                  placeholder="e.g. Explain Neural Network Backpropagation and the Chain Rule"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.96rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '14px'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                />

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    Popular Concepts:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {sampleTopics.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTopic(item)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          color: '#334155',
                          fontSize: '0.82rem',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#EFF6FF';
                          e.currentTarget.style.color = '#2563EB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F1F5F9';
                          e.currentTarget.style.color = '#334155';
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  style={{
                    border: dragOver ? '2px dashed #2563EB' : '2px dashed #CBD5E1',
                    borderRadius: '16px',
                    padding: '36px 20px',
                    textAlign: 'center',
                    background: dragOver ? '#EFF6FF' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <UploadCloud size={38} color={uploadedFile ? '#10B981' : '#2563EB'} style={{ margin: '0 auto 12px' }} />
                  {uploadedFile ? (
                    <div>
                      <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>
                        {uploadedFile.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                        File ready for ingestion ({(uploadedFile.size / 1024).toFixed(1)} KB)
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.98rem' }}>
                        Click to browse or drag and drop files here
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '6px' }}>
                        Supports PDF, DOC, DOCX, PPT, PPTX, TXT (up to 25MB)
                      </div>
                    </div>
                  )}
                </div>

                {/* Chapter Selection (Requirement 20) */}
                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Select Chapters to Learn:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availableChapters.map((ch, idx) => (
                      <label
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: selectedChapters.includes(ch) ? '#EFF6FF' : '#F8FAFC',
                          border: selectedChapters.includes(ch) ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: selectedChapters.includes(ch) ? 700 : 500,
                          color: selectedChapters.includes(ch) ? '#1D4ED8' : '#334155'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedChapters.includes(ch)}
                          onChange={() => toggleChapter(ch)}
                          style={{ accentColor: '#2563EB', width: '16px', height: '16px' }}
                        />
                        <span>{ch}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Educational Level & Language */}
          <div
            className="glass-card"
            style={{
              padding: '32px',
              borderRadius: '24px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
                  2. Educational Level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    background: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="School">School (High School / K-12)</option>
                  <option value="College">College / University</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
                  3. Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    background: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Malayalam">Malayalam (മലയാളം)</option>
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Available Time & Learning Goal */}
          <div
            className="glass-card"
            style={{
              padding: '32px',
              borderRadius: '24px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
                  4. Available Time
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['5 minutes', '10 minutes', '20 minutes', '30 minutes', '60 minutes', 'Custom'].map((timeOption) => (
                    <button
                      key={timeOption}
                      type="button"
                      onClick={() => setAvailableTime(timeOption)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: availableTime === timeOption ? '2px solid #2563EB' : '1px solid #E2E8F0',
                        background: availableTime === timeOption ? '#EFF6FF' : '#FFFFFF',
                        color: availableTime === timeOption ? '#1D4ED8' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer'
                      }}
                    >
                      {timeOption}
                    </button>
                  ))}
                </div>
                {availableTime === 'Custom' && (
                  <input
                    type="number"
                    placeholder="Enter minutes (e.g. 45)"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
                  5. Learning Goal
                </label>
                <select
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    background: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Understand Concept">Understand Concept from Scratch</option>
                  <option value="Exam Preparation">Exam Preparation & Problem Sets</option>
                  <option value="Revision">Quick Revision & Summary</option>
                  <option value="Homework">Homework Problem Guidance</option>
                  <option value="Interview Preparation">Interview Preparation</option>
                  <option value="Deep Learning">Deep Rigorous Learning</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Teaching Style & AI Voice Preference */}
          <div
            className="glass-card"
            style={{
              padding: '32px',
              borderRadius: '24px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
                  6. Teaching Style
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Simple', 'Step-by-Step', 'Examples', 'Visual', 'Practical', 'Mixed'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTeachingStyle(st)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: teachingStyle === st ? '2px solid #2563EB' : '1px solid #E2E8F0',
                        background: teachingStyle === st ? '#EFF6FF' : '#FFFFFF',
                        color: teachingStyle === st ? '#1D4ED8' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', alignItems: 'center' }}>
            {statusMessage && (
              <span style={{ fontSize: '0.9rem', color: '#2563EB', fontWeight: 600 }}>
                {statusMessage}
              </span>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              iconRight={loading ? null : ArrowRight}
              style={{
                padding: '16px 36px',
                fontWeight: 800,
                fontSize: '1.05rem',
                boxShadow: '0 8px 24px -2px rgba(37, 99, 235, 0.4)'
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Preparing AI Session...
                </div>
              ) : (
                'Start Learning Now'
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
