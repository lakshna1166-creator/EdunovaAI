import React from 'react';
import { Brain, Sparkles, BookOpen, Bot, GraduationCap } from 'lucide-react';

export default function AuthVisualShell({ children, mode = 'login' }) {
  return (
    <main className={`auth-page auth-page-${mode}`}>
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <div className="auth-grid" />
      <div className="auth-floating auth-floating-one"><BookOpen size={18} /></div>
      <div className="auth-floating auth-floating-two"><Bot size={20} /></div>
      <div className="auth-floating auth-floating-three"><GraduationCap size={19} /></div>

      <section className="auth-layout">
        <div className="auth-brand-panel">
          <div className="auth-brand-mark"><Brain size={25} /></div>
          <div className="auth-brand-name">EduNova<span>AI</span></div>
          <div className="auth-eyebrow"><Sparkles size={14} /> Adaptive learning, reimagined</div>
          <h1>{mode === 'signup' ? 'Build a learning journey that adapts to you.' : 'Learning that understands how you learn.'}</h1>
          <p>One calm space for personalized lessons, AI guidance, practice and progress.</p>
          <div className="auth-trust-row"><span /><span /><span /><small>Designed for focused learning</small></div>
        </div>
        <div className="auth-card-wrap"><div className="auth-swap-ghost" aria-hidden="true" />{children}</div>
      </section>
    </main>
  );
}
