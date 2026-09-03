import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, Menu, X, ArrowRight, User, LogOut, Sparkles, BookOpen, BarChart2, History, Compass } from 'lucide-react';
import { navLinks } from '../../data/landingData';
import Button from './Button';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: scrolled
          ? '0 4px 20px -2px rgba(15, 23, 42, 0.08)'
          : '0 2px 10px -2px rgba(15, 23, 42, 0.04)',
        padding: scrolled ? '12px 0' : '15px 0'
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #0284C7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'transform 0.2s ease'
            }}
          >
            <Brain size={22} color="#FFFFFF" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.28rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A', lineHeight: 1.1 }}>
              EduNova<span style={{ color: '#2563EB', fontWeight: 800 }}>AI</span>
            </span>
            <span style={{ fontSize: '0.68rem', letterSpacing: '0.08em', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
              Personalized AI Learning
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          className="desktop-nav"
        >
          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/learning-setup"
                className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              >
                Learn
              </NavLink>
              <NavLink
                to="/progress"
                className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              >
                Progress
              </NavLink>
              <NavLink
                to="/history"
                className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              >
                History
              </NavLink>
            </>
          ) : (
            navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))
          )}
        </nav>

        {/* Desktop User Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="desktop-actions">
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  color: '#1D4ED8',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#2563EB',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}
                >
                  {user?.name?.charAt(0) || 'S'}
                </div>
                <span>{user?.name?.split(' ')[0] || 'Student'}</span>
              </button>

              {userMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '210px',
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 110
                  }}
                >
                  <Link
                    to="/dashboard"
                    className="dropdown-item"
                    style={{ textDecoration: 'none' }}
                  >
                    <BookOpen size={16} />
                    <span>My Dashboard</span>
                  </Link>
                  <Link
                    to="/learning-setup"
                    className="dropdown-item"
                    style={{ textDecoration: 'none' }}
                  >
                    <Compass size={16} />
                    <span>Start Learning</span>
                  </Link>
                  <Link
                    to="/progress"
                    className="dropdown-item"
                    style={{ textDecoration: 'none' }}
                  >
                    <BarChart2 size={16} />
                    <span>My Progress</span>
                  </Link>
                  <Link
                    to="/history"
                    className="dropdown-item"
                    style={{ textDecoration: 'none' }}
                  >
                    <History size={16} />
                    <span>Learning History</span>
                  </Link>
                  <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="dropdown-item"
                    style={{ color: '#EF4444', background: 'transparent', border: 'none', width: '100%', cursor: 'pointer' }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button variant="secondary" size="sm" to="/login" style={{ fontWeight: 700 }}>
                Login
              </Button>
              <Button
                variant="primary"
                size="sm"
                to="/signup"
                iconRight={ArrowRight}
                style={{ fontWeight: 700 }}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            color: '#0F172A',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)'
          }}
        >
          {isAuthenticated ? (
            <>
              <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Signed in as</span>
                <div style={{ fontWeight: 800, color: '#0F172A' }}>{user?.name || 'Student'}</div>
              </div>
              <NavLink to="/dashboard" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </NavLink>
              <NavLink to="/learning-setup" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                Learn
              </NavLink>
              <NavLink to="/progress" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                Progress
              </NavLink>
              <NavLink to="/history" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                History
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  color: '#EF4444',
                  background: '#FEF2F2',
                  border: '1px solid #FECDD3',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '12px'
                }}
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                <Button
                  variant="secondary"
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ fontWeight: 700 }}
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  to="/signup"
                  iconRight={ArrowRight}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ fontWeight: 700 }}
                >
                  Get Started Free
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .nav-link-item {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.925rem;
          font-weight: 700;
          color: #334155;
          text-decoration: none;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), 
                      color 0.25s ease, 
                      background-color 0.25s ease;
          display: inline-block;
        }
        .nav-link-item:hover {
          color: #2563EB;
          background: #F1F5F9;
          transform: translateY(-1px);
        }
        .nav-link-item.active {
          color: #2563EB;
          font-weight: 800;
          background: #EFF6FF;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #334155;
          transition: all 0.2s ease;
        }
        .dropdown-item:hover {
          background: #F1F5F9;
          color: #2563EB;
        }
        .mobile-nav-link {
          font-size: 1rem;
          font-weight: 700;
          color: #334155;
          padding: 10px 14px;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .mobile-nav-link:hover {
          color: #2563EB;
          background: #F1F5F9;
        }
        .mobile-nav-link.active {
          color: #2563EB;
          background: #EFF6FF;
          font-weight: 800;
        }
        @media (max-width: 900px) {
          .desktop-nav, .desktop-actions {
            display: none !important;
          }
          .mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}
