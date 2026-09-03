import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Badge from './Badge';

export default function PageHeader({
  badgeText,
  badgeIcon,
  title,
  highlightText,
  description,
  breadcrumbs = [],
  showBack = true,
  backTo,
  children
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div style={{ marginBottom: '36px' }}>
      {/* Top row: Breadcrumbs & Back button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {showBack && (
            <button
              onClick={handleBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0F172A';
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}

          {breadcrumbs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748B' }}>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight size={14} color="#94A3B8" />}
                  {crumb.path ? (
                    <Link to={crumb.path} style={{ color: '#475569', textDecoration: 'none', fontWeight: 500 }} onMouseEnter={(e) => (e.target.style.color = '#2563EB')} onMouseLeave={(e) => (e.target.style.color = '#475569')}>
                      {crumb.label}
                    </Link>
                  ) : (
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {badgeText && (
          <Badge icon={badgeIcon}>{badgeText}</Badge>
        )}
      </div>

      {/* Main Title & Description */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', color: '#0F172A', marginBottom: '8px' }}>
            {title} {highlightText && <span className="gradient-text-brand">{highlightText}</span>}
          </h1>
          {description && (
            <p style={{ fontSize: '1rem', color: '#475569', maxWidth: '700px', lineHeight: 1.6 }}>
              {description}
            </p>
          )}
        </div>

        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
