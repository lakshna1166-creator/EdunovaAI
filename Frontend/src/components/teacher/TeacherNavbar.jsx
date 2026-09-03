import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { School, LayoutDashboard, PlusSquare, Edit3, BarChart3, UploadCloud, Menu, X, ArrowLeft } from 'lucide-react';

export default function TeacherNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const teacherLinks = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Create Lesson', path: '/teacher/create-lesson', icon: PlusSquare },
    { label: 'Lesson Editor', path: '/teacher/lesson-editor', icon: Edit3 },
    { label: 'Cohort Analytics', path: '/teacher/analytics', icon: BarChart3 },
    { label: 'Publish', path: '/teacher/publish', icon: UploadCloud },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        padding: '12px 0'
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left: Brand & Educator Suite Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0D9488, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)'
              }}
            >
              <School size={18} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
              EduMind <span style={{ color: '#0D9488' }}>AI</span>
            </span>
          </Link>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '999px',
              background: '#F0FDF4',
              color: '#0D9488',
              border: '1px solid #BBF7D0',
              textTransform: 'uppercase'
            }}
          >
            Educator Suite
          </span>
        </div>

        {/* Center: Desktop Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="teacher-desktop-nav">
          {teacherLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `teacher-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right: Quick Actions & Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: '#475569',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0F172A';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            <ArrowLeft size={14} />
            <span className="exit-text">Public Site</span>
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="teacher-mobile-toggle"
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: '#0F172A',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.1)'
          }}
        >
          {teacherLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `teacher-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}

      <style>{`
        .teacher-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #475569;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .teacher-nav-link:hover {
          color: #0F172A;
          background: #F1F5F9;
        }
        .teacher-nav-link.active {
          color: #0D9488;
          background: #F0FDF4;
          font-weight: 600;
        }
        @media (max-width: 900px) {
          .teacher-desktop-nav {
            display: none !important;
          }
          .teacher-mobile-toggle {
            display: block !important;
          }
        }
        @media (max-width: 600px) {
          .exit-text {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
