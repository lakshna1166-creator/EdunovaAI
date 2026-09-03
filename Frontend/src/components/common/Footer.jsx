import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Github, Twitter, Linkedin, Sparkles } from 'lucide-react';
import { footerLinks } from '../../data/landingData';

export default function Footer() {
  return (
    <footer
      style={{
        background: '#F8FAFC',
        borderTop: '1px solid #E2E8F0',
        paddingTop: '64px',
        paddingBottom: '36px',
        position: 'relative',
        zIndex: 2,
        marginTop: 'auto'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '36px',
            marginBottom: '44px'
          }}
          className="footer-grid"
        >
          {/* Brand Column */}
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', textDecoration: 'none' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #0284C7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
              >
                <Brain size={20} color="#FFFFFF" />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                EduNova<span style={{ color: '#2563EB' }}>AI</span>
              </span>
            </Link>

            <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.65, maxWidth: '320px', marginBottom: '20px' }}>
              Next-generation personalized AI learning platform that adapts dynamically to how you understand, detects misconceptions in real time, and turns complex concepts into deep mastery.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                <Github size={18} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Explore
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {footerLinks.product.map((link) => (
                <Link key={link.label} to={link.path} style={{ fontSize: '0.88rem', color: '#64748B', textDecoration: 'none' }} onMouseEnter={(e) => (e.target.style.color = '#2563EB')} onMouseLeave={(e) => (e.target.style.color = '#64748B')}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Student Suite */}
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Learning Suite
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {footerLinks.studentSuite.map((link) => (
                <Link key={link.label} to={link.path} style={{ fontSize: '0.88rem', color: '#64748B', textDecoration: 'none' }} onMouseEnter={(e) => (e.target.style.color = '#2563EB')} onMouseLeave={(e) => (e.target.style.color = '#64748B')}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Account
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {footerLinks.account.map((link) => (
                <Link key={link.label} to={link.path} style={{ fontSize: '0.88rem', color: '#64748B', textDecoration: 'none' }} onMouseEnter={(e) => (e.target.style.color = '#2563EB')} onMouseLeave={(e) => (e.target.style.color = '#64748B')}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid #E2E8F0',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            fontSize: '0.85rem',
            color: '#64748B'
          }}
        >
          <div>
            © {new Date().getFullYear()} EduNovaAI. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#2563EB" />
            <span>AI-Powered Socratic Personalized Learning Engine</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 30px !important;
          }
        }
        @media (max-width: 600px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
