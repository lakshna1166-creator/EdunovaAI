import React from 'react';
import { heroStats } from '../../data/landingData';

export default function MetricsStrip() {
  return (
    <section style={{ padding: '36px 0', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
            textAlign: 'center'
          }}
          className="metrics-grid"
        >
          {heroStats.map((stat, i) => (
            <div
              key={i}
              style={{
                padding: '16px 20px',
                borderRadius: '16px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(37, 99, 235, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
              }}
            >
              <div
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  background: 'linear-gradient(135deg, #0F172A 30%, #2563EB 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '4px'
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 14px !important;
          }
        }
      `}</style>
    </section>
  );
}
