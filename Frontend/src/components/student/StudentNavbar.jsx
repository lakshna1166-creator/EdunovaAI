import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Brain, Flame, User, LayoutDashboard, PlusCircle, BookOpen, Bot, Award, BarChart2, Menu, X, ArrowLeft, LogOut, History, Compass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StudentNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const studentLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Learn', path: '/learning-setup', icon: Compass },
    { label: 'Progress', path: '/progress', icon: BarChart2 },
    { label: 'History', path: '/history', icon: History },
    { label: 'AI Tutor', path: '/student/teacher', icon: Bot },
    { label: 'Profile', path: '/profile', icon: User }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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
        {/* Left: Brand & Student Portal Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
              }}
            >
              <Brain size={20} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              EduNova<span style={{ color: '#2563EB' }}>AI</span>
            </span>
          </Link>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '999px',
              background: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE',
              textTransform: 'uppercase'
            }}
          >
            Student Suite
          </span>
        </div>

        {/* Center: Desktop Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="student-desktop-nav">
          {studentLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `student-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right: Quick Stats, Student Name, and Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '8px',
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              color: '#D97706',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
            className="student-streak"
          >
            <Flame size={15} />
            <span>{user?.profile?.streak_days || 3}-Day Streak</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: '#64748B',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#DC2626';
              e.currentTarget.style.borderColor = '#FECDD3';
              e.currentTarget.style.background = '#FEF2F2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748B';
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.background = '#FFFFFF';
            }}
          >
            <LogOut size={14} />
            <span className="exit-text">Logout</span>
          </button>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="student-mobile-toggle"
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
          {studentLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `student-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              color: '#EF4444',
              background: '#FEF2F2',
              border: '1px solid #FECDD3',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}

      <style>{`
        .student-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .student-nav-link:hover {
          color: #0F172A;
          background: #F1F5F9;
        }
        .student-nav-link.active {
          color: #2563EB;
          background: #EFF6FF;
          font-weight: 700;
        }
        @media (max-width: 1024px) {
          .student-desktop-nav {
            display: none !important;
          }
          .student-mobile-toggle {
            display: block !important;
          }
        }
        @media (max-width: 600px) {
          .exit-text {
            display: none;
          }
          .student-streak {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
